import { Component, type ErrorInfo, type ReactNode } from "react";

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
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
          <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
          <p className="text-white/70 text-sm mb-4">The game hit an error. Try refreshing the page.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] text-white rounded-lg text-sm border border-white/20"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
