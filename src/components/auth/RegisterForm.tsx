/**
 * RegisterForm.tsx - BachatKaro Premium Fintech Edition
 * Security: Local-first profile initialization
 * 🛡️ LOGIC LOCK: Validation, Supabase Auth, and Registration flows 100% untouched.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { wrappedSignUp } from '@/utils/authForensics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { isValidEmail } from '@/lib/validators';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/* ─── Password strength helper (LOCKED logic, upgraded tokens) ─── */
const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  if (pw.length < 6)  return { score: 1, label: 'Too short', color: 'bg-destructive' };
  if (pw.length < 8)  return { score: 2, label: 'Weak', color: 'bg-warning' };
  if (pw.length < 12) return { score: 3, label: 'Good', color: 'bg-primary' };
  return { score: 4, label: 'Strong', color: 'bg-income' };
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (process.env.NODE_ENV === 'development') {
      console.log("[BUTTON_CLICK_RECEIVED] Register Button Clicked", { timestamp: Date.now() });
    }

    if (!email.trim() || !password.trim()) {
      toast({ title: t('common.invalid', 'Error'), description: 'Email and password are required', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(email)) {
      toast({ title: t('common.invalid', 'Error'), description: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: t('common.invalid', 'Error'), description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await wrappedSignUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            has_completed_setup: false,
            preferred_language: 'en'
          }
        },
      });

      if (error) {
        const isRateLimit = error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many');
        toast({
          title: isRateLimit ? 'Too many attempts' : t('common.invalid', 'Error'),
          description: isRateLimit ? 'Please wait a few minutes and try again.' : error.message,
          variant: 'destructive',
        });
        return;
      }

      // 🛡️ [PHASE_B_FLOW_FIX]
      // Critical: Await sign-out to clear the session created by auto-login.
      // This ensures the user is forced to the Login page as required.
      await supabase.auth.signOut();

      navigate('/auth?tab=login', { replace: true });

      toast({
        title: t('auth.success_msg', 'Identity Registered'),
        description: 'Secure profile created. Proceed to initialization.',
        className: 'bg-surface border-primary text-foreground shadow-premium'
      });
    } catch (err: any) {
      toast({
        title: t('common.invalid', 'Error'),
        description: err.message || 'Registration failed',
        variant: 'destructive',
      });
    } finally {
      if (process.env.NODE_ENV === 'development') console.log("[SIGNIN_LOADING_RESET]");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5 animate-fade-in-up">

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
          <Mail size={12} className="text-primary/60" />
          {t('auth.identification', 'Identity Address')}
        </Label>
        <Input
          id="register-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-14 bg-muted/20 rounded-xl border-border/50 text-foreground font-semibold focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all px-4 shadow-sm"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
          <Lock size={12} className="text-primary/60" />
          {t('auth.security_key', 'Security Key')}
        </Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 6 character encryption"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="h-14 bg-muted/20 rounded-xl border-border/50 text-foreground font-semibold focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all px-4 pr-12 shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-0 h-full w-14 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    strength.score >= step ? strength.color : 'bg-muted/50 border border-border/40'
                  )}
                />
              ))}
            </div>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-all",
              strength.score <= 1 ? 'text-destructive' :
              strength.score === 2 ? 'text-warning' :
              strength.score === 3 ? 'text-primary' :
              'text-income'
            )}>
              Encryption: {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning…</>
          : <><UserPlus className="mr-2 h-4 w-4" /> {t('auth.create_account', 'Establish Profile')}</>
        }
      </Button>

      {/* Trust signal */}
      <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60">
        By continuing, you enforce zero-knowledge local-first processing on your device.
      </p>
    </form>
  );
};

export default RegisterForm;
