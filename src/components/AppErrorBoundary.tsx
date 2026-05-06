import React from 'react';

type State = {
  hasError: boolean;
  message: string;
};

type Props = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  declare props: Props;

  constructor(props: Props) {
    super(props);
  }

  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unknown error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled React error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h1 className="text-xl font-bold">Relay could not load this screen.</h1>
            <p className="text-sm text-slate-600">
              A runtime error occurred. Try refreshing, then open <code>/</code> to continue.
            </p>
            <p className="text-xs text-slate-500 break-words">{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
