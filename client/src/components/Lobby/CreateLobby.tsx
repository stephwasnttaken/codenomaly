import { useState, useMemo, useEffect } from "react";
import { usePartyConnection } from "../../hooks/usePartyConnection";
import { MAPS_BY_LANGUAGE } from "../../maps";

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
  onJoined: (
    roomId: string,
    languages: string[],
    hostName: string,
    mapId: string
  ) => void;
}

export function CreateLobby({ onJoined }: CreateLobbyProps) {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [hostName, setHostName] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("javascript");
  const mapsForLang = useMemo(
    () => MAPS_BY_LANGUAGE[selectedLang] ?? MAPS_BY_LANGUAGE.javascript,
    [selectedLang]
  );
  const [selectedMapId, setSelectedMapId] = useState<string>("calculator");

  useEffect(() => {
    if (mapsForLang.length > 0 && !mapsForLang.some((m) => m.id === selectedMapId)) {
      setSelectedMapId(mapsForLang[0]!.id);
    }
  }, [mapsForLang, selectedMapId]);

  usePartyConnection(lobbyCode, {
    name: hostName.trim() || "Host",
    isHost: true,
    languages: [selectedLang],
  });

  const handleCreate = () => {
    const code = generateLobbyCode();
    setLobbyCode(code);
    onJoined(code, [selectedLang], hostName.trim() || "Host", selectedMapId);
  };

  if (lobbyCode) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 bg-black min-h-screen text-white">
        <p className="text-lg text-white/80">Share this code with players:</p>
        <p className="text-4xl font-bold tracking-widest text-white">
          {lobbyCode}
        </p>
        <p className="text-sm text-white/60">Waiting for players to join...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold text-white">Create Lobby</h2>
      <div>
        <label className="block text-white/80 mb-2">Your name</label>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="Host name"
          maxLength={20}
          className="w-full px-4 py-3 bg-[var(--color-surface)] border border-white/20 rounded-lg text-white mb-4 focus:outline-none focus:border-[var(--color-accent-red)]"
        />
      </div>
      <div>
        <p className="text-gray-400 mb-2">Select programming language:</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => {
                setSelectedLang(lang.id);
                const next = MAPS_BY_LANGUAGE[lang.id] ?? MAPS_BY_LANGUAGE.javascript;
                if (next[0]) setSelectedMapId(next[0].id);
              }}
              className={`px-4 py-2 rounded-lg border transition ${
                selectedLang === lang.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-white/80 mb-2">Select map:</p>
        <div className="space-y-3">
          {mapsForLang.map((map) => (
            <button
              key={map.id}
              type="button"
              onClick={() => setSelectedMapId(map.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                selectedMapId === map.id
                  ? "bg-[var(--color-accent-red)] border-white/30 text-white"
                  : "bg-[var(--color-surface)] border-white/20 text-white/80 hover:border-white/40"
              }`}
            >
              <span className="font-medium block">{map.name}</span>
              <span className="text-sm opacity-90 block mt-1">{map.description}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleCreate}
        disabled={!hostName.trim()}
        className="px-6 py-3 bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] disabled:bg-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition border border-white/20"
      >
        Create Lobby
      </button>
    </div>
  );
}
