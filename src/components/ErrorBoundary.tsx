import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown): void {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full grid place-items-center p-10">
          <div className="max-w-lg">
            <div className="page-kicker mb-3">Something broke</div>
            <h1 className="page-title mb-4">
              A chart tripped over the data.
            </h1>
            <p className="page-lede mb-6">
              The error has been logged to the console. Reloading the page
              usually clears transient problems.
            </p>
            <pre className="rounded border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700 whitespace-pre-wrap break-all">
              {this.state.error.message}
            </pre>
            <button
              className="btn btn-primary mt-6"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
