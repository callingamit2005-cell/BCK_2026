import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SmartUniversalInput from "../components/SmartUniversalInput";
import AppHeader from "../components/layout/AppHeader";

/**
 * AddExpense Page - Unified Smart Entry Engine
 * Layout: Centered for Web, Bottom-protected for Mobile.
 */
const AddExpense = () => {
  const navigate = useNavigate();

  // Keyboard shortcut: Esc to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      <AppHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-32 sm:p-8">
        
        {/* Top Branding Section (Visible on Desktop) */}
        <div className="text-center mb-8 hidden sm:block animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Smart <span className="text-[#EC4899]">Entry</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
            Enterprise Grade Input System
          </p>
        </div>

        {/* The 3-in-1 Engine Wrapper */}
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-700">
          <SmartUniversalInput />
        </div>

        {/* Desktop Hint */}
        <div className="mt-8 text-center hidden sm:block">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            Press <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 shadow-sm mx-1">Esc</span> to go back
          </p>
        </div>

        {/* Mobile Header (Fallback for when AppHeader is too much) */}
        <div className="sm:hidden mt-6 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            BachatKaro Intelligence v2.1
          </p>
        </div>

      </main>
    </div>
  );
};

export default AddExpense;
