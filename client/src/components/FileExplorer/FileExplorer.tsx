import { useGameStore } from "../../stores/gameStore";

interface FileExplorerProps {
  onSelectFile: (fileName: string) => void;
}

export function FileExplorer({ onSelectFile }: FileExplorerProps) {
  const files = useGameStore((s) => s.files);
  const selectedFile = useGameStore((s) => s.selectedFile);

  if (files.length <= 1) return null;

  return (
    <div className="w-48 shrink-0 bg-black border-r border-white/20 flex flex-col">
      <div className="p-2 text-xs font-semibold text-white/80 uppercase tracking-wider">
        Files
      </div>
      <ul className="flex-1 overflow-auto">
        {files.map((file: import("../../types").FileContent) => (
          <li key={file.name}>
            <button
              type="button"
              onClick={() => onSelectFile(file.name)}
              className={`w-full text-left px-3 py-2 text-sm truncate transition ${
                selectedFile === file.name
                  ? "bg-[var(--color-accent-red)] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {file.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
