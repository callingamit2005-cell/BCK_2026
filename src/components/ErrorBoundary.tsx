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
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 antialiased">
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-border bg-surface p-8 shadow-sm">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-6 rounded-2xl bg-background p-4 border border-border shadow-inner">
                <AlertTriangle className="h-10 w-10 text-[#999999]" />
              </div>

              <h1 className="mb-2 text-2xl font-black tracking-tighter text-[#111111] uppercase">
                Circuit Breaker Active
              </h1>
              
              <p className="mb-6 text-[10px] font-bold text-[#999999] uppercase tracking-widest leading-relaxed">
                The application encountered an unexpected state. High-integrity safety protocols have been activated.
              </p>

              <div className="mb-8 w-full rounded-xl border border-border bg-background/[0.02] p-4 text-left">
                <p className="font-mono text-[10px] text-[#666666] break-all leading-tight uppercase font-bold">
                  {this.state.error?.message || "Unknown State Failure"}
                </p>
              </div>

              <Button
                onClick={this.handleReload}
                className="w-full h-14 bg-[#111111] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#111111]/90 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Reboot System</span>
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
