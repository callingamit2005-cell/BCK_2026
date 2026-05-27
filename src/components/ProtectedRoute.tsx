// src/components/auth/ProtectedRoute.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  // 🔹 Show polished loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background antialiased">
        <div className="flex flex-col items-center gap-8 p-12 bg-surface rounded-[40px] border border-border shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-foreground/5 border-t-foreground animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[11px] font-bold text-foreground uppercase tracking-[0.3em] animate-pulse">
              Authenticating Session
            </p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Securing Financial Environment
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 If not logged in → go to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 🔹 If logged in → show page
  return children;
};

export default ProtectedRoute;