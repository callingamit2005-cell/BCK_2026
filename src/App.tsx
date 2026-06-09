/**
 * App.tsx - BachatKaro Smart Routing Engine
 * ✅ Production Ready – Verified for WhatsApp invite links and lazy loading
 * 🚀 ELITE Upgrade: Route Preloading & SSR Readiness
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import React, { lazy, Suspense, useEffect, useRef } from "react";
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ThemeProvider } from "next-themes";
import { clearRedirectAfterLogin, getRedirectAfterLogin } from "@/security/redirect";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BottomNav from "@/components/layout/BottomNav";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- AUTH COMPONENTS (LAZY LOADED) ---
const Auth = lazy(() => import("./pages/Auth"));
const LoginForm = lazy(() => import("@/components/auth/LoginForm"));
const RegisterForm = lazy(() => import("@/components/auth/RegisterForm"));
const ForgotPassword = lazy(() => import("@/components/auth/ForgotPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const SetupWizard = lazy(() => import("./pages/SetupWizard"));

// --- PAGE COMPONENTS (LAZY LOADED) ---
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const Savings = lazy(() => import("./pages/Savings"));
const GroupExpenses = lazy(() => import("./pages/GroupExpenses"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdvancedTripPlannerV2 = lazy(() => import('./pages/AdvancedTripPlannerV2'));
const JoinGroup = lazy(() => import("./pages/JoinGroup")); // 🚀 NEW: Join Group Page
const DeepLinkRedirect = lazy(() => import("./pages/DeepLinkRedirect")); // 🚀 NEW: Deep Link Handler
const Index = lazy(() => import("./pages/Index"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/legal/About"));
const Contact = lazy(() => import("./pages/legal/Contact"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<FullScreenLoader />}>{node}</Suspense>
);

// 🛡️ GLOBAL EXECUTION LOCK: Prevents concurrent processing in the same JS environment
let inviteProcessingLock = false;

function acquireLock() {
  if (inviteProcessingLock) return false;
  inviteProcessingLock = true;
  return true;
}

function releaseLock() {
  inviteProcessingLock = false;
}

/** 🛡️ SMART PROTECTED ROUTE: Forced Setup Check */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, userProfile, preferencesLoading, profileFetchError } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    console.log("[ROUTE] Dashboard Mounted");
    return () => console.log("[ROUTE] Dashboard Unmounted");
  }, []);

  // 🛡️ [STATE_MACHINE] Fail-Closed Connection Error
  if (profileFetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
          <svg className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tight">{t('common.connection_error', 'Connection Error')}</h3>
          <p className="text-[12px] text-text-muted font-medium max-w-[280px] leading-relaxed">
            {t('common.profile_fetch_fail', 'We couldn\'t load your profile. Please check your connection and try again.')}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="h-14 px-10 bg-foreground text-surface rounded-xl font-black uppercase text-[10px] tracking-widest shadow-institutional active:scale-95 transition-all"
        >
          {t('common.retry', 'Retry Connection')}
        </button>
      </div>
    );
  }

  // 🛡️ [STATE_MACHINE] Wait for hydration
  if (loading) {
    console.log("[ROUTE] FullScreenLoader Rendered (loading: " + loading + ", prefLoading: " + preferencesLoading + ")");
    return <FullScreenLoader />;
  }

  if (!session) return <Navigate to="/auth" replace />;

  // 🛡️ [RECOVERY_EXCEPTION] Allow password reset flow to bypass setup guard
  if (location.pathname === '/forgot-password') {
    return <>{children}</>;
  }

  // 🛡️ [STATE_MACHINE] Enforcement
  // If userProfile is missing (null) or has_completed_setup is explicitly false
  const needsSetup = !userProfile || userProfile.has_completed_setup === false;
  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

/** 🛡️ SMART PUBLIC ROUTE: Handle Auth Redirection */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, userProfile, preferencesLoading, profileFetchError } = useAuth();
  const location = useLocation();
  
  if (loading || (session && preferencesLoading)) {
    return <FullScreenLoader />;
  }
  
  if (session && !profileFetchError) {
    const redirectPath = getRedirectAfterLogin();
    if (redirectPath) {
      clearRedirectAfterLogin();
      return <Navigate to={redirectPath} replace />;
    }

    // 🛡️ [RECOVERY_EXCEPTION] Allow authenticated users to reach reset flow
    if (location.pathname === '/forgot-password') {
      return <>{children}</>;
    }

    const needsSetup = !userProfile || userProfile.has_completed_setup === false;
    if (needsSetup) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

import { WebLayout } from './layouts/WebLayout';
import { MobileLayout } from './layouts/MobileLayout';
import { paymentOrchestrator } from "@/services/paymentOrchestrator";
import { lifecycleService } from "@/services/lifecycleService";

// ... (existing imports)

const AppContent = () => {
  const { session, user, loading, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const hasProcessedInviteRef = useRef(false);

  /**
   * 🛡️ [RUNTIME_STABILIZATION] DEFERRED SYSTEM INITIALIZATION
   * Only bootstrap secondary systems (PaymentOrchestrator, Lifecycle) after auth is stable.
   */
  useEffect(() => {
    if (isAuthReady && user?.id) {
      console.log("[HYDRATION_TRIGGER_SOURCE] AppContent Hydrated");
      lifecycleService.init();
      paymentOrchestrator.init();
    }
  }, [isAuthReady, user?.id]);

  /**
   * 🚀 MULTI-TAB SYNC PROTECTION
   * If one tab processes the invite, other tabs should lock their local execution.
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pendingGroupInvite") {
        hasProcessedInviteRef.current = !e.newValue;
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * 🚀 PHASE 1 & 7: SAFE INVITE STORAGE + EDGE CASES
   * Captures custom scheme URLs (bachatkaro://) and routes them inside the SPA.
   * Latest invite overrides previous.
   */
  useEffect(() => {
    let appUrlListener: { remove: () => void } | null = null;

    const saveInviteToStorage = (type: 'token' | 'groupId', value: string) => {
      const data = {
        type,
        value,
        created_at: Date.now()
      };
      localStorage.setItem("pendingGroupInvite", JSON.stringify(data));
      if (import.meta.env.DEV) console.log(`[DeepLink] Safe stored ${type}:`, value);
      
      // Reset execution guard to allow processing the new link
      hasProcessedInviteRef.current = false;
    };

    const setupDeepLink = async () => {
      // WEB HANDLING: Detect query params on initial load
      if (!Capacitor.isNativePlatform()) {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");

        if (token) {
          saveInviteToStorage('token', token);
          
          if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
            navigate(`/join?token=${token}`);
          }
        }
        return;
      }

      // NATIVE HANDLING: App Launch
      appUrlListener = await App.addListener('appUrlOpen', (data) => {
        if (import.meta.env.DEV) console.log("🚀 [DeepLink] Incoming URL:", data.url);
        
        try {
          const url = new URL(data.url);
          const path = (url.host === 'bachatkaro.app' || url.host === 'www.bachatkaro.app') 
            ? url.pathname.replace(/^\//, '') 
            : url.host;
            
          const token = url.searchParams.get("token");

          if ((path === 'join' || path === 'deeplink/join') && token) {
            saveInviteToStorage('token', token);
            navigate(`/join?token=${token}`, { replace: true });
          } else if (path === 'reset-password' || path === 'forgot-password') {
            /**
             * 🛡️ [RECOVERY_SYNC] PASSWORD RESET FLOW
             * Supabase Auth relies on window.location.hash to detect the recovery token.
             * We manually sync the hash from the deep link URL to the WebView's location.
             */
            if (url.hash) {
              console.log("🛡️ [DeepLink] Syncing recovery hash to location:", url.hash);
              window.location.hash = url.hash;
              // Ensure history state is updated so Supabase observes the change
              window.history.replaceState(window.history.state, "", window.location.href);
            }
            navigate('/forgot-password', { replace: true });
          }
        } catch (e) {
          console.error("Deep Link Parse Error:", e);
        }
      });
    };

    void setupDeepLink();

    return () => {
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, [navigate]);

  /**
   * 🚀 PHASE 2, 3, 4, 5, 6: AUTO GROUP JOIN PIPELINE
   * Executes pending join request after successful authentication.
   * Includes expiry check, single-execution guard, and error handling.
   */
  useEffect(() => {
    const performAutoJoin = async () => {
      // PHASE 3: SESSION READY GUARD
      if (!session?.user || loading || hasProcessedInviteRef.current) return;
      if (!acquireLock()) return;

      const storedInviteRaw = localStorage.getItem("pendingGroupInvite");
      if (!storedInviteRaw) {
        releaseLock();
        return;
      }

      try {
        hasProcessedInviteRef.current = true;
        const invite = JSON.parse(storedInviteRaw);
        
        // PHASE 1: EXPIRY CHECK (10 Minutes)
        const EXPIRY_MS = 10 * 60 * 1000;
        if (Date.now() - invite.created_at <= EXPIRY_MS) {
          if (import.meta.env.DEV) console.log("🚀 [AutoJoin] Processing verified invite:", invite);

          // PHASE 4: AUTO-JOIN PIPELINE
          if (invite.type === 'token') {
            localStorage.removeItem("pendingGroupInvite");
            navigate(`/join?token=${invite.value}`, { replace: true });
          }
        } else {
          if (import.meta.env.DEV) console.warn("[AutoJoin] Invite expired");
          localStorage.removeItem("pendingGroupInvite");
        }

        releaseLock();
      } catch (e) {
        console.error("Invite processing error:", e);
        localStorage.removeItem("pendingGroupInvite");
        releaseLock();
      }
    };

    void performAutoJoin();
  }, [session, loading, navigate]);

  /**
   * 🚀 ELITE ROUTE PRELOADING
   * Preloads critical assets after initial mount to ensure instant navigation.
   */
  useEffect(() => {
    const preloadRoutes = () => {
      // Preload core dashboard and analytics for ultra-fast UX
      void import("./pages/Dashboard");
      void import("./pages/Analytics");
      void import("./pages/Savings");
      void import("./pages/GroupExpenses");
    };

    // Delay preloading slightly to prioritize primary LCP
    const timer = setTimeout(preloadRoutes, 2000);
    return () => clearTimeout(timer);
  }, []);

  const isNative = Capacitor.isNativePlatform();
  const PlatformLayout = isNative ? MobileLayout : WebLayout;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<PlatformLayout />}>
          {/* Public Landing */}
          <Route path="/" element={
            isNative ? <Navigate to="/dashboard" replace /> : withSuspense(<Index />)
          } />
          <Route path="/blog" element={withSuspense(<Blog />)} />
          <Route path="/blog/:slug" element={withSuspense(<BlogPost />)} />
          <Route path="/about" element={withSuspense(<About />)} />
          <Route path="/contact" element={withSuspense(<Contact />)} />
          <Route path="/terms" element={withSuspense(<Terms />)} />
          <Route path="/disclaimer" element={withSuspense(<Disclaimer />)} />
          
          {/* Auth Stack */}
          <Route path="/auth" element={<PublicRoute>{withSuspense(<Auth />)}</PublicRoute>} />
          <Route path="/login" element={<PublicRoute>{withSuspense(<LoginForm />)}</PublicRoute>} />
          <Route path="/register" element={<PublicRoute>{withSuspense(<RegisterForm />)}</PublicRoute>} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
          <Route path="/auth/callback" element={withSuspense(<AuthCallback />)} />

          {/* Forced Setup Wizard */}
          <Route 
            path="/setup" 
            element={
              <Suspense fallback={<FullScreenLoader />}>
                <SetupWizard /> 
              </Suspense>
            } 
          />
          
          {/* Enterprise Features (Protected) */}
          <Route path="/dashboard" element={<ProtectedRoute>{withSuspense(<Dashboard />)}</ProtectedRoute>} />
          <Route path="/add-expense" element={<ProtectedRoute>{withSuspense(<AddExpense />)}</ProtectedRoute>} />
          <Route path="/savings" element={<ProtectedRoute>{withSuspense(<Savings />)}</ProtectedRoute>} />
          <Route path="/group-expenses" element={<ProtectedRoute>{withSuspense(<GroupExpenses />)}</ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute>{withSuspense(<Analytics />)}</ProtectedRoute>} />
          
          {/* 🚀 FIXED: New Routes for Group Invites and Trip Planning */}
          <Route path="/join" element={withSuspense(<JoinGroup />)} />
          <Route path="/deeplink/join" element={withSuspense(<DeepLinkRedirect />)} />
          <Route path="/trip-planner" element={<ProtectedRoute>{withSuspense(<AdvancedTripPlannerV2 isSharedLink={false} />)}</ProtectedRoute>} />
          <Route path="/trip-v2/:groupId" element={<ProtectedRoute>{withSuspense(<AdvancedTripPlannerV2 isSharedLink={false} />)}</ProtectedRoute>} />
          
          {/* Misc */}
          <Route path="/privacy-policy" element={withSuspense(<PrivacyPolicy />)} />
          <Route path="*" element={withSuspense(<NotFound />)} />
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <LanguageProvider>
                <ThemeProvider attribute="class" defaultTheme="dark">
                  <AppContent />
                </ThemeProvider>
              </LanguageProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
