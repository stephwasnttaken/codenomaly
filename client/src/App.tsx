import { useGameStore } from "./stores/gameStore";
import { Lobby } from "./components/Lobby/Lobby";
import { Game } from "./components/Game/Game";

function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "playing" || phase === "gameover") {
    return <Game />;
  }

  return <Lobby />;
}

export default App;
