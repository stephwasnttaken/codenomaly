import { useState } from "react";
import { usePartyConnection } from "../../hooks/usePartyConnection";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
];

function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface CreateLobbyProps {
  onJoined: (roomId: string, languages: string[], hostName: string) => void;
}

export function CreateLobby({ onJoined }: CreateLobbyProps) {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [hostName, setHostName] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["javascript"]);

  const toggleLang = (id: string) => {
    setSelectedLangs((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  usePartyConnection(lobbyCode, {
    name: hostName.trim() || "Host",
    isHost: true,
    languages: selectedLangs,
  });

  const handleCreate = () => {
    const code = generateLobbyCode();
    setLobbyCode(code);
    onJoined(code, selectedLangs, hostName.trim() || "Host");
  };

  if (lobbyCode) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-lg text-gray-300">
          Share this code with players:
        </p>
        <p className="text-4xl font-mono font-bold tracking-widest text-white">
          {lobbyCode}
        </p>
        <p className="text-sm text-gray-500">
          Waiting for players to join...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold text-white">Create Lobby</h2>
      <div>
        <label className="block text-gray-400 mb-2">Your name</label>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="Host name"
          maxLength={20}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
        />
      </div>
      <div>
        <p className="text-gray-400 mb-2">Select programming language(s):</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => toggleLang(lang.id)}
              className={`px-4 py-2 rounded-lg border transition ${
                selectedLangs.includes(lang.id)
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleCreate}
        disabled={!hostName.trim()}
        className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
      >
        Create Lobby
      </button>
    </div>
  );
}
