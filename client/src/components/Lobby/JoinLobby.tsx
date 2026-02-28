import { useState } from "react";
import { usePartyConnection } from "../../hooks/usePartyConnection";

interface JoinLobbyProps {
  onJoined: (roomId: string, playerName: string) => void;
}

export function JoinLobby({ onJoined }: JoinLobbyProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);

  usePartyConnection(roomId, { name: name || undefined });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 4) return;
    setRoomId(trimmed);
    onJoined(trimmed, name.trim());
  };

  if (roomId) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-lg text-gray-300">Connecting to {roomId}...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleJoin}
      className="flex flex-col gap-6 max-w-md mx-auto p-8"
    >
      <h2 className="text-2xl font-bold text-white">Join Lobby</h2>
      <div>
        <label className="block text-gray-400 mb-2">Lobby code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="ABCD"
          maxLength={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-xl tracking-widest uppercase"
        />
      </div>
      <div>
        <label className="block text-gray-400 mb-2">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          maxLength={20}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
        />
      </div>
      <button
        type="submit"
        disabled={code.trim().length !== 4 || !name.trim()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
      >
        Join
      </button>
    </form>
  );
}
