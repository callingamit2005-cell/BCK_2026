/**
 * LoginForm.tsx - BachatKaro Enterprise Edition
 * Security: Google OAuth + Cloudflare Turnstile (@marsidev/react-turnstile)
 * UI: Neon Gradient Premium Design
 * 🚀 FIX: Google OAuth now directly redirects to /dashboard instead of root (/).
 */

import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wrappedSignInWithPassword } from '@/utils/authForensics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { isValidEmail } from '@/lib/validators';
import { useLanguage } from '@/contexts/LanguageContext';
import { Turnstile } from '@marsidev/react-turnstile'; // 🛡️ Modern Security

const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    console.log("[BUTTON_CLICK_RECEIVED] Login Button Clicked", { timestamp: Date.now() });

    if (isLoggingInRef.current) {
        console.log("[BUTTON_DISABLED_STATE] Blocked by isLoggingInRef");
        return;
    }

    if (!isHuman) {
      console.log("[BUTTON_DISABLED_STATE] Blocked by !isHuman (Turnstile)");
      setError(t('error_bot_check', 'Please verify you are a human.'));
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
      console.log("[SIGNIN_LOADING_RESET]");
      setLoading(false);
      isLoggingInRef.current = false;
    }
  };

  const primaryGradient = "bg-white text-background hover:bg-white/90 shadow-lg border-none active:scale-[0.98]";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      
      {/* 🚀 Google Login Button */}
      <Button 
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-14 bg-background border border-border text-text-secondary font-bold rounded-xl flex items-center justify-center gap-3 hover:text-foreground hover:border-foreground transition-all shadow-sm group active:scale-[0.98]"
      >
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform grayscale opacity-70 group-hover:opacity-100 group-hover:grayscale-0" alt="G" />
        {t('auth_continue_google', 'Continue with Google')}
      </Button>

      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 h-px bg-border"></span>
        <span className="relative px-4 text-[10px] font-bold text-text-muted bg-surface uppercase tracking-widest">
          {t('auth_or_email', 'Or login with email')}
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest flex items-center gap-2">
            <Mail size={12} className="text-text-muted" />
            {t('auth_email', 'Email Address')}
          </Label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-background rounded-xl border-border text-foreground font-bold focus:border-foreground transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest flex items-center gap-2">
            <Lock size={12} className="text-text-muted" />
            {t('auth_password', 'Password')}
          </Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-background rounded-xl border-border text-foreground font-bold focus:border-foreground transition-all"
          />
        </div>

        {/* 🛡️ CLOUDFLARE TURNSTILE (Updated for @marsidev) */}
        <div 
          className="flex justify-center pt-2 overflow-hidden rounded-xl"
          onClick={() => console.log("[POINTER_BLOCKING_LAYER] Turnstile Container Tapped")}
        >
          <Turnstile 
            siteKey="1x00000000000000000000AA" // 👈 REPLACE with your REAL sitekey if needed
            onSuccess={() => {
                console.log("[BUTTON_DISABLED_STATE] Turnstile Success");
                setIsHuman(true);
            }}
            theme="light"
          />
        </div>

        {error && (
          <div className="text-[10px] font-bold text-foreground bg-background border border-border rounded-xl p-4 animate-shake uppercase tracking-widest shadow-sm">
            ⚠️ {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !isHuman}
          className={`w-full h-16 bg-foreground text-surface rounded-2xl font-bold text-base shadow-2xl hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30 uppercase tracking-[0.2em]`}
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          {t('auth_login_button', 'Sign In')}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
