import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { CreateLobby } from "./CreateLobby";
import { JoinLobby } from "./JoinLobby";
import { LobbyWaiting } from "./LobbyWaiting";

export function Lobby() {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const roomId = useGameStore((s) => s.roomId);
  const myName = useGameStore((s) => s.myName);
  const storeIsHost = useGameStore((s) => s.isHost);
  const storeLanguages = useGameStore((s) => s.languages);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyName = useGameStore((s) => s.setMyName);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const [hostOptions, setHostOptions] = useState<{
    languages: string[];
    hostName: string;
    mapId: string;
  } | null>(null);
  const [playerName, setPlayerName] = useState<string>("");

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
        onJoined={(id, name) => {
          setRoomId(id);
          setMyName(name);
          setIsHost(false);
          setPlayerName(name);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center pt-12 pb-12">
      <img
        src="/codenomaly-title.png"
        alt="Codenomaly"
        className="w-full max-w-md mx-auto mb-12 object-contain pixel-art-title"
      />
      <p className="text-white/80 mb-8 text-center px-4">
        Find errors in code. Work together. Don&apos;t let the bugs pile up.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => setMode("create")}
          className="px-8 py-4 bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] text-white font-semibold rounded-lg transition border border-white/20"
        >
          Create Lobby
        </button>
        <button
          onClick={() => setMode("join")}
          className="px-8 py-4 bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] text-white font-semibold rounded-lg transition border border-white/20"
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
}
