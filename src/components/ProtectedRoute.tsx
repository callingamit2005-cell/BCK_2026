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
        <div className="flex flex-col items-center gap-6 p-10 bg-surface rounded-[24px] border border-white/5 shadow-sm">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] animate-pulse">
            Authenticating Session
          </p>
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