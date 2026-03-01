import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
const GAME_DURATION_MS = 5 * 60 * 1000;
import { useGlitch } from "react-powerglitch";
import { useGameStore } from "../../stores/gameStore";
import { usePartyConnection } from "../../hooks/usePartyConnection";
import { CodeEditor } from "../CodeEditor/CodeEditor";
import { FileExplorer } from "../FileExplorer/FileExplorer";
import { GameWindow } from "./GameWindow";
import { PlayersPanel } from "./PlayersPanel";
import { StabilityMeter } from "./StabilityMeter";
import { ChatPanel } from "./ChatPanel";
import type { CodeError, FileContent, Player } from "../../types";

const glitchOptions = {
  playMode: "manual" as const,
  glitchTimeSpan: { start: 0, end: 1 },
  timing: { duration: 2000, iterations: Number.POSITIVE_INFINITY },
  shake: { velocity: 18, amplitudeX: 0.25, amplitudeY: 0.25 },
  slice: { count: 8, velocity: 18, minHeight: 0.02, maxHeight: 0.2, hueRotate: true },
  pulse: false,
};

export function Game() {
  const glitch = useGlitch(glitchOptions);
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
  }, [files, selectedFile, sendPresence]);

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
  const win = useGameStore((s) => s.win);
  const gameStartTime = useGameStore((s) => s.gameStartTime);
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (phase !== "playing" || gameStartTime == null || typeof gameStartTime !== "number") return;
    const tick = () => {
      const elapsed = Date.now() - gameStartTime;
      setElapsedMs(Number.isFinite(elapsed) ? Math.min(elapsed, GAME_DURATION_MS) : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, gameStartTime]);
  const remainingMs = GAME_DURATION_MS - (Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const remainingSec = Math.max(0, Math.min(300, Math.ceil(remainingMs / 1000)));
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeDisplay = `${Number.isFinite(mins) ? mins : 5}:${String(Number.isFinite(secs) ? secs : 0).padStart(2, "0")}`;
  const myPlayer = (Array.isArray(players) ? players : []).find((p: Player) => p.id === currentPlayerId);
  const rawStability = myPlayer?.stability;
  const stability =
    typeof rawStability === "number" && !Number.isNaN(rawStability)
      ? Math.max(0, Math.min(100, rawStability))
      : 100;
  const glitchedUntil = myPlayer?.glitchedUntil;
  const isGlitched =
    stability <= 0 ||
    (typeof glitchedUntil === "number" && !Number.isNaN(glitchedUntil) && Date.now() < glitchedUntil);

  const shouldGlitch = phase === "playing" && isGlitched;
  useEffect(() => {
    if (shouldGlitch) glitch.startGlitch();
    else glitch.stopGlitch();
  }, [shouldGlitch, glitch]);

  const fullScreenWrap = (content: ReactNode) => (
    <div ref={glitch.ref} className="game-fullscreen-glitch">
      <div className="game-fullscreen-inner">
        {content}
      </div>
    </div>
  );

  if (phase === "gameover") {
    return fullScreenWrap(
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 w-full text-white">
        <h1
          className={`text-3xl font-bold mb-4 ${
            win ? "text-white" : "text-[var(--color-accent-red-bright)]"
          }`}
        >
          {win ? "You survived!" : "Game Over"}
        </h1>
        <p className="text-white/80 mb-6 text-center">
          {win
            ? "You made it through 5 minutes. The codebase is safe."
            : "Too many errors! The bugs overwhelmed the codebase."}
        </p>
        {!hasReturnedToLobby ? (
          <button
            type="button"
            onClick={() => {
              sendReturnToLobby();
              setHasReturnedToLobby(true);
            }}
            className="btn-pixel"
          >
            Return to Lobby
          </button>
        ) : (
          <p className="text-white/70 text-center">
            Waiting for other players to return to the lobby...
          </p>
        )}
      </div>
    );
  }

  if (!currentFile) {
    return fullScreenWrap(
      <div className="min-h-screen bg-black flex items-center justify-center w-full text-white">
        <p className="text-white/80">No files loaded. Waiting for game to start...</p>
      </div>
    );
  }

  return fullScreenWrap(
    <GameWindow
      leftSidebar={
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PlayersPanel />
          </div>
          <StabilityMeter stability={stability} isGlitched={isGlitched} />
        </div>
      }
      rightSidebar={<ChatPanel onSendChat={sendChat} />}
    >
      <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-black border-b border-white/20">
        <h1 className="text-lg font-semibold text-white">Codenomaly</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/80">
            Errors: {Array.isArray(errors) ? errors.length : 0} / 5
          </span>
          <span className="text-white/80" title="Time remaining">
            {timeDisplay}
          </span>
        </div>
      </header>
      <div className="flex-1 flex min-h-0 relative">
        {isGlitched && (
          <div
            className="absolute inset-0 z-20 pointer-events-auto glitch-overlay"
            aria-hidden
          />
        )}
        <FileExplorer onSelectFile={handleSelectFile} />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <CodeEditor
            fileContent={typeof currentFile.content === "string" ? currentFile.content : ""}
            language={typeof currentFile.language === "string" ? currentFile.language : "javascript"}
            fileName={typeof currentFile.name === "string" ? currentFile.name : ""}
            onCursorChange={handleCursorChange}
            onSelectLine={setSelectedLine}
            selectedLine={selectedLine}
            onGuess={handleGuess}
            presences={presences && typeof presences === "object" ? Object.values(presences) : []}
            currentPlayerId={currentPlayerId}
            disabled={isGlitched}
          />
        </div>
      </div>
    </GameWindow>
  );
}
