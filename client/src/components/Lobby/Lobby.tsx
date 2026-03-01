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
          </div>
        </div>
      </div>
    </div>
  );
}
