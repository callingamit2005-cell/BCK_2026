// src/components/auth/RegisterForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { wrappedSignUp } from '@/utils/authForensics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { isValidEmail } from '@/lib/validators';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[BUTTON_CLICK_RECEIVED] Register Button Clicked", { timestamp: Date.now() });

    // Validations (Amit bhai, aapka validation logic ekdum perfect hai)
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Email and password are required', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(email)) {
      toast({ title: 'Error', description: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // ✅ New Logic: Hum user metadata bhej rahe hain taaki profile table triggers handle kar sake
      const { error } = await wrappedSignUp({
        email: email.trim(),
        password,
        options: { 
          emailRedirectTo: window.location.origin,
          data: {
            has_completed_setup: false, // Smart routing trigger
            preferred_language: 'en'     // Default language
          }
        },
      });

      if (error) {
        const isRateLimit = error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many');
        toast({
          title: isRateLimit ? 'Too many attempts' : 'Error',
          description: isRateLimit ? 'Please wait a few minutes and try again.' : error.message,
          variant: 'destructive',
        });
        return;
      }

      // Perceived Performance: Instant feedback and navigation
      // Switch to login tab instantly via controlled URL state
      navigate('/auth?tab=login', { replace: true });

      // Handle feedback in background
      toast({
        title: 'Account Created!',
        description: 'Registration successful. Please log in with your credentials.',
      });
      
      // Handle session cleanup in background (non-blocking for UI)
      // Sign out to prevent auto-login before email verification
      supabase.auth.signOut().catch(err => console.error("SignOut error:", err));
    } catch (err: any) {
        toast({
            title: 'Error',
            description: err.message || 'Registration failed',
            variant: 'destructive',
        });
    } finally {
        console.log("[SIGNIN_LOADING_RESET]");
        setLoading(false);
    }
  };

  const gradientClass = "bg-gradient-to-r from-purple-600 to-pink-500";

  return (
    <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-[10px] font-bold text-white/20 ml-1 uppercase tracking-widest">Email Address</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 bg-white/5 rounded-xl border-white/5 text-white font-bold focus:border-white/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-[10px] font-bold text-white/20 ml-1 uppercase tracking-widest">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="h-12 bg-white/5 rounded-xl border-white/5 text-white font-bold focus:border-white/20 transition-all"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={`w-full h-14 bg-white text-background rounded-2xl font-black text-lg shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-20 uppercase tracking-widest`}
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;