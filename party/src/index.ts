import type * as Party from "partykit/server";
import { CODE_TEMPLATES } from "./codeTemplates";
import {
  applyError,
  findInsertionPoints,
  type ErrorType,
} from "./errorApplicators";

interface Player {
  id: string;
  name: string;
  currency: number;
  isHost: boolean;
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
  /** Original content before error was applied (to restore on correct guess) */
  originalContent?: string;
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
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
];

let errorSpawnInterval: ReturnType<typeof setInterval> | null = null;

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(
    connection: Party.Connection,
    ctx: Party.ConnectionContext
  ): Promise<void> {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") ?? "Player";
    const isHost = url.searchParams.get("host") === "1";
    const languagesParam = url.searchParams.get("languages") ?? "javascript";
    const languages = languagesParam.split(",").filter(Boolean);

    const player: Player = {
      id: connection.id,
      name,
      currency: 0,
      isHost,
    };

    connection.setState({ player });

    const state = (await this.room.storage.get<GameState>("gameState")) ?? {
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
          await this.handleStartGame(sender, state);
          break;
        case "guess":
          await this.handleGuess(sender, msg, state);
          break;
        case "buy_powerup":
          await this.handleBuyPowerup(sender, msg, state);
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
      state.players = state.players.filter((p) => p.id !== connection.id);
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
        JSON.stringify({ type: "state", state: { phase: "lobby", files: [], errors: [] } })
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
    presences[sender.id] = {
      id: sender.id,
      name: player.name,
      file: msg.file,
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
    state: GameState
  ): Promise<void> {
    const playerState = (await sender.state) as { player?: Player };
    if (!playerState?.player?.isHost || state.phase !== "lobby") return;

    const languages = state.languages.length ? state.languages : ["javascript"];
    const pool: FileContent[] = [];
    for (const lang of languages) {
      const templates = CODE_TEMPLATES[lang] ?? CODE_TEMPLATES["javascript"];
      if (templates) {
        for (const t of templates) {
          pool.push({ ...t });
        }
      }
    }
    if (pool.length === 0) {
      const def = CODE_TEMPLATES["javascript"];
      if (def) pool.push(...def.map((f) => ({ ...f })));
    }
    const targetCount = 2 + Math.floor(Math.random() * 5);
    const count = Math.min(pool.length, targetCount);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    let files = shuffled.slice(0, count);
    while (files.length < 2 && pool.length > 0) {
      const src = pool[files.length % pool.length]!;
      files.push({ ...src, name: `copy-${files.length}-${src.name}` });
    }

    state.phase = "playing";
    state.files = files;
    state.errors = [];
    await this.room.storage.put("gameState", state);

    this.room.broadcast(
      JSON.stringify({ type: "state", state: { phase: "playing", files } })
    );

    this.scheduleErrorSpawn();
  }

  private scheduleErrorSpawn(): void {
    if (errorSpawnInterval) clearInterval(errorSpawnInterval);
    errorSpawnInterval = setInterval(async () => {
      const state =
        (await this.room.storage.get<GameState>("gameState")) ?? null;
      if (!state || state.phase !== "playing") {
        if (errorSpawnInterval) {
          clearInterval(errorSpawnInterval);
          errorSpawnInterval = null;
        }
        return;
      }
      if (state.errors.length >= state.errorThreshold) {
        state.phase = "gameover";
        await this.room.storage.put("gameState", state);
        this.room.broadcast(
          JSON.stringify({ type: "gameOver", won: false })
        );
        if (errorSpawnInterval) {
          clearInterval(errorSpawnInterval);
          errorSpawnInterval = null;
        }
        return;
      }
      await this.spawnError(state);
    }, 15000);
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
    const error = state.errors.find((e) => e.id === msg.errorId);
    if (!error) return;

    const playerInState = state.players.find((p) => p.id === sender.id);
    if (!playerInState) return;

    if (error.type === msg.guessedType) {
      state.errors = state.errors.filter((e) => e.id !== msg.errorId);
      const award = 1;
      playerInState.currency += award;

      const file = state.files.find((f) => f.name === error.file);
      if (file && error.originalContent) {
        file.content = error.originalContent;
      }

      await this.room.storage.put("gameState", state);
      this.room.broadcast(
        JSON.stringify({
          type: "errorCorrected",
          errorId: msg.errorId,
          state: { players: state.players, files: state.files, errors: state.errors },
        })
      );
    } else {
      this.room.broadcast(
        JSON.stringify({ type: "guessWrong", errorId: msg.errorId })
      );
    }
  }

  private async handleBuyPowerup(
    sender: Party.Connection,
    msg: { powerupId: string; currentFile?: string },
    state: GameState
  ): Promise<void> {
    const playerInState = state.players.find((p) => p.id === sender.id);
    if (!playerInState) return;

    const powerupId = msg.powerupId;

    if (powerupId === "highlight_errors") {
      const cost = 10;
      if (playerInState.currency < cost) return;
      const currentFile =
        typeof msg.currentFile === "string" ? msg.currentFile.trim() : "";
      if (!currentFile) return;
      playerInState.currency -= cost;
      await this.room.storage.put("gameState", state);
      sender.send(
        JSON.stringify({
          type: "powerupResult",
          powerupId: "highlight_errors",
          data: { file: currentFile },
          state: { players: state.players },
        })
      );
      return;
    }

    if (powerupId === "find_errors") {
      const cost = 5;
      if (playerInState.currency < cost) return;
      playerInState.currency -= cost;
      await this.room.storage.put("gameState", state);
      const counts: Record<string, number> = {};
      for (const e of state.errors) {
        counts[e.file] = (counts[e.file] ?? 0) + 1;
      }
      sender.send(
        JSON.stringify({
          type: "powerupResult",
          powerupId: "find_errors",
          data: { counts },
          state: { players: state.players },
        })
      );
      return;
    }

    if (powerupId === "auto_fix_one") {
      const cost = 5;
      if (playerInState.currency < cost) return;
      if (state.errors.length === 0) return;
      playerInState.currency -= cost;
      const idx = Math.floor(Math.random() * state.errors.length);
      const error = state.errors[idx];
      if (!error) return;
      state.errors = state.errors.filter((e) => e.id !== error.id);
      const file = state.files.find((f) => f.name === error.file);
      if (file && error.originalContent) {
        file.content = error.originalContent;
      }
      await this.room.storage.put("gameState", state);
      this.room.broadcast(
        JSON.stringify({
          type: "state",
          state: {
            files: state.files,
            errors: state.errors,
            players: state.players,
          },
        })
      );
      return;
    }

    return;
  }
}
