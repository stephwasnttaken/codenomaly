import { useGameStore } from "../../stores/gameStore";

interface FileExplorerProps {
  onSelectFile: (fileName: string) => void;
}

export function FileExplorer({ onSelectFile }: FileExplorerProps) {
  const files = useGameStore((s) => s.files);
  const selectedFile = useGameStore((s) => s.selectedFile);
  const filesWithErrorsHint = useGameStore((s) => s.filesWithErrorsHint);

  if (files.length <= 1) return null;

  return (
    <div className="w-48 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Files
      </div>
      <ul className="flex-1 overflow-auto">
        {files.map((file: import("../../types").FileContent) => {
          const hasErrorHint = filesWithErrorsHint.includes(file.name);
          return (
            <li key={file.name}>
              <button
                type="button"
                onClick={() => onSelectFile(file.name)}
                className={`w-full text-left px-3 py-2 text-sm truncate transition flex items-center gap-2 ${
                  selectedFile === file.name
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {hasErrorHint && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
                {file.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
