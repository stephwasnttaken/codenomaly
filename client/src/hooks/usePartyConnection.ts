import { useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import { useGameStore } from "../stores/gameStore";
import type { ClientMessage, CursorPosition } from "../types";

export interface UsePartyConnectionReturn {
  connectionStatus: "disconnected" | "connecting" | "connected";
  sendPresence: (file: string, cursor: CursorPosition) => void;
  sendGuess: (errorId: string, guessedType: string) => void;
  sendStartGame: (mapId?: string) => void;
  sendSelectFile: (file: string) => void;
  sendChat: (text: string) => void;
  sendReturnToLobby: () => void;
}

// In dev with Vite proxy, use relative URL; otherwise use env or default
const PARTY_HOST =
  import.meta.env.VITE_PARTY_HOST ||
  (import.meta.env.DEV ? `${window.location.host}` : "localhost:1999");

export function usePartyConnection(
  roomId: string | null,
  options?: {
    name?: string;
    isHost?: boolean;
    languages?: string[];
  }
): UsePartyConnectionReturn {
  const {
    updateState,
    addChatMessage,
    setConnectionStatus,
    setCurrentPlayerId,
    setPresences,
    setSelectedFile,
    setJoinError,
    connectionStatus,
  } = useGameStore();

  const socketRef = useRef<PartySocket | null>(null);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const query: Record<string, string> = {};
    if (options?.name) query.name = options.name;
    if (options?.isHost) query.host = "1";
    if (options?.languages?.length)
      query.languages = options.languages.join(",");

    const socket = new PartySocket({
      host: PARTY_HOST,
      party: "main",
      room: roomId,
      query,
    });

    socketRef.current = socket;

    const scheduleStoreUpdate = (fn: () => void) => {
      setTimeout(() => {
        try {
          fn();
        } catch (e) {
          console.error("Party connection store update failed:", e);
        }
      }, 0);
    };

    socket.addEventListener("open", () => {
      scheduleStoreUpdate(() => setConnectionStatus("connected"));
    });

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        switch (msg.type) {
          case "init": {
            const s = msg.state as Record<string, unknown> | undefined;
            if (s && typeof s === "object") {
              updateState({
                ...s,
                errors: Array.isArray(s.errors) ? s.errors : [],
              });
            }
            setCurrentPlayerId(msg.playerId ?? null);
            break;
          }
          case "state":
            if (msg.state && typeof msg.state === "object") {
              const state = msg.state as Record<string, unknown>;
              if (state.phase === "lobby") {
                const payload = {
                  phase: "lobby" as const,
                  files: Array.isArray(state.files) ? state.files : [],
                  errors: Array.isArray(state.errors) ? state.errors : [],
                  players: Array.isArray(state.players) ? state.players : [],
                  selectedFile: null as string | null,
                };
                // Defer so we're not in the socket callback; use rAF so the update runs after the current frame
                const apply = () => {
                  requestAnimationFrame(() => {
                    try {
                      updateState(payload);
                      setSelectedFile(null);
                    } catch (e) {
                      console.error("Return to lobby state update failed:", e);
                    }
                  });
                };
                setTimeout(apply, 0);
              } else {
                const payload: Record<string, unknown> = { ...state };
                if (Object.prototype.hasOwnProperty.call(state, "errors")) {
                  payload.errors = Array.isArray(state.errors) ? state.errors : [];
                }
                updateState(payload);
              }
            }
            break;
          case "presence":
            setPresences(
              Object.fromEntries(
                (msg.presences ?? []).map((p: { id: string }) => [p.id, p])
              )
            );
            break;
          case "errorSpawned":
            if (msg.state && typeof msg.state === "object") {
              const st = msg.state as Record<string, unknown>;
              updateState({ ...st, errors: Array.isArray(st.errors) ? st.errors : [] });
            }
            break;
          case "errorCorrected":
            if (msg.state && typeof msg.state === "object") {
              const st = msg.state as Record<string, unknown>;
              updateState({ ...st, errors: Array.isArray(st.errors) ? st.errors : [] });
            }
            break;
          case "gameOver":
            updateState({
              phase: "gameover",
              win: msg.won === true,
            });
            if (msg.state) updateState(msg.state);
            break;
          case "chat":
            if (msg.message && typeof msg.message === "object") {
              addChatMessage(msg.message as import("../types").ChatMessage);
            }
            break;
          case "guessWrong":
            if (msg.state) updateState(msg.state);
            break;
          case "guessErrorNotFound":
            if (msg.state && typeof msg.state === "object") {
              const st = msg.state as Record<string, unknown>;
              if (Object.prototype.hasOwnProperty.call(st, "errors")) {
                updateState({ errors: Array.isArray(st.errors) ? st.errors : [] });
              }
            }
            break;
          case "playerJoined":
          case "playerLeft":
            updateState(msg);
            break;
          case "error":
            if (msg.code === "invalid_lobby") {
              scheduleStoreUpdate(() => {
                setJoinError("Invalid lobby code");
                setConnectionStatus("disconnected");
              });
            } else {
              updateState(msg);
            }
            break;
          default:
            updateState(msg);
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });

    socket.addEventListener("close", () => {
      scheduleStoreUpdate(() => setConnectionStatus("disconnected"));
    });

    socket.addEventListener("error", () => {
      scheduleStoreUpdate(() => setConnectionStatus("disconnected"));
    });

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, [
    roomId,
    options?.name,
    options?.isHost,
    options?.languages?.join(","),
    updateState,
    addChatMessage,
    setConnectionStatus,
    setCurrentPlayerId,
    setPresences,
    setSelectedFile,
    setJoinError,
  ]);

  const sendPresence = useCallback(
    (file: string, cursor: CursorPosition) => {
      send({ type: "presence", file, cursor });
    },
    [send]
  );

  const sendGuess = useCallback(
    (errorId: string, guessedType: string) => {
      send({
        type: "guess",
        errorId,
        guessedType: guessedType as import("../types").ErrorType,
      });
    },
    [send]
  );

  const sendStartGame = useCallback(
    (mapId?: string) => {
      send({ type: "start_game", mapId });
    },
    [send]
  );

  const sendSelectFile = useCallback(
    (file: string) => {
      send({ type: "select_file", file });
    },
    [send]
  );

  const sendChat = useCallback(
    (text: string) => {
      send({ type: "chat", text });
    },
    [send]
  );

  const sendReturnToLobby = useCallback(() => {
    send({ type: "return_to_lobby" });
  }, [send]);

  return {
    connectionStatus,
    sendPresence,
    sendGuess,
    sendStartGame,
    sendSelectFile,
    sendChat,
    sendReturnToLobby,
  };
}
