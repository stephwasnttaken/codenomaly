import type * as Party from "partykit/server";
import { getMapFiles } from "./maps";
import { CODE_TEMPLATES } from "./codeTemplates";
import {
  applyError,
  findInsertionPoints,
  type ErrorType,
} from "./errorApplicators";

interface Player {
  id: string;
  name: string;
  stability: number;
  glitchedUntil?: number;
  isHost: boolean;
  errorsCaught?: number;
}

interface PlayerPresence {
  id: string;
  name: string;
  file: string;
  cursor: { line: number; column: number };
  color: string;
}

interface CodeError {
  id: string;
  file: string;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  type: ErrorType;
  /** Original content before this error was applied (to restore on correct guess) */
  originalContent?: string;
  /** Text at range before error was applied (needed to re-apply other errors in same file) */
  originalText?: string;
}

interface FileContent {
  name: string;
  content: string;
  language: string;
}

type GamePhase = "lobby" | "playing" | "gameover";

interface GameState {
  phase: GamePhase;
  players: Player[];
  files: FileContent[];
  errors: CodeError[];
  languages: string[];
  errorThreshold: number;
  returnedAfterGameOver?: string[];
  gameStartTime?: number;
  win?: boolean;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
];

const STABILITY_DRAIN_PER_ERROR_PER_SEC = 1;
const GLITCH_DURATION_MS = 8000;
const GLITCH_RECOVERY_STABILITY = 50;
const GAME_DURATION_MS = 5 * 60 * 1000;

let errorSpawnTimeout: ReturnType<typeof setTimeout> | null = null;
let stabilityInterval: ReturnType<typeof setInterval> | null = null;
let gameWinTimeout: ReturnType<typeof setTimeout> | null = null;

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(
    connection: Party.Connection,
    ctx: Party.ConnectionContext
  ): Promise<void> {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") ?? "Player";
    const isHost = url.searchParams.get("host") === "1";
    const languagesParam = url.searchParams.get("languages") ?? "csharp";
    const languages = languagesParam.split(",").filter(Boolean);

    const player: Player = {
      id: connection.id,
      name,
      stability: 100,
      isHost,
    };

    connection.setState({ player });

    const existingState = await this.room.storage.get<GameState>("gameState");
    if (!isHost && existingState == null) {
      connection.send(
        JSON.stringify({ type: "error", code: "invalid_lobby", message: "Invalid lobby code" })
      );
      connection.close();
      return;
    }

    const state = existingState ?? {
      phase: "lobby" as GamePhase,
      players: [],
      files: [],
      errors: [],
      languages: isHost ? languages : [],
      errorThreshold: 5,
      returnedAfterGameOver: [],
    };

    state.players = state.players.filter((p) => p.id !== connection.id);
    state.players.push(player);
    if (isHost && languages.length) state.languages = languages;

    await this.room.storage.put("gameState", state);

    connection.send(
      JSON.stringify({
        type: "init",
        state,
        playerId: connection.id,
      })
    );

    this.broadcastPlayers();
  }

  async onMessage(
    message: string | ArrayBuffer,
    sender: Party.Connection
  ): Promise<void> {
    if (typeof message !== "string") return;
    try {
      const msg = JSON.parse(message);
      const state = (await this.room.storage.get<GameState>("gameState")) ?? null;
      if (!state) return;

      switch (msg.type) {
        case "presence":
          await this.handlePresence(sender, msg);
          break;
        case "start_game":
          await this.handleStartGame(sender, msg, state);
          break;
        case "guess":
          await this.handleGuess(sender, msg, state);
          break;
        case "select_file":
          break;
        case "chat":
          await this.handleChat(sender, msg);
          break;
        case "return_to_lobby":
          await this.handleReturnToLobby(sender, state);
          break;
      }
    } catch (e) {
      console.error("Message error:", e);
    }
  }

  async onClose(connection: Party.Connection): Promise<void> {
    const state = (await this.room.storage.get<GameState>("gameState")) ?? null;
    if (state) {
      const leavingPlayer = state.players.find((p) => p.id === connection.id);
      state.players = state.players.filter((p) => p.id !== connection.id);
      if (leavingPlayer?.isHost && state.players.length > 0) {
        state.players[0]!.isHost = true;
      }
      if (state.phase === "gameover" && state.returnedAfterGameOver) {
        state.returnedAfterGameOver = state.returnedAfterGameOver.filter(
          (id) => id !== connection.id
        );
        await this.checkAllReturned(state);
      }
      await this.room.storage.put("gameState", state);
      this.broadcastPlayers();
    }
    const presences =
      (await this.room.storage.get<Record<string, PlayerPresence>>(
        "presences"
      )) ?? {};
    delete presences[connection.id];
    await this.room.storage.put("presences", presences);
    this.room.broadcast(
      JSON.stringify({ type: "presence", presences: Object.values(presences) })
    );
  }

  private async handleReturnToLobby(
    sender: Party.Connection,
    state: GameState
  ): Promise<void> {
    if (state.phase !== "gameover") return;
    if (!state.returnedAfterGameOver) state.returnedAfterGameOver = [];
    if (state.returnedAfterGameOver.includes(sender.id)) return;
    state.returnedAfterGameOver.push(sender.id);
    await this.room.storage.put("gameState", state);
    await this.checkAllReturned(state);
  }

  private async checkAllReturned(state: GameState): Promise<void> {
    const connections = [...this.room.getConnections()];
    const connectionIds = new Set(connections.map((c) => c.id));
    const returned = new Set(state.returnedAfterGameOver ?? []);
    const allReturned =
      connectionIds.size > 0 &&
      [...connectionIds].every((id) => returned.has(id));
    if (allReturned) {
      state.phase = "lobby";
      state.returnedAfterGameOver = [];
      state.files = [];
      state.errors = [];
      await this.room.storage.put("gameState", state);
      this.room.broadcast(
        JSON.stringify({
          type: "state",
          state: {
            phase: "lobby",
            files: [],
            errors: [],
            players: state.players,
          },
        })
      );
    }
  }

  private async handleChat(
    sender: Party.Connection,
    msg: { text?: string }
  ): Promise<void> {
    const text = typeof msg.text === "string" ? msg.text.trim() : "";
    if (!text) return;
    const state = (await sender.state) as { player?: Player };
    const senderName = state?.player?.name ?? "Player";
    const chatMessage = {
      id: `chat_${Date.now()}_${sender.id}`,
      sender: senderName,
      senderId: sender.id,
      text,
      time: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    this.room.broadcast(
      JSON.stringify({ type: "chat", message: chatMessage })
    );
  }

  private async broadcastPlayers(): Promise<void> {
    const state = await this.room.storage.get<GameState>("gameState");
    if (state) {
      this.room.broadcast(
        JSON.stringify({ type: "state", state: { players: state.players } })
      );
    }
  }

  private async handlePresence(
    sender: Party.Connection,
    msg: { file: string; cursor: { line: number; column: number } }
  ): Promise<void> {
    const state = (await sender.state) as { player?: Player };
    const player = state?.player;
    if (!player) return;

    const presences =
      (await this.room.storage.get<Record<string, PlayerPresence>>(
        "presences"
      )) ?? {};
    const colorIndex =
      [...this.room.getConnections()].findIndex((c) => c.id === sender.id) % 6;
    const file = typeof msg.file === "string" ? msg.file.trim() : "";
    presences[sender.id] = {
      id: sender.id,
      name: player.name,
      file,
      cursor: msg.cursor,
      color: COLORS[colorIndex] ?? COLORS[0],
    };
    await this.room.storage.put("presences", presences);

    const list = Object.values(presences).filter((p) => p.id !== sender.id);
    sender.send(
      JSON.stringify({
        type: "presence",
        presences: Object.values(presences),
      })
    );
    this.room.broadcast(
      JSON.stringify({
        type: "presence",
        presences: Object.values(presences),
      }),
      [sender.id]
    );
  }

  private async broadcastPresences(): Promise<void> {
    const presences =
      (await this.room.storage.get<Record<string, PlayerPresence>>(
        "presences"
      )) ?? {};
    this.room.broadcast(
      JSON.stringify({ type: "presence", presences: Object.values(presences) })
    );
  }

  private async handleStartGame(
    sender: Party.Connection,
    msg: { mapId?: string },
    state: GameState
  ): Promise<void> {
    const playerState = (await sender.state) as { player?: Player };
    if (!playerState?.player?.isHost || state.phase !== "lobby") return;

    const lang = state.languages[0] ?? "javascript";
    const mapId = typeof msg.mapId === "string" ? msg.mapId : undefined;
    const mapFiles = getMapFiles(lang, mapId ?? "") ?? [];
    let files: FileContent[] = mapFiles.map((f) => ({
      name: f.name,
      content: f.content,
      language: f.language,
    }));

    if (files.length < 2) {
      const templates = CODE_TEMPLATES[lang] ?? CODE_TEMPLATES["csharp"];
      if (templates?.length) {
        files = templates.slice(0, 3).map((t) => ({ ...t }));
      }
      while (files.length < 2 && templates?.length) {
        const src = templates[files.length % templates.length]!;
        files.push({ ...src, name: `copy-${files.length}-${src.name}` });
      }
    }

    this.clearGameIntervals();
    state.phase = "playing";
    state.files = files;
    state.errors = [];
    state.gameStartTime = Date.now();
    state.win = undefined;
    state.errorThreshold = 5 + Math.max(0, state.players.length - 1);
    for (const p of state.players) {
      p.stability = 100;
      p.glitchedUntil = undefined;
      p.errorsCaught = 0;
    }
    await this.room.storage.put("gameState", state);
    this.room.broadcast(
      JSON.stringify({
        type: "state",
        state: {
          phase: "playing",
          files,
          errors: state.errors,
          players: state.players,
          gameStartTime: state.gameStartTime,
        },
      })
    );
    this.scheduleErrorSpawn();
    this.scheduleStabilityDrain();
    if (gameWinTimeout) clearTimeout(gameWinTimeout);
    gameWinTimeout = setTimeout(() => this.checkGameWin(), GAME_DURATION_MS);
    await this.spawnError(state);
  }

  private async checkGameWin(): Promise<void> {
    gameWinTimeout = null;
    const state =
      (await this.room.storage.get<GameState>("gameState")) ?? null;
    if (!state || state.phase !== "playing") return;
    state.phase = "gameover";
    state.win = true;
    await this.room.storage.put("gameState", state);
    this.clearGameIntervals();
    this.room.broadcast(
      JSON.stringify({
        type: "gameOver",
        won: true,
        state: { phase: "gameover", win: true, players: state.players },
      })
    );
  }

  private clearGameIntervals(): void {
    if (errorSpawnTimeout) {
      clearTimeout(errorSpawnTimeout);
      errorSpawnTimeout = null;
    }
    if (stabilityInterval) {
      clearInterval(stabilityInterval);
      stabilityInterval = null;
    }
    if (gameWinTimeout) {
      clearTimeout(gameWinTimeout);
      gameWinTimeout = null;
    }
  }

  private scheduleStabilityDrain(): void {
    if (stabilityInterval) clearInterval(stabilityInterval);
    stabilityInterval = setInterval(async () => {
      const state =
        (await this.room.storage.get<GameState>("gameState")) ?? null;
      const presences =
        (await this.room.storage.get<Record<string, PlayerPresence>>(
          "presences"
        )) ?? {};
      if (!state || state.phase !== "playing") {
        if (state?.phase !== "playing" && stabilityInterval) {
          clearInterval(stabilityInterval);
          stabilityInterval = null;
        }
        return;
      }
      let changed = false;
      for (const connId of Object.keys(presences)) {
        const presence = presences[connId];
        if (!presence) continue;
        const player = state.players.find((p) => p.id === connId);
        if (!player) continue;
        const now = Date.now();
        const currentStability = typeof player.stability === "number" && !Number.isNaN(player.stability)
          ? player.stability
          : 100;
        if (player.glitchedUntil != null) {
          if (now < player.glitchedUntil) continue;
          player.stability = GLITCH_RECOVERY_STABILITY;
          player.glitchedUntil = undefined;
          changed = true;
          continue;
        }
        const viewingFile = typeof presence.file === "string" ? presence.file.trim() : "";
        const errorsInFile = viewingFile
          ? state.errors.filter(
              (e) => (e.file || "").trim() === viewingFile
            ).length
          : 0;
        if (errorsInFile === 0) {
          if (viewingFile) {
            player.stability = Math.min(100, currentStability + 1);
            changed = true;
          }
          continue;
        }
        const drain =
          STABILITY_DRAIN_PER_ERROR_PER_SEC * errorsInFile;
        const next = Math.max(0, currentStability - drain);
        player.stability = next;
        if (next <= 0) {
          player.stability = 0;
          player.glitchedUntil = now + GLITCH_DURATION_MS;
        }
        changed = true;
      }
      if (changed) {
        await this.room.storage.put("gameState", state);
        this.room.broadcast(
          JSON.stringify({ type: "state", state: { players: state.players } })
        );
      }
    }, 1000);
  }

  private static readonly ERROR_SPAWN_INTERVAL_MS = 12000;

  private scheduleErrorSpawn(): void {
    const tick = async () => {
      const state =
        (await this.room.storage.get<GameState>("gameState")) ?? null;
      if (!state || state.phase !== "playing") {
        this.clearGameIntervals();
        return;
      }
      if (state.errors.length >= state.errorThreshold) {
        state.phase = "gameover";
        state.win = false;
        await this.room.storage.put("gameState", state);
        this.clearGameIntervals();
        this.room.broadcast(
          JSON.stringify({
            type: "gameOver",
            won: false,
            state: { phase: "gameover", win: false, players: state.players },
          })
        );
        return;
      }
      await this.spawnError(state);
      errorSpawnTimeout = setTimeout(tick, Server.ERROR_SPAWN_INTERVAL_MS);
    };
    errorSpawnTimeout = setTimeout(tick, Server.ERROR_SPAWN_INTERVAL_MS);
  }

  private async spawnError(state: GameState): Promise<void> {
    const fileIndex = Math.floor(Math.random() * state.files.length);
    const file = state.files[fileIndex];
    if (!file) return;

    const linesWithErrorsInFile = new Set(
      state.errors.filter((e) => e.file === file.name).map((e) => e.range.startLine)
    );
    const points = findInsertionPoints(file.content, file.language).filter(
      (p) => !linesWithErrorsInFile.has(p.range.startLine)
    );
    if (points.length === 0) return;

    const point = points[Math.floor(Math.random() * points.length)];
    const type =
      point.allowedTypes[
        Math.floor(Math.random() * point.allowedTypes.length)
      ];
    if (!type) return;

    const newContent = applyError(
      type,
      file.content,
      point.range,
      point.originalText
    );
    if (newContent === file.content) return;

    const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const error: CodeError = {
      id: errorId,
      file: file.name,
      range: point.range,
      type,
      originalContent: file.content,
      originalText: point.originalText,
    };

    file.content = newContent;
    state.errors.push(error);
    await this.room.storage.put("gameState", state);

    this.room.broadcast(
      JSON.stringify({
        type: "errorSpawned",
        error: { id: error.id, file: error.file, range: error.range },
        fileContent: file.content,
        state: { files: state.files, errors: state.errors },
      })
    );
  }

  private async handleGuess(
    sender: Party.Connection,
    msg: { errorId: string; guessedType: string },
    state: GameState
  ): Promise<void> {
    const freshState = (await this.room.storage.get<GameState>("gameState")) ?? state;
    const playerInState = freshState.players.find((p) => p.id === sender.id);
    if (!playerInState) return;
    if (
      playerInState.glitchedUntil != null &&
      Date.now() < playerInState.glitchedUntil
    )
      return;

    const error = freshState.errors.find((e) => e.id === msg.errorId);
    if (!error) {
      sender.send(
        JSON.stringify({ type: "guessErrorNotFound", state: { errors: freshState.errors } })
      );
      return;
    }

    const guessedType = (typeof msg.guessedType === "string" ? msg.guessedType.trim() : "").toLowerCase();
    const actualType = (typeof error.type === "string" ? error.type.trim() : "").toLowerCase();
    if (actualType && guessedType && actualType === guessedType) {
      freshState.errors = freshState.errors.filter((e) => e.id !== msg.errorId);
      playerInState.errorsCaught = (playerInState.errorsCaught ?? 0) + 1;

      const file = freshState.files.find((f) => f.name === error.file);
      if (file && error.originalContent !== undefined) {
        file.content = error.originalContent;
        const otherErrorsInFile = freshState.errors.filter(
          (e) => e.file === error.file && e.originalText !== undefined
        );
        for (const other of otherErrorsInFile) {
          file.content = applyError(
            other.type as ErrorType,
            file.content,
            other.range,
            other.originalText!
          );
        }
      }

      const current = typeof playerInState.stability === "number" && !Number.isNaN(playerInState.stability)
        ? playerInState.stability
        : 100;
      playerInState.stability = Math.min(100, current + 10);

      await this.room.storage.put("gameState", freshState);
      this.room.broadcast(
        JSON.stringify({
          type: "errorCorrected",
          errorId: msg.errorId,
          state: { files: freshState.files, errors: freshState.errors, players: freshState.players },
        })
      );
    } else {
      const current = typeof playerInState.stability === "number" && !Number.isNaN(playerInState.stability)
        ? playerInState.stability
        : 100;
      playerInState.stability = Math.max(0, current - 5);
      await this.room.storage.put("gameState", freshState);
      this.room.broadcast(
        JSON.stringify({
          type: "guessWrong",
          errorId: msg.errorId,
          state: { players: freshState.players },
        })
      );
    }
  }
}
