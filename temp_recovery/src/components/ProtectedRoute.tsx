import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  // 🔹 Show loader only while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Checking authentication...
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
