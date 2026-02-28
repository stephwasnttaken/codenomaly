import { useGameStore } from "../../stores/gameStore";
import type { Player } from "../../types";

interface PowerupsPanelProps {
  onBuyPowerup: (powerupId: string, options?: { currentFile?: string }) => void;
}

export function PowerupsPanel({ onBuyPowerup }: PowerupsPanelProps) {
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const selectedFile = useGameStore((s) => s.selectedFile);

  const myCurrency =
    players.find((p: Player) => p.id === currentPlayerId)?.currency ?? 0;

  return (
    <div className="flex flex-col border-t border-gray-300 pt-3 mt-3">
      <div className="p-2 border-b border-gray-300 mb-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Powerups
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">${myCurrency}</p>
      </div>
      <ul className="space-y-2">
        <li>
          <button
            type="button"
            onClick={() =>
              onBuyPowerup("highlight_errors", {
                currentFile: selectedFile ?? undefined,
              })
            }
            disabled={myCurrency < 10 || !selectedFile}
            className="w-full text-left px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition"
          >
            <span className="font-medium">Highlight Errors</span>
            <span className="block text-xs text-gray-500">$10 — current file</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onBuyPowerup("find_errors")}
            disabled={myCurrency < 5}
            className="w-full text-left px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition"
          >
            <span className="font-medium">Find Errors</span>
            <span className="block text-xs text-gray-500">$5 — count per file</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onBuyPowerup("auto_fix_one")}
            disabled={myCurrency < 5}
            className="w-full text-left px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition"
          >
            <span className="font-medium">Auto-Fix One Error</span>
            <span className="block text-xs text-gray-500">$5 — fix random error</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
