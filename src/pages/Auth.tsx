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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-[#0A0014]">
      
      {/* 🔙 Floating Back to Home Button */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <Link 
          to="/" 
          className="group flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/70 font-semibold text-sm hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 shadow-2xl hover:shadow-purple-500/20 active:scale-95"
          aria-label="Navigate back to home"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300 text-[#EC4899]" />
          <span>{t('btn_back_home', 'Back to Home')}</span>
        </Link>
      </div>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C3AED]/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#EC4899]/20 blur-[120px] animate-pulse" />

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-2xl border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border shadow-purple-500/5 overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95">
        {/* Top Decorative Neon Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#7C3AED] bg-[length:200%_auto] animate-neon-flash" />
        
        <CardHeader className="text-center pt-10 pb-6 space-y-4">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 blur-3xl opacity-20 scale-150 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full" />
            <div className="relative w-20 h-20 flex items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C3AED] to-[#EC4899] shadow-[0_20px_40px_rgba(124,58,237,0.3)] ring-1 ring-white/20">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] to-[#EC4899]">
              BachatKaro.
            </CardTitle>
            <CardDescription className="text-white/50 font-medium tracking-tight text-sm">
              Simple. Smart. <span className="text-white/80">Indian Expense Tracker.</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-white/5 p-1.5 rounded-2xl flex mb-8 border border-white/10">
              <TabsTrigger
                value="login"
                className="flex-1 h-12 rounded-xl text-sm font-bold transition-all duration-150
                  data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-white 
                  data-[state=inactive]:text-white/40 data-[state=inactive]:hover:bg-white/5"
              >
                {t('auth_login_tab', 'Login')}
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 h-12 rounded-xl text-sm font-bold transition-all duration-150
                  data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:text-white 
                  data-[state=inactive]:text-white/40 data-[state=inactive]:hover:bg-white/5"
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
          <div className="mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Secure Enterprise Encryption
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
