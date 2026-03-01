import type { ReactNode } from "react";

export type GamePopupType = "rick" | "hacked" | "spider";

export interface GamePopupItem {
  id: string;
  type: GamePopupType;
  x: number;
  y: number;
}

interface GamePopupsProps {
  popups: GamePopupItem[];
  onClose: (id: string) => void;
}

function PopupContent({ type }: { type: GamePopupType }): ReactNode {
  switch (type) {
    case "rick":
      return (
        <div className="p-4 flex flex-col items-center justify-center gap-3 bg-black text-white min-h-[120px]">
          <p className="text-sm text-center">Never gonna give you up...</p>
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent-red-bright)] underline text-sm hover:opacity-90"
          >
            Click here to listen
          </a>
        </div>
      );
    case "hacked":
      return (
        <div className="p-6 flex items-center justify-center bg-black text-white min-h-[120px]">
          <p className="text-lg font-bold text-[var(--color-accent-red-bright)] text-center">
            You just got hacked
          </p>
        </div>
      );
    case "spider":
      return (
        <div className="p-6 flex items-center justify-center bg-black text-white min-h-[120px]">
          <span className="text-6xl" role="img" aria-label="Spider">
            🕷️
          </span>
          <span className="text-4xl ml-2" role="img" aria-label="Bug">
            🐛
          </span>
        </div>
      );
    default:
      return null;
  }
}

function Win97Window({
  type,
  x,
  y,
  onClose,
}: {
  id: string;
  type: GamePopupType;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const titles: Record<GamePopupType, string> = {
    rick: "Message",
    hacked: "Warning",
    spider: "Alert",
  };

  return (
    <div
      className="game-popup-window absolute w-72 flex flex-col shadow-lg pointer-events-auto"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <div className="game-popup-title flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-white truncate ml-1">
          {titles[type]}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="game-popup-close shrink-0 w-6 h-5 flex items-center justify-center text-white hover:bg-[var(--color-accent-red)] border-l border-white/20"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="game-popup-body border border-t-0 border-white/20 overflow-hidden">
        <PopupContent type={type} />
      </div>
    </div>
  );
}

export function GamePopups({ popups, onClose }: GamePopupsProps) {
  if (popups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="relative w-full h-full">
        {popups.map((p) => (
          <Win97Window
            key={p.id}
            id={p.id}
            type={p.type}
            x={p.x}
            y={p.y}
            onClose={() => onClose(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
