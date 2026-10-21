import React from 'react';

interface BoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('HandyHearts render error', error instanceof Error ? error.name : 'unknown');
  }

  render(): React.ReactNode {
    if (this.state.failed) {
      return (
        <main id="main" className="min-h-screen flex items-center justify-center p-6">
          <div className="neo-card max-w-lg p-8">
            <h1 className="text-3xl font-black">Something went wrong</h1>
            <p className="mt-4 text-lg">Refresh the page to continue.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
