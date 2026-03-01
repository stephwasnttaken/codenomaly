import { useGameStore } from "./stores/gameStore";
import { Lobby } from "./components/Lobby/Lobby";
import { Game } from "./components/Game/Game";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MatrixBackground } from "./components/MatrixBackground/MatrixBackground";

function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "playing" || phase === "gameover") {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen overflow-hidden relative">
          <MatrixBackground />
          <div className="relative z-10 h-full w-full">
            <Game />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden relative">
        <MatrixBackground />
        <div className="relative z-10 h-full w-full">
          <Lobby />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
