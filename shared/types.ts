// Shared types between client and party server

export type ErrorType =
  | "missing_semicolon"
  | "wrong_quotes"
  | "typo"
  | "wrong_bracket"
  | "extra_char"
  | "wrong_operator"
  | "missing_colon"
  | "wrong_indentation";

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Player {
  id: string;
  name: string;
  currency: number;
  isHost: boolean;
}

export interface PlayerPresence {
  id: string;
  name: string;
  file: string;
  cursor: CursorPosition;
  color: string;
}

export interface CodeError {
  id: string;
  file: string;
  range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  type: ErrorType; // Server knows; clients receive after guess or via powerup
}

export interface FileContent {
  name: string;
  content: string;
  language: string;
}

export type GamePhase = "lobby" | "playing" | "gameover";

// Client -> Server message types
export type ClientMessage =
  | { type: "presence"; file: string; cursor: CursorPosition }
  | { type: "guess"; errorId: string; guessedType: ErrorType }
  | { type: "buy_powerup"; powerupId: string }
  | { type: "start_game" }
  | { type: "select_file"; file: string };

// Server -> Client message types
export type ServerMessage =
  | { type: "init"; state: GameState }
  | { type: "state"; state: Partial<GameState> }
  | { type: "playerJoined"; player: Player }
  | { type: "playerLeft"; playerId: string }
  | { type: "presence"; presences: PlayerPresence[] }
  | { type: "files"; files: FileContent[] }
  | { type: "errorSpawned"; error: CodeError; fileContent: string }
  | { type: "errorCorrected"; errorId: string; fileContent: string; currencyAward: number }
  | { type: "guessWrong"; errorId: string }
  | { type: "powerupResult"; powerupId: string; data: unknown }
  | { type: "gameOver"; won: boolean }
  | { type: "error"; message: string };

export interface GameState {
  phase: GamePhase;
  players: Player[];
  presences: Record<string, PlayerPresence>;
  files: FileContent[];
  currentFile: string;
  errors: CodeError[];
  languages: string[];
  errorThreshold: number;
}
