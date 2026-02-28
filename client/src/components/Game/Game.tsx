import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { usePartyConnection } from "../../hooks/usePartyConnection";
import { CodeEditor } from "../CodeEditor/CodeEditor";
import { FileExplorer } from "../FileExplorer/FileExplorer";
import type { CodeError, FileContent, Player } from "../../types";

export function Game() {
  const roomId = useGameStore((s) => s.roomId);
  const files = useGameStore((s) => s.files);
  const errors = useGameStore((s) => s.errors);
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const presences = useGameStore((s) => s.presences);
  const setSelectedFile = useGameStore((s) => s.setSelectedFile);
  const selectedFile = useGameStore((s) => s.selectedFile);

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [cursor, setCursor] = useState({ line: 0, column: 0 });

  const {
    sendPresence,
    sendGuess,
    sendBuyPowerup,
    sendSelectFile,
  } = usePartyConnection(roomId ?? null);

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]!.name);
    }
  }, [files, selectedFile, setSelectedFile]);

  useEffect(() => {
    setSelectedLine(null);
  }, [selectedFile]);

  const currentFile = useMemo(() => {
    const name = selectedFile ?? files[0]?.name ?? "";
    return files.find((f: FileContent) => f.name === name);
  }, [files, selectedFile]);

  useEffect(() => {
    const name = selectedFile ?? files[0]?.name ?? "";
    if (name) {
      sendPresence(name, { line: 0, column: 0 });
    }
  }, [selectedFile, sendPresence]);

  const handleSelectFile = useCallback(
    (name: string) => {
      setSelectedFile(name);
      sendSelectFile(name);
      sendPresence(name, cursor);
    },
    [setSelectedFile, sendSelectFile, sendPresence, cursor]
  );

  const presenceThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceRef = useRef({ line: -1, column: -1 });

  const handleCursorChange = useCallback(
    (line: number, column: number) => {
      setCursor({ line, column });
      if (!currentFile) return;
      if (lastPresenceRef.current.line === line && lastPresenceRef.current.column === column) return;
      lastPresenceRef.current = { line, column };
      if (presenceThrottleRef.current) clearTimeout(presenceThrottleRef.current);
      presenceThrottleRef.current = setTimeout(() => {
        presenceThrottleRef.current = null;
        sendPresence(currentFile.name, { line, column });
      }, 50);
    },
    [currentFile, sendPresence]
  );

  const handleGuess = useCallback(
    (errorId: string, type: CodeError["type"]) => {
      sendGuess(errorId, type);
      setSelectedLine(null);
    },
    [sendGuess]
  );

  if (phase === "gameover") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Game Over</h1>
        <p className="text-gray-400 mb-6">
          Too many errors! The bugs overwhelmed the codebase.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">No files loaded. Waiting for game to start...</p>
      </div>
    );
  }

  const myCurrency =
    players.find((p: Player) => p.id === currentPlayerId)?.currency ?? 0;

  const othersOnFile = Object.values(presences).filter(
    (p: { id: string; name: string; file: string }) =>
      p.id !== currentPlayerId && p.file === currentFile?.name
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white">Codenomaly</h1>
        <div className="flex items-center gap-4">
          {othersOnFile.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-2">
              Viewing with:
              {othersOnFile.map(
                (p: { id: string; name: string; color: string }) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                )
              )}
            </span>
          )}
          <span className="text-gray-400">
            Errors: {errors.length} / 5
          </span>
          <span className="text-yellow-400 font-mono">${myCurrency}</span>
          <button
            onClick={() => sendBuyPowerup("highlight_files")}
            disabled={myCurrency < 20}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
          >
            Highlight files ($20)
          </button>
        </div>
      </header>
      <div className="flex-1 flex min-h-0">
        <FileExplorer onSelectFile={handleSelectFile} />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <CodeEditor
            fileContent={currentFile.content}
            language={currentFile.language}
            fileName={currentFile.name}
            onCursorChange={handleCursorChange}
            onSelectLine={setSelectedLine}
            selectedLine={selectedLine}
            onGuess={handleGuess}
            presences={Object.values(presences)}
            currentPlayerId={currentPlayerId}
          />
        </div>
      </div>
    </div>
  );
}
