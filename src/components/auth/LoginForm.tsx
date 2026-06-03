/**
 * LoginForm.tsx - BachatKaro Premium Fintech Edition
 * Security: Google OAuth + Cloudflare Turnstile (@marsidev/react-turnstile)
 * 🛡️ LOGIC LOCK: Validation, Supabase Auth, and Turnstile logic 100% untouched.
 */

import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wrappedSignInWithPassword } from '@/utils/authForensics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isValidEmail } from '@/lib/validators';
import { useLanguage } from '@/contexts/LanguageContext';
import { Turnstile } from '@marsidev/react-turnstile'; // 🛡️ Modern Security
import { cn } from '@/lib/utils';

const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHuman, setIsHuman] = useState(false); // 🚀 Bot Protection State

  // 🛡️ PHASE 1: PREVENT DOUBLE LOGIN
  const isLoggingInRef = useRef(false);

  // 🛠️ LOGIC: Google OAuth
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 🚀 CRITICAL FIX: Directing the Google Taxi straight to the Dashboard
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🛠️ LOGIC: Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (process.env.NODE_ENV === 'development') {
      console.log("[BUTTON_CLICK_RECEIVED] Login Button Clicked", { timestamp: Date.now() });
    }

    if (isLoggingInRef.current) {
      if (process.env.NODE_ENV === 'development') console.log("[BUTTON_DISABLED_STATE] Blocked by isLoggingInRef");
      return;
    }

    if (!isHuman) {
      if (process.env.NODE_ENV === 'development') console.log("[BUTTON_DISABLED_STATE] Blocked by !isHuman (Turnstile)");
      setError(t('error_bot_check', 'Please complete the verification check below.'));
      return;
    }

    // 🛡️ PHASE 2: VALIDATE INPUT BEFORE LOGIN
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(t('error_required', 'Email and password are required.'));
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(t('error_invalid_email', 'Enter a valid email address.'));
      return;
    }

    isLoggingInRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { error } = await wrappedSignInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      // 🛡️ PHASE 3: RESET LOCK & LOADING
      if (process.env.NODE_ENV === 'development') console.log("[SIGNIN_LOADING_RESET]");
      setLoading(false);
      isLoggingInRef.current = false;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Google Login */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-14 bg-surface border border-border/60 text-foreground font-bold rounded-xl flex items-center justify-center gap-3 hover:border-primary/40 transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest shadow-sm"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {t('auth_continue_google', 'Continue with Google')}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-1 h-px bg-border/50" />
        <span className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {t('auth_or_email', 'Or secure sign in')}
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Email + Password form */}
      <form onSubmit={handleLogin} className="space-y-5">

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Mail size={12} className="text-primary/60" />
            {t('auth_email', 'Email Identity')}
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-14 bg-muted/20 rounded-xl border-border/50 text-foreground font-semibold focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all px-4 shadow-sm"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Lock size={12} className="text-primary/60" />
              {t('auth_password', 'Security Key')}
            </Label>
            <Button
              variant="link"
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[10px] text-muted-foreground hover:text-primary font-bold uppercase tracking-widest h-auto p-0 transition-colors"
            >
              {t('auth.forgot_password_link', 'Forgot password?')}
            </Button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-14 bg-muted/20 rounded-xl border-border/50 text-foreground font-semibold focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all px-4 pr-12 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* 🛡️ CLOUDFLARE TURNSTILE */}
        <div className="flex justify-center overflow-hidden rounded-xl border border-border/30 bg-muted/20 shadow-inner p-1">
          <Turnstile
            siteKey="1x00000000000000000000AA" // 👈 REPLACE with your REAL sitekey if needed
            onSuccess={() => {
              if (process.env.NODE_ENV === 'development') console.log("[BUTTON_DISABLED_STATE] Turnstile Success");
              setIsHuman(true);
            }}
            theme="dark"
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 text-[11px] font-bold text-destructive bg-destructive/5 border border-destructive/20 rounded-xl p-4 uppercase tracking-wider shadow-inner"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="mt-0.5">{error}</span>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || !isHuman}
          className="w-full h-14 mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating…</>
            : <><LogIn className="mr-2 h-4 w-4" /> {t('auth_login_button', 'Initialize Session')}</>
          }
        </Button>

        {/* Turnstile hint when not verified */}
        {!isHuman && (
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Complete verification to enable access
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
