import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-8 bg-slate-950 text-slate-200">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/50 rounded-xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 font-mono">
              {this.props.fallbackTitle || 'Component Rendering Error'}
            </h2>
            <p className="text-xs text-slate-400 mb-4 font-mono break-words bg-slate-950 p-3 rounded border border-slate-800 text-left">
              {this.state.error?.message || 'An unexpected error occurred while rendering.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-mono text-xs font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry / Recover View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
