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
          // Optional: track per-connection file view
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
    const files: FileContent[] = [];
    for (const lang of languages) {
      const templates = CODE_TEMPLATES[lang] ?? CODE_TEMPLATES["javascript"];
      if (templates) {
        for (const t of templates) {
          files.push({ ...t });
        }
      }
    }
    if (files.length === 0) {
      const def = CODE_TEMPLATES["javascript"];
      if (def) files.push(...def.map((f) => ({ ...f })));
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

    const points = findInsertionPoints(file.content, file.language);
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

    const playerState = (await sender.state) as { player?: Player };
    const player = playerState?.player;
    if (!player) return;

    if (error.type === msg.guessedType) {
      state.errors = state.errors.filter((e) => e.id !== msg.errorId);
      const award = 10;
      player.currency += award;

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
    msg: { powerupId: string },
    state: GameState
  ): Promise<void> {
    const playerState = (await sender.state) as { player?: Player };
    const player = playerState?.player;
    if (!player || msg.powerupId !== "highlight_files") return;

    const cost = 20;
    if (player.currency < cost) return;

    player.currency -= cost;
    await this.room.storage.put("gameState", state);

    const filesWithErrors = [...new Set(state.errors.map((e) => e.file))];
    sender.send(
      JSON.stringify({
        type: "powerupResult",
        powerupId: msg.powerupId,
        data: { files: filesWithErrors },
      })
    );
  }
}
