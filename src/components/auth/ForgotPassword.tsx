import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validations
    if (!email.trim() || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 🔁 Replace with your actual Edge Function URL
      const functionUrl = 'https://cbagjjhzsaxrzmulacxf.supabase.co/functions/v1/direct-reset-password';
      // 🔁 Replace with your actual secret token (same as set in supabase secrets)
      const secretToken = 'my-super-secret-key-12345';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretToken}`,
        },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'Success',
        description: 'Password updated successfully. You can now log in with your new password.',
      });
      navigate('/auth');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 antialiased selection:bg-foreground/10">
      
      {/* Subtle Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <Card className="w-full max-w-md bg-surface border border-border rounded-[40px] p-8 md:p-10 shadow-2xl transition-all duration-300 relative z-10">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-[28px] bg-background border border-border shadow-inner">
              <KeyRound className="h-8 w-8 text-text-secondary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground uppercase">
              Reset Identity
            </CardTitle>
            <CardDescription className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">
              Secure credential recovery protocol.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div className="space-y-2.5">
              <Label htmlFor="reset-email" className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-border rounded-xl text-foreground font-bold focus:border-foreground transition-all"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2.5">
              <Label htmlFor="new-password" className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest">New Credentials</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-background border-border rounded-xl text-foreground font-bold focus:border-foreground transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2.5">
              <Label htmlFor="confirm-password" className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest">Confirm credentials</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-background border-border rounded-xl text-foreground font-bold focus:border-foreground transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-foreground text-surface rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-2xl hover:bg-foreground/90 active:scale-[0.98] transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Commit Identity Reset
            </Button>

            <div className="text-center pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Return to Authorization
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;