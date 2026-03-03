'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-deep p-8">
          <div className="max-w-lg w-full bg-bg-secondary border border-border rounded-2xl p-8 text-center">
            <div className="text-[3rem] mb-4">♔</div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.6rem] font-bold text-text-primary mb-3">
              Something went wrong
            </h1>
            <p className="text-text-secondary text-[0.9rem] mb-2">
              The application encountered an unexpected error.
            </p>
            <p className="font-[family-name:var(--font-mono)] text-[0.75rem] text-text-muted mb-6 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-md text-[0.85rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                  hover:shadow-[0_0_20px_rgba(201,162,39,0.15),0_2px_8px_rgba(201,162,39,0.3)]
                  transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 border border-border rounded-md text-text-secondary text-[0.85rem] font-semibold
                  hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
