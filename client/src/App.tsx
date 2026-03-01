import { useGameStore } from "./stores/gameStore";
import { Lobby } from "./components/Lobby/Lobby";
import { Game } from "./components/Game/Game";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "playing" || phase === "gameover") {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen overflow-hidden">
          <Game />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden">
        <Lobby />
      </div>
    </ErrorBoundary>
  );
}

export default App;
