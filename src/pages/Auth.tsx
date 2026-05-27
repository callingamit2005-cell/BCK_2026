/**
 * Auth Page - BachatKaro Fintech
 * Premium Neon-Gradient Enterprise UI
 * Updated: Added Back to Home Button & i18n Support
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext"; // 🚀 Added for translations
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Wallet, ShieldCheck, ArrowLeft } from "lucide-react"; // 🚀 Added ArrowLeft
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import {
  clearRedirectAfterLogin,
  getRedirectAfterLogin,
  sanitizeInternalRedirect,
  setRedirectAfterLogin,
} from "@/security/redirect";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { t } = useLanguage(); // 🚀 Engine initialized

  // SEO Optimization
  useSeoMeta(
    "Authentication | BachatKaro",
    "Login or Register to BachatKaro to start tracking your expenses and managing your budget efficiently."
  );

  // Perceived Performance: Handle active tab via URL
  const activeTab = searchParams.get("tab") === "register" ? "register" : "login";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  useEffect(() => {
    if (!sessionStorage.getItem("waitlist_flash_shown")) {
      toast(
        <div className="flex flex-col gap-1">
          <p className="text-sm">
            Have you joined the waitlist to become our family? Free{" "}
            <a 
              href="/#waitlist" 
              style={{ textDecoration: "underline" }} 
              className="font-bold"
            >
              Join Waitlist
            </a>
          </p>
        </div>,
        {
          duration: 8000,
        }
      );
      sessionStorage.setItem("waitlist_flash_shown", "true");
    }
  }, []);

  useEffect(() => {
    const returnUrlParam = searchParams.get("returnUrl");
    if (!returnUrlParam) return;
    const safe = sanitizeInternalRedirect(decodeURIComponent(returnUrlParam));
    if (safe) {
      setRedirectAfterLogin(safe);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log("[POINTER_BLOCKING_LAYER] Global Click Detected", {
        tag: target.tagName,
        id: target.id,
        className: target.className,
        isBlocked: window.getComputedStyle(target).pointerEvents === 'none',
        zIndex: window.getComputedStyle(target).zIndex
      });
    };
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  // 🛡️ ZERO FLICKER AUTH GUARD: Handled by PublicRoute in App.tsx, 
  // but added here as a second layer of defense.
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // UI SYSTEM CONSTANTS
  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]";
  const glassBackground = "bg-white/70 backdrop-blur-2xl border-white/40";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      
      {/* 🔙 Floating Back to Home Button */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <Link 
          to="/" 
          className="group flex items-center gap-3 px-6 py-2.5 bg-surface border border-border rounded-full text-text-secondary font-bold text-xs hover:text-foreground hover:border-foreground transition-all duration-300 shadow-sm active:scale-95"
          aria-label="Navigate back to home"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span>{t('btn_back_home', 'Back to Home')}</span>
        </Link>
      </div>

      {/* Subtle Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <Card className="w-full max-w-md bg-surface border border-border rounded-[40px] shadow-2xl overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95 relative z-10">
        <CardHeader className="text-center pt-12 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-[32px] bg-background border border-border shadow-inner">
              <Wallet className="h-10 w-10 text-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tighter text-foreground uppercase">
              BachatKaro
            </CardTitle>
            <CardDescription className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">
              Simple • Smart • <span className="text-foreground">Indian Expense Tracker.</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-12">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-background p-1.5 rounded-2xl flex mb-10 border border-border">
              <TabsTrigger
                value="login"
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-150
                  data-[state=active]:bg-surface data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border
                  data-[state=inactive]:text-text-muted data-[state=inactive]:hover:text-foreground"
              >
                {t('auth_login_tab', 'Login')}
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-150
                  data-[state=active]:bg-surface data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border
                  data-[state=inactive]:text-text-muted data-[state=inactive]:hover:text-foreground"
              >
                {t('auth_register_tab', 'Register')}
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="login" 
              className={`mt-0 animate-in slide-in-from-left-4 duration-150 ${activeTab !== 'login' ? 'hidden' : ''}`}
              forceMount
            >
              <LoginForm />
            </TabsContent>

            <TabsContent 
              value="register" 
              className={`mt-0 animate-in slide-in-from-right-4 duration-150 ${activeTab !== 'register' ? 'hidden' : ''}`}
              forceMount
            >
              <RegisterForm />
            </TabsContent>
          </Tabs>

          {/* Footer Security Badge */}
          <div className="mt-10 flex items-center justify-center gap-3 py-4 px-6 bg-background rounded-2xl border border-border shadow-inner">
            <ShieldCheck className="h-4 w-4 text-text-secondary" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
              Enterprise-Grade Encryption
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
