import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import React, { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import ForgotPassword from '@/components/auth/ForgotPassword';

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Savings from "./pages/Savings";
import GroupExpenses from "./pages/GroupExpenses";
import NotFound from "./pages/NotFound";
import TripShareHandler from './pages/TripShareHandler';
import TripPlanView from './pages/TripPlanView';
import SetupWizard from './pages/SetupWizard';

// Lazy load for Analytics
const Analytics = lazy(() => import("./pages/Analytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  const isAnalyticsEnabled = String(import.meta.env.VITE_ENABLE_ANALYTICS) === 'true';

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-gray-100 transition-colors duration-300">
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
                    <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
                    <Route path="/group-expenses" element={<ProtectedRoute><GroupExpenses /></ProtectedRoute>} />
                    <Route path="/trip-share/:groupId" element={<TripShareHandler />} />
                    <Route path="/trip-plan/:planId" element={<TripPlanView />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/setup" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />

                    {isAnalyticsEnabled && (
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <Suspense fallback={
                              <div className="flex justify-center items-center h-screen">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
                              </div>
                            }>
                              <Analytics />
                            </Suspense>
                          </ProtectedRoute>
                        }
                      />
                    )}

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </ThemeProvider>
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;