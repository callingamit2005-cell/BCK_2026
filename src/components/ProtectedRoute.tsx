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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 animate-pulse opacity-20 absolute inset-0"></div>
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin relative z-10" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            Checking authentication...
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