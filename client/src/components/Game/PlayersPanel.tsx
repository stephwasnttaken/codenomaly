import { useGameStore } from "../../stores/gameStore";
import type { Player } from "../../types";

const FALLBACK_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f97316",
];

export function PlayersPanel() {
  const players = useGameStore((s) => s.players);
  const presences = useGameStore((s) => s.presences);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-white/20">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
          Players
        </h3>
      </div>
      <ul className="flex-1 overflow-auto p-2 space-y-3">
        {players.map((p: Player, index: number) => {
          const presence = presences[p.id];
          const color = presence?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
          const currentFile = presence?.file;
          const isYou = p.id === currentPlayerId;
          const displayName =
            (p.name && p.name.trim()) || (isYou ? "You" : `Player ${index + 1}`);
          return (
            <li key={p.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm shrink-0 border border-white/30"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-white truncate" title={p.name || displayName}>
                  {displayName}
                  {isYou && displayName !== "You" && (
                    <span className="ml-1 text-xs text-white/70">(You)</span>
                  )}
                </span>
              </div>
              {currentFile && (
                <div className="pl-5 text-xs text-white/70 truncate" title={currentFile}>
                  Viewing: {currentFile}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
