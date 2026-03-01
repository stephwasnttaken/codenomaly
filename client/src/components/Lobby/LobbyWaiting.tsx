import { useState, useCallback } from "react";
import { FiCopy } from "react-icons/fi";
import { useGameStore } from "../../stores/gameStore";
import { usePartyConnection } from "../../hooks/usePartyConnection";

interface LobbyWaitingProps {
  roomId: string;
  isHost: boolean;
  hostLanguages?: string[];
  hostName?: string;
  hostMapId?: string;
  playerName?: string;
  onLeave: () => void;
}

export function LobbyWaiting({
  roomId,
  isHost,
  hostLanguages,
  hostName,
  hostMapId,
  playerName,
  onLeave,
}: LobbyWaitingProps) {
  const [copied, setCopied] = useState(false);
  const players = useGameStore((s) => s.players);
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const safePlayers = Array.isArray(players) ? players : [];
  const { sendStartGame } = usePartyConnection(roomId, {
    name: isHost ? (hostName || "Host") : playerName || undefined,
    isHost,
    languages: isHost ? hostLanguages ?? ["csharp"] : undefined,
  });

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-white">
      <div className="bg-[var(--color-surface)] border border-white/20 rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-white/80 text-sm">
            Lobby code:{" "}
            <span className="font-bold text-white">{roomId}</span>
          </p>
          <button
            type="button"
            onClick={copyCode}
            title="Copy code"
            className="btn-pixel-small-icon"
            aria-label="Copy code"
          >
            <FiCopy className="w-4 h-4 inline-block text-white" aria-hidden />
          </button>
          {copied && (
            <span className="text-xs text-[var(--color-accent-red-bright)]">Copied!</span>
          )}
        </div>
        <p
          className={`text-sm mb-6 ${
            connectionStatus === "connected"
              ? "text-white"
              : "text-white/70"
          }`}
        >
          {connectionStatus === "connected"
            ? "Connected"
            : "Connecting..."}
        </p>
        <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
        <ul className="space-y-2 mb-6">
          {safePlayers.length === 0 ? (
            <li className="text-white/60">Waiting for players...</li>
          ) : (
            safePlayers.map((p: import("../../types").Player) => (
              <li key={p.id} className="text-white/90 flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    p.isHost ? "bg-[var(--color-accent-red)]" : "bg-white/50"
                  }`}
                />
                {p.name}
                {p.isHost && (
                  <span className="text-xs text-[var(--color-accent-red-bright)]">(Host)</span>
                )}
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLeave}
            className="btn-pixel flex-1"
          >
            Leave
          </button>
          {isHost && (
            <button
              type="button"
              onClick={() => sendStartGame(hostMapId)}
              disabled={safePlayers.length < 1}
              className="btn-pixel flex-1"
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
