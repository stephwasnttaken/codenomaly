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

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        switch (msg.type) {
          case "init":
            updateState(msg.state);
            setCurrentPlayerId(msg.playerId ?? null);
            break;
          case "state":
            updateState(msg.state);
            break;
          case "presence":
            setPresences(
              Object.fromEntries(
                (msg.presences ?? []).map((p: { id: string }) => [p.id, p])
              )
            );
            break;
          case "errorSpawned":
            if (msg.state) updateState(msg.state);
            break;
          case "errorCorrected":
            if (msg.state) updateState(msg.state);
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
          case "playerJoined":
          case "playerLeft":
          case "guessWrong":
          case "error":
            updateState(msg);
            break;
          default:
            updateState(msg);
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected");
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
