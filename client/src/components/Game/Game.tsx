import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { usePartyConnection } from "../../hooks/usePartyConnection";
import { CodeEditor } from "../CodeEditor/CodeEditor";
import { FileExplorer } from "../FileExplorer/FileExplorer";
import { GameWindow } from "./GameWindow";
import { PlayersPanel } from "./PlayersPanel";
import { PowerupsPanel } from "./PowerupsPanel";
import { ChatPanel } from "./ChatPanel";
import type { CodeError, FileContent, Player } from "../../types";

export function Game() {
  const roomId = useGameStore((s) => s.roomId);
  const myName = useGameStore((s) => s.myName);
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
    sendChat,
    sendReturnToLobby,
  } = usePartyConnection(roomId ?? null, { name: myName ?? undefined });

  useEffect(() => {
    if (files.length === 0) return;
    const currentExists = selectedFile && files.some((f: FileContent) => f.name === selectedFile);
    if (!currentExists) {
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

  const [hasReturnedToLobby, setHasReturnedToLobby] = useState(false);

  if (phase === "gameover") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Game Over</h1>
        <p className="text-gray-400 mb-6 text-center">
          Too many errors! The bugs overwhelmed the codebase.
        </p>
        {!hasReturnedToLobby ? (
          <button
            onClick={() => {
              sendReturnToLobby();
              setHasReturnedToLobby(true);
            }}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium"
          >
            Return to Lobby
          </button>
        ) : (
          <p className="text-gray-400 text-center">
            Waiting for other players to return to the lobby...
          </p>
        )}
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

  return (
    <GameWindow
      leftSidebar={
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PlayersPanel />
          </div>
          <PowerupsPanel onBuyPowerup={sendBuyPowerup} />
        </div>
      }
      rightSidebar={<ChatPanel onSendChat={sendChat} />}
    >
      <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white">Codenomaly</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            Errors: {errors.length} / 5
          </span>
          <span className="text-yellow-400 font-mono">${myCurrency}</span>
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
    </GameWindow>
  );
}
