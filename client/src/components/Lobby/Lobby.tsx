import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { CreateLobby } from "./CreateLobby";
import { JoinLobby } from "./JoinLobby";
import { LobbyWaiting } from "./LobbyWaiting";

export function Lobby() {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const roomId = useGameStore((s) => s.roomId);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const [hostOptions, setHostOptions] = useState<{
    languages: string[];
    hostName: string;
  } | null>(null);
  const [playerName, setPlayerName] = useState<string>("");

  if (roomId) {
    return (
      <LobbyWaiting
        roomId={roomId}
        isHost={mode === "create"}
        hostLanguages={hostOptions?.languages}
        hostName={hostOptions?.hostName}
        playerName={playerName}
        onLeave={() => {
          setRoomId(null);
          setHostOptions(null);
          setPlayerName("");
        }}
      />
    );
  }

  if (mode === "create") {
    return (
      <CreateLobby
        onJoined={(id, languages, hostName) => {
          setRoomId(id);
          setHostOptions({ languages, hostName });
        }}
      />
    );
  }

  if (mode === "join") {
    return (
      <JoinLobby
        onJoined={(id, name) => {
          setRoomId(id);
          setPlayerName(name);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white mb-12">Codenomaly</h1>
      <p className="text-gray-400 mb-8">
        Find errors in code. Work together. Don&apos;t let the bugs pile up.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => setMode("create")}
          className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition"
        >
          Create Lobby
        </button>
        <button
          onClick={() => setMode("join")}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
}
