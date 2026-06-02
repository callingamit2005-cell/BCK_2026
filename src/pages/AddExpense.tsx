/**
 * AddExpense.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Dedicated Entry Terminal.
 * 🛡️ LOGIC LOCK: Routing and keyboard shortcuts 100% untouched.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SmartUniversalInput from "../components/SmartUniversalInput";
import AppHeader from "../components/layout/AppHeader";
import { Zap } from "lucide-react";

/**
 * AddExpense Page - Unified Smart Entry Engine
 * Layout: Centered for Web, Bottom-protected for Mobile.
 */
const AddExpense = () => {
  const navigate = useNavigate();

  // Keyboard shortcut: Esc to go back (Locked)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col antialiased">
      <AppHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-32 sm:p-8">
        
        {/* Top Branding Section (Visible on Desktop) */}
        <div className="text-center mb-8 hidden sm:block animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Record <span className="text-primary">Transaction</span>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Institutional Entry Terminal
          </p>
        </div>

        {/* The 3-in-1 Engine Wrapper */}
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
          <SmartUniversalInput />
        </div>

        {/* Desktop Hint */}
        <div className="mt-10 text-center hidden sm:block opacity-60">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Press <span className="px-2 py-1 bg-surface border border-border/60 rounded-md text-foreground shadow-sm mx-1.5 font-mono">ESC</span> to go back
          </p>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden mt-8 text-center opacity-60">
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            BachatKaro Intelligence OS
          </p>
        </div>

      </main>
    </div>
  );
};

export default AddExpense;
