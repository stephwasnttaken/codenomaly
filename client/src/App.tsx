import { useGameStore } from "./stores/gameStore";
import { Lobby } from "./components/Lobby/Lobby";
import { Game } from "./components/Game/Game";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "playing" || phase === "gameover") {
    return (
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Lobby />
    </ErrorBoundary>
  );
}

export default App;
