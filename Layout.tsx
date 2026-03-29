import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2ed] p-8 text-center">
          <h1 className="serif text-4xl font-light text-[#1a1a1a]">Something went wrong.</h1>
          <p className="mt-4 text-sm text-gray-500">We encountered an unexpected error. Please try refreshing the page.</p>
          <pre className="mt-8 max-w-2xl overflow-auto rounded-lg bg-white p-4 text-left text-[10px] text-red-500 shadow-sm">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 bg-[#1a1a1a] px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Refresh Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
