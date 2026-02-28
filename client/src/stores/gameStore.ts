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
  currentPlayerId: string | null;
  selectedFile: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
  filesWithErrorsHint: string[]; // From powerup

  // Actions
  setRoomId: (id: string | null) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setCurrentPlayerId: (id: string | null) => void;
  setSelectedFile: (file: string | null) => void;
  updateState: (state: Partial<GameState> & { filesWithErrorsHint?: string[] }) => void;
  setPhase: (phase: GamePhase) => void;
  setPlayers: (players: Player[]) => void;
  setPresences: (presences: Record<string, PlayerPresence>) => void;
  setFiles: (files: FileContent[]) => void;
  setErrors: (errors: CodeError[]) => void;
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
  currentPlayerId: null as string | null,
  selectedFile: null as string | null,
  connectionStatus: "disconnected" as GameStore["connectionStatus"],
  filesWithErrorsHint: [] as string[],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoomId: (id) => set({ roomId: id }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
  setSelectedFile: (file) => set({ selectedFile: file }),

  updateState: (state) =>
    set((prev) => ({
      ...prev,
      ...state,
    })),

  setPhase: (phase) => set({ phase }),
  setPlayers: (players) => set({ players }),
  setPresences: (presences) => set({ presences }),
  setFiles: (files) => set({ files }),
  setErrors: (errors) => set({ errors }),

  reset: () => set(initialState),
}));
