/**
 * Auth Page - BachatKaro Fintech
 * Premium Institutional Command Center
 * 🛡️ LOGIC LOCK: Authentication, Redirects, and State Management 100% untouched.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import {
  clearRedirectAfterLogin,
  getRedirectAfterLogin,
  sanitizeInternalRedirect,
  setRedirectAfterLogin,
} from "@/security/redirect";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { t } = useLanguage(); 

  const isNative = Capacitor.isNativePlatform();

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
    // 🛡️ ANTI-MARKETING GUARD: Only show waitlist toast on web.
    if (!isNative && !sessionStorage.getItem("waitlist_flash_shown")) {
      toast(
        <div className="flex flex-col gap-1">
          <p className="text-sm">
            Have you joined the waitlist to become our family? Free{" "}
            <a 
              href="/#waitlist" 
              style={{ textDecoration: "underline" }} 
              className="font-bold text-primary hover:text-primary/80 transition-colors"
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
  }, [isNative]);

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
      if (process.env.NODE_ENV === 'development') {
        console.log("[POINTER_BLOCKING_LAYER] Global Click Detected", {
          tag: target.tagName,
          id: target.id,
          className: target.className,
          isBlocked: window.getComputedStyle(target).pointerEvents === 'none',
          zIndex: window.getComputedStyle(target).zIndex
        });
      }
    };
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  // 🛡️ ZERO FLICKER AUTH GUARD
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      
      {/* 🔙 Floating Back to Home Button */}
      {!isNative && (
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
          <Link 
            to="/" 
            className="group flex items-center gap-3 px-6 py-2.5 bg-surface border border-border/60 rounded-full text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:text-foreground hover:border-primary/30 transition-all duration-300 shadow-sm active:scale-95"
            aria-label="Navigate back to home"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{t('btn_back_home', 'Back to Home')}</span>
          </Link>
        </div>
      )}

      {/* Subtle Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <Card className="w-full max-w-md bg-surface border border-border/40 rounded-modal shadow-institutional overflow-hidden transition-all duration-700 animate-in fade-in zoom-in-95 relative z-10 hover:shadow-2xl">
        <div className="h-1.5 w-full bg-primary" />
        
        <CardHeader className="text-center pt-12 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group transition-transform duration-700 hover:scale-105">
              <Wallet className="h-10 w-10 text-primary" />
              <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse opacity-50" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Bachat<span className="text-primary">Karo</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
              Institutional • Precision • Fintech OS
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-12">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-muted/20 p-1.5 rounded-2xl flex mb-10 border border-border/40 shadow-inner">
              <TabsTrigger
                value="login"
                className={cn(
                  "flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
                  "data-[state=active]:bg-surface data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground active:scale-95"
                )}
              >
                {t('auth_login_tab', 'Login')}
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className={cn(
                  "flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
                  "data-[state=active]:bg-surface data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-border/50",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground active:scale-95"
                )}
              >
                {t('auth_register_tab', 'Register')}
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="login" 
              className={`mt-0 animate-in slide-in-from-left-4 duration-300 ${activeTab !== 'login' ? 'hidden' : ''}`}
              forceMount
            >
              <LoginForm />
            </TabsContent>

            <TabsContent 
              value="register" 
              className={`mt-0 animate-in slide-in-from-right-4 duration-300 ${activeTab !== 'register' ? 'hidden' : ''}`}
              forceMount
            >
              <RegisterForm />
            </TabsContent>
          </Tabs>

          {/* Footer Security Badge */}
          <div className="mt-12 flex items-center justify-center gap-3 py-4 px-6 bg-muted/20 rounded-2xl border border-border/40 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary opacity-80" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('auth.institutional_encryption', 'Institutional-Grade Encryption')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
