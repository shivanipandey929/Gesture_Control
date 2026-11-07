import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in AeroTouch:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-xl text-white mb-2">Something went wrong</h2>
          <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 text-left w-full overflow-x-auto">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading text-xs font-bold hover:opacity-90 transition-all shadow-glow-cyan"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
