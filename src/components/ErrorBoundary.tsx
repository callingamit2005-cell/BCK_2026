import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Enterprise Grade Crash Protection
 * Design: True Dark Neon Glass V2
 * Physics: Apple-grade fluidity
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0014] p-6">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[rgba(255,15,123,0.35)] bg-white/5 p-8 backdrop-blur-[32px] shadow-[0_0_40px_-10px_rgba(255,15,123,0.3)]">
            {/* Neon Bloom Effect */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[rgba(255,15,123,0.4)] blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[rgba(123,31,162,0.4)] blur-[60px]" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-red-500/10 p-4 ring-1 ring-red-500/50">
                <AlertTriangle className="h-12 w-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              </div>

              <h1 className="mb-2 text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                SYSTEM CRITICAL
              </h1>
              
              <p className="mb-6 font-mono text-sm text-white/70">
                The application encountered an unexpected state and has activated safety protocols.
              </p>

              <div className="mb-8 w-full rounded-xl border border-white/10 bg-black/40 p-4 text-left">
                <p className="font-mono text-xs text-red-400 break-all">
                  {this.state.error?.message || "Unknown Error"}
                </p>
              </div>

              <Button
                onClick={this.handleReload}
                className="group relative min-h-[50px] min-w-[44px] w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#701A75] to-[#EC4899] font-bold text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 ease-butter-soft active:scale-[0.965] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 transition-transform duration-700 group-hover:rotate-180" />
                  <span>REBOOT SYSTEM</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
