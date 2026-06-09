import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, KeyRound, ShieldCheck, MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { appEnv } from '@/config/env';
import { Capacitor } from '@capacitor/core';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    /**
     * 🛡️ RECOVERY MODE DETECTION
     * Supabase redirects users to the site with a hash containing access_token 
     * and type=recovery when they click the reset link.
     */
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      console.log("🛡️ [RECOVERY_DETECTION] Active recovery session identified via URL hash.");
      setIsRecoveryMode(true);
    } else if (session?.user && !isRecoveryMode) {
        // Fallback for cases where session was already hydrated via onAuthStateChange
        console.log("🛡️ [RECOVERY_DETECTION] Authenticated session detected.");
        setIsRecoveryMode(true);
    }
  }, [session, isRecoveryMode]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      /**
       * 🚀 ENVIRONMENT-AWARE RESET INITIATION
       * Web: Uses VITE_APP_URL from appEnv (Single Source of Truth).
       * Native: Uses custom scheme for Deep Link interception.
       */
      const isNative = Capacitor.getPlatform() !== 'web';
      const resetUrl = isNative 
        ? 'bachatkaro://reset-password' 
        : `${appEnv.appUrl}/auth/callback`;
        
      console.log("🚀 [AUTH_RESET_INIT] Requesting reset link for platform:", Capacitor.getPlatform(), "Redirect:", resetUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetUrl,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: 'Reset Link Dispatched',
        description: 'Check your inbox for the secure identity verification link.',
      });
    } catch (err: any) {
      console.error("[AUTH_RESET_ERROR]", err);
      toast({
        title: 'Request Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Security Warning', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      /**
       * 🔒 SECURE CREDENTIAL COMMIT
       * This API only succeeds if the user has a valid 'recovery' session.
       */
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      toast({
        title: 'Identity Secured',
        description: 'Your new password has been established. Redirecting to login...',
      });
      
      // Clear hash to prevent accidental re-entry
      window.location.hash = '';
      
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      console.error("[AUTH_UPDATE_ERROR]", err);
      toast({
        title: 'Commit Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * VIEW 1: REQUEST SENT SUCCESS
   */
  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 antialiased">
        <Card className="w-full max-w-md bg-surface border border-border/40 rounded-modal p-12 text-center space-y-10 shadow-institutional animate-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <div className="w-24 h-24 flex items-center justify-center rounded-premium bg-background border border-border/40 shadow-inner">
              <MailCheck className="h-10 w-10 text-institutional-blue animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Check Your Inbox</h2>
            <p className="text-text-secondary font-medium text-[12px] uppercase tracking-wider leading-relaxed opacity-80">
              We have dispatched a secure reset link to <span className="text-foreground font-black">{email}</span>. 
              Click the link to verify your identity.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            variant="outline" 
            className="w-full h-16 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] border-border/60 hover:bg-background transition-all active:scale-[0.97]"
          >
            Return to Terminal
          </Button>
        </Card>
      </div>
    );
  }

  /**
   * VIEW 2: PASSWORD UPDATE (RECOVERY MODE)
   */
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 antialiased selection:bg-institutional-blue/10">
        <Card className="w-full max-w-md bg-surface border border-border/40 rounded-modal p-10 shadow-institutional relative z-10 animate-in fade-in duration-500">
          <CardHeader className="text-center space-y-6 pt-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 flex items-center justify-center rounded-premium bg-background border border-border/40 shadow-inner group transition-transform duration-700 hover:scale-105">
                <ShieldCheck className="h-8 w-8 text-institutional-blue" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-black tracking-tighter text-foreground uppercase">Establish New Credentials</CardTitle>
              <CardDescription className="text-text-muted font-black uppercase tracking-[0.2em] text-[10px]">Identity verified. Secure your access now.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <form onSubmit={handleUpdatePassword} className="space-y-8">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-text-muted ml-1 uppercase tracking-[0.2em] opacity-60">New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 bg-background border-border/40 rounded-xl text-foreground font-bold focus:border-institutional-blue/60 transition-all px-5 shadow-inner"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-text-muted ml-1 uppercase tracking-[0.2em] opacity-60">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 bg-background border-border/40 rounded-xl text-foreground font-bold focus:border-institutional-blue/60 transition-all px-5 shadow-inner"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-institutional-blue text-surface rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-institutional hover:bg-institutional-blue/90 active:scale-[0.97] transition-all duration-500"
              >
                {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Commit Security Protocol"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * VIEW 3: REQUEST RESET LINK (INITIAL STATE)
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 antialiased selection:bg-institutional-blue/10">
      <Card className="w-full max-w-md bg-surface border border-border/40 rounded-modal p-10 shadow-institutional relative z-10 animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-6 pt-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-premium bg-background border border-border/40 shadow-inner group transition-transform duration-700 hover:scale-105">
              <KeyRound className="h-8 w-8 text-institutional-blue" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black tracking-tighter text-foreground uppercase">Identity Recovery</CardTitle>
            <CardDescription className="text-text-muted font-black uppercase tracking-[0.2em] text-[10px]">Secure credential recovery protocol.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10">
          <form onSubmit={handleRequestReset} className="space-y-8">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black text-text-muted ml-1 uppercase tracking-[0.2em] opacity-60">Registered Email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-background border-border/40 rounded-xl text-foreground font-bold focus:border-institutional-blue/60 transition-all px-5 shadow-inner"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-institutional-blue text-surface rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-institutional hover:bg-institutional-blue/90 active:scale-[0.97] transition-all duration-500"
            >
              {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Dispatch Recovery Link"}
            </Button>
            <div className="text-center pt-8 border-t border-border/40">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Abort & Return
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
