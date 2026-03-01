// Shared types (mirrored from shared/types.ts for client use)

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
  stability: number;
  glitchedUntil?: number;
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
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  type: ErrorType;
}

export interface FileContent {
  name: string;
  content: string;
  language: string;
}

export type GamePhase = "lobby" | "playing" | "gameover";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  presences: Record<string, PlayerPresence>;
  files: FileContent[];
  currentFile: string;
  errors: CodeError[];
  languages: string[];
  errorThreshold: number;
  gameStartTime?: number;
  win?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  time: string;
}

export type ClientMessage =
  | { type: "presence"; file: string; cursor: CursorPosition }
  | { type: "guess"; errorId: string; guessedType: ErrorType }
  | { type: "start_game"; mapId?: string }
  | { type: "select_file"; file: string }
  | { type: "chat"; text: string }
  | { type: "return_to_lobby" };
