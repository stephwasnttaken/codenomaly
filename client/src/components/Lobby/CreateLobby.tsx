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
  const [mapPopupId, setMapPopupId] = useState<string | null>(null);

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
      <h2 className="text-2xl font-bold text-white">Create</h2>
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
        <p className="text-white/80 mb-2">Select programming language:</p>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => {
                setSelectedLang(lang.id);
                const next = MAPS_BY_LANGUAGE[lang.id] ?? MAPS_BY_LANGUAGE.javascript;
                if (next[0]) setSelectedMapId(next[0].id);
              }}
              className={`btn-pixel btn-pixel-sm flex-1 min-w-0 ${selectedLang === lang.id ? "btn-pixel-active" : ""}`}
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
              onClick={() => {
                setSelectedMapId(map.id);
                setMapPopupId(map.id);
              }}
              className={`btn-pixel btn-pixel-block w-full ${mapPopupId === map.id ? "btn-pixel-active" : ""}`}
            >
              {map.name}
            </button>
          ))}
        </div>
      </div>
      {mapPopupId !== null && (() => {
        const map = mapsForLang.find((m) => m.id === mapPopupId);
        if (!map) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={(e) => e.target === e.currentTarget && setMapPopupId(null)}
          >
            <div
              className="border-2 border-white rounded-none bg-black p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMapPopupId(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white border border-white/40 hover:border-white text-xl leading-none"
              >
                ×
              </button>
              <p className="text-white/90 text-lg pr-10 mb-4">{map.description}</p>
              <button
                type="button"
                onClick={() => {
                  handleCreate();
                  setMapPopupId(null);
                }}
                disabled={!hostName.trim()}
                className="btn-pixel w-full"
              >
                Create
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
