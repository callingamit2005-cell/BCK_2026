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

  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      
      {/* 🚀 Google Login Button */}
      <Button 
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-13 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm group active:scale-[0.965] cubic-bezier(0.34, 1.56, 0.64, 1)"
      >
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
        {t('auth_continue_google', 'Continue with Google')}
      </Button>

      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 h-px bg-slate-100"></span>
        <span className="relative px-4 text-[10px] font-black text-slate-400 bg-white uppercase tracking-widest">
          {t('auth_or_email', 'Or login with email')}
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
            <Mail size={14} className="text-[#7C3AED]" />
            {t('auth_email', 'Email Address')}
          </Label>
          <Input
            type="email"
            placeholder="amit@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
            <Lock size={14} className="text-[#EC4899]" />
            {t('auth_password', 'Password')}
          </Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-[#EC4899]/20 transition-all"
          />
        </div>

        {/* 🛡️ CLOUDFLARE TURNSTILE (Updated for @marsidev) */}
        <div 
          className="flex justify-center pt-2 overflow-hidden rounded-xl border-debug"
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
          <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl p-4 animate-shake">
            ⚠️ {error}
          </div>
        )}

        {(() => {
          console.log("[BUTTON_RENDER] Login Button Rendered", { loading, isHuman, isLoggingIn: isLoggingInRef.current });
          return null;
        })()}
        <Button
          type="submit"
          disabled={loading || !isHuman}
          className={`w-full h-14 ${primaryGradient} text-white rounded-2xl font-black text-lg shadow-[0_15px_30px_-5px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50`}
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          {t('auth_login_button', 'Sign In')}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
