import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
    console.error('[TeaNest ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('tea_nest_firestore_live_v1');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-6 text-center text-[#121513]">
          <div className="max-w-md w-full bg-white border border-[#e8dece] rounded-2xl p-8 shadow-2xl space-y-5">
            <div className="w-14 h-14 bg-[#fdf2e9] text-[#c5a059] rounded-full flex items-center justify-center mx-auto border border-[#c5a059]/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1b3b27]">
              Something went wrong
            </h2>
            <p className="text-xs text-[#55695c] leading-relaxed">
              We encountered an unexpected display issue. Please refresh the page or clear local cache to restore the view.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-[#257342] hover:bg-[#1e6136] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-[#f5f2eb] hover:bg-[#ede5d8] text-[#1b3b27] px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border border-[#d4b896]/40"
              >
                <span>Reset Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
