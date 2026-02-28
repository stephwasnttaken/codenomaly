import { useState, useCallback } from "react";
import { FiCopy } from "react-icons/fi";
import { useGameStore } from "../../stores/gameStore";
import { usePartyConnection } from "../../hooks/usePartyConnection";

interface LobbyWaitingProps {
  roomId: string;
  isHost: boolean;
  hostLanguages?: string[];
  hostName?: string;
  playerName?: string;
  onLeave: () => void;
}

export function LobbyWaiting({
  roomId,
  isHost,
  hostLanguages,
  hostName,
  playerName,
  onLeave,
}: LobbyWaitingProps) {
  const [copied, setCopied] = useState(false);
  const { players, connectionStatus } = useGameStore();
  const { sendStartGame } = usePartyConnection(roomId, {
    name: isHost ? (hostName || "Host") : playerName || undefined,
    isHost,
    languages: isHost ? hostLanguages ?? ["javascript"] : undefined,
  });

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-gray-400 text-sm">
            Lobby code:{" "}
            <span className="font-mono font-bold text-white">{roomId}</span>
          </p>
          <button
            type="button"
            onClick={copyCode}
            title="Copy code"
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <FiCopy className="w-4 h-4" aria-hidden />
          </button>
          {copied && (
            <span className="text-xs text-green-400">Copied!</span>
          )}
        </div>
        <p
          className={`text-sm mb-6 ${
            connectionStatus === "connected"
              ? "text-green-400"
              : "text-yellow-400"
          }`}
        >
          {connectionStatus === "connected"
            ? "Connected"
            : "Connecting..."}
        </p>
        <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
        <ul className="space-y-2 mb-6">
          {players.length === 0 ? (
            <li className="text-gray-500">Waiting for players...</li>
          ) : (
            players.map((p: import("../../types").Player) => (
              <li key={p.id} className="text-gray-300 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    p.isHost ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                />
                {p.name}
                {p.isHost && (
                  <span className="text-xs text-yellow-500">(Host)</span>
                )}
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <button
            onClick={onLeave}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
          >
            Leave
          </button>
          {isHost && (
            <button
              onClick={() => sendStartGame()}
              disabled={players.length < 1}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
