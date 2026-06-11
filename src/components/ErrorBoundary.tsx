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
    console.error("🛡️ [CIRCUIT_BREAKER] Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/dashboard'; // Redirect to dashboard on reload to clear bad state
  };

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    navigator.clipboard.writeText(errorText);
    alert("Error details copied to clipboard. Please report this to support.");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 antialiased selection:bg-primary/10">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-surface p-10 shadow-premium">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-8 rounded-2xl bg-primary/5 p-5 border border-primary/10 shadow-inner group transition-all hover:bg-primary/10">
                <AlertTriangle className="h-12 w-12 text-primary animate-pulse" />
              </div>

              <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground uppercase">
                Circuit Breaker Active
              </h1>
              
              <p className="mb-8 text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em] leading-relaxed max-w-[280px]">
                High-integrity safety protocols activated due to an unexpected state failure.
              </p>

              <div className="mb-8 w-full rounded-2xl border border-border/40 bg-muted/20 p-5 text-left group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Forensic Trace</p>
                  <button 
                    onClick={this.handleCopyError}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Copy details
                  </button>
                </div>
                <p className="font-mono text-[11px] text-foreground font-bold break-all leading-tight">
                  {this.state.error?.message || "Unknown State Failure"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full">
                <Button
                  onClick={this.handleReload}
                  className="h-14 bg-primary text-primary-foreground rounded-xl font-black uppercase text-xs tracking-widest shadow-premium hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <RefreshCw className="h-4 w-4" />
                    <span>Reboot System</span>
                  </div>
                </Button>
                
                <p className="mt-4 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Institutional Reliability Layer · v2.0
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
