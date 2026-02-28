import { useGameStore } from "../../stores/gameStore";
import type { PlayerPresence as PlayerPresenceType } from "../../types";

interface PlayerPresenceProps {
  currentFile: string;
}

export function PlayerPresenceOverlay({ currentFile }: PlayerPresenceProps) {
  const presences = useGameStore((s) => s.presences);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);

  const others = Object.values(presences).filter(
    (p: PlayerPresenceType) => p.id !== currentPlayerId && p.file === currentFile
  );

  if (others.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none z-10">
      {others.map((p: PlayerPresenceType) => (
        <div
          key={p.id}
          className="absolute text-xs px-1.5 py-0.5 rounded shadow-lg truncate max-w-[120px]"
          style={{
            backgroundColor: p.color,
            color: "#fff",
            top: `${p.cursor.line * 19 + 2}px`,
            left: `${p.cursor.column * 8 + 80}px`,
          }}
        >
          {p.name}
        </div>
      ))}
    </div>
  );
}
