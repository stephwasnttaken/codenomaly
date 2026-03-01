import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { CreateLobby } from "./CreateLobby";
import { JoinLobby } from "./JoinLobby";
import { LobbyWaiting } from "./LobbyWaiting";

export function Lobby() {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const roomId = useGameStore((s) => s.roomId);
  const joinError = useGameStore((s) => s.joinError);
  const myName = useGameStore((s) => s.myName);
  const storeIsHost = useGameStore((s) => s.isHost);
  const storeLanguages = useGameStore((s) => s.languages);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyName = useGameStore((s) => s.setMyName);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const setJoinError = useGameStore((s) => s.setJoinError);
  const [hostOptions, setHostOptions] = useState<{
    languages: string[];
    hostName: string;
    mapId: string;
  } | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    if (joinError && roomId) setRoomId(null);
  }, [joinError, roomId, setRoomId]);

  if (roomId) {
    const isHost = hostOptions ? mode === "create" : (storeIsHost ?? false);
    return (
      <LobbyWaiting
        roomId={roomId}
        isHost={isHost}
        hostLanguages={hostOptions?.languages ?? (storeLanguages.length ? storeLanguages : undefined)}
        hostName={hostOptions?.hostName ?? (isHost ? myName ?? undefined : undefined)}
        hostMapId={hostOptions?.mapId}
        playerName={hostOptions ? playerName : (isHost ? undefined : myName ?? undefined)}
        onLeave={() => {
          setRoomId(null);
          setMyName(null);
          setIsHost(null);
          setHostOptions(null);
          setPlayerName("");
        }}
      />
    );
  }

  if (mode === "create") {
    return (
      <CreateLobby
        onBack={() => setMode("choose")}
        onJoined={(id, languages, hostName, mapId) => {
          setRoomId(id);
          setMyName(hostName || "Host");
          setIsHost(true);
          setHostOptions({ languages, hostName, mapId: mapId ?? "calculator" });
        }}
      />
    );
  }

  if (mode === "join") {
    return (
      <JoinLobby
        joinError={joinError}
        onBack={() => {
          setMode("choose");
          setJoinError(null);
        }}
        onJoined={(id, name) => {
          setJoinError(null);
          setRoomId(id);
          setMyName(name);
          setIsHost(false);
          setPlayerName(name);
        }}
      />
    );
  }

  if (showHowToPlay) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="border-2 border-white rounded-none box-border flex flex-col w-[min(90vw,520px)] max-h-[85vh] p-6 md:p-8 bg-black">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-xl font-bold text-white">How to Play</h2>
            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="btn-pixel btn-pixel-sm"
              aria-label="Close"
            >
              Close
            </button>
          </div>
          <div className="flex flex-col gap-5 overflow-y-auto text-white/90 text-sm space-y-1">
            <section>
              <h3 className="text-white font-semibold mb-2">Selecting and fixing errors</h3>
              <p className="mb-1">
                Click a line in the code editor to select it. A dropdown appears above the editor — choose the error type (e.g. missing semicolon, typo) and the specific cause, then pick the matching option. A correct guess removes the error and increases your stability; a wrong guess reduces it.
              </p>
            </section>
            <section>
              <h3 className="text-white font-semibold mb-2">Stability</h3>
              <p className="mb-1">
                Your stability meter (0–100%) is shown on the left. It goes down over time when you view files that contain errors, and goes up when you view files with no errors or when you fix an error correctly. If stability reaches 0%, your screen glitches for several seconds and you recover to 50%. Survive 5 minutes to win.
              </p>
            </section>
            <section>
              <h3 className="text-white font-semibold mb-2">Popups</h3>
              <p className="mb-1">
                During the game, random popup windows may appear. Close them by clicking the X in the top-right corner so you can keep playing. Don’t let them distract you for too long.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="border-2 border-white rounded-none box-border flex flex-col items-center justify-center aspect-square w-[min(90vw,680px)] p-10 md:p-12">
        <div className="flex flex-col items-center scale-105">
          <img
            src="/codenomaly-title.png"
            alt="Codenomaly"
            className="w-full max-w-lg mx-auto mb-2 object-contain pixel-art-title"
          />
          <p className="text-white/80 text-lg mb-14 text-center px-4">
            Find anomalies (errors) in code. Work together. Don&apos;t let the bugs pile up.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="btn-pixel btn-pixel-lg"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className="btn-pixel btn-pixel-lg"
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => setShowHowToPlay(true)}
              className="btn-pixel btn-pixel-lg"
            >
              How to Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
