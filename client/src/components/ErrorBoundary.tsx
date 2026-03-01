import { Component, type ErrorInfo, type ReactNode } from "react";
import { useGameStore } from "../stores/gameStore";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    const phase = useGameStore.getState().phase;
    if (phase === "gameover" || phase === "playing") {
      useGameStore.getState().updateState({ phase: "lobby", files: [], errors: [] });
      useGameStore.getState().setSelectedFile(null);
      this.setState({ hasError: false });
    }
  }

  componentDidUpdate(): void {
    // Clear error state when we're in lobby so the boundary resets after return-to-lobby
    if (this.state.hasError && useGameStore.getState().phase === "lobby") {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If we're already in lobby (e.g. return-to-lobby succeeded but something threw during unmount),
      // show lobby instead of the error screen so the user doesn't see "Something went wrong".
      if (useGameStore.getState().phase === "lobby") {
        return this.props.children;
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
          <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
          <p className="text-white/70 text-sm mb-4">The game hit an error. Try refreshing the page.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="btn-pixel"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
