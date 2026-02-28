import { create } from "zustand";
import type {
  GameState,
  GamePhase,
  Player,
  PlayerPresence,
  FileContent,
  CodeError,
} from "../types";

interface GameStore extends GameState {
  // Client-specific state
  roomId: string | null;
  myName: string | null; // Name we used when creating/joining, so Game can reconnect with it
  isHost: boolean | null; // Set when creating (true) or joining (false) lobby, so we know before server init
  currentPlayerId: string | null;
  selectedFile: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
  filesWithErrorsHint: string[]; // deprecated, kept for compatibility
  highlightErrorsInFile: string | null; // file name when Highlight Errors powerup is active
  errorCountByFile: Record<string, number> | null; // from Find Errors powerup
  chatMessages: import("../types").ChatMessage[];

  // Actions
  setRoomId: (id: string | null) => void;
  setMyName: (name: string | null) => void;
  setIsHost: (value: boolean | null) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setCurrentPlayerId: (id: string | null) => void;
  setSelectedFile: (file: string | null) => void;
  updateState: (state: Partial<GameState> & { filesWithErrorsHint?: string[] }) => void;
  addChatMessage: (msg: import("../types").ChatMessage) => void;
  setPhase: (phase: GamePhase) => void;
  setPlayers: (players: Player[]) => void;
  setPresences: (presences: Record<string, PlayerPresence>) => void;
  setFiles: (files: FileContent[]) => void;
  setErrors: (errors: CodeError[]) => void;
  setHighlightErrorsInFile: (file: string | null) => void;
  setErrorCountByFile: (counts: Record<string, number> | null) => void;
  reset: () => void;
}

const initialState = {
  phase: "lobby" as GamePhase,
  players: [] as Player[],
  presences: {} as Record<string, PlayerPresence>,
  files: [] as FileContent[],
  currentFile: "",
  errors: [] as CodeError[],
  languages: [] as string[],
  errorThreshold: 5,
  roomId: null as string | null,
  myName: null as string | null,
  isHost: null as boolean | null,
  currentPlayerId: null as string | null,
  selectedFile: null as string | null,
  connectionStatus: "disconnected" as GameStore["connectionStatus"],
  filesWithErrorsHint: [] as string[],
  highlightErrorsInFile: null as string | null,
  errorCountByFile: null as Record<string, number> | null,
  chatMessages: [] as import("../types").ChatMessage[],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoomId: (id) => set({ roomId: id }),
  setMyName: (name) => set({ myName: name }),
  setIsHost: (value) => set({ isHost: value }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  setSelectedFile: (file) => set({ selectedFile: file }),

  updateState: (state) =>
    set((prev) => ({
      ...prev,
      ...state,
    })),

  addChatMessage: (msg: import("../types").ChatMessage) =>
    set((prev) => ({
      chatMessages: [...prev.chatMessages, msg],
    })),

  setPhase: (phase) => set({ phase }),
  setPlayers: (players) => set({ players }),
  setPresences: (presences) => set({ presences }),
  setFiles: (files) => set({ files }),
  setErrors: (errors) => set({ errors }),
  setHighlightErrorsInFile: (file) => set({ highlightErrorsInFile: file }),
  setErrorCountByFile: (counts) => set({ errorCountByFile: counts }),

  reset: () => set(initialState),
}));
