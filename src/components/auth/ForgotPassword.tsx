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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 antialiased">

      <Card className="w-full max-w-md bg-surface border border-white/5 rounded-[24px] p-8 shadow-sm transition-all duration-300">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 shadow-inner">
              <KeyRound className="h-6 w-6 text-white/40" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter text-white uppercase">
            Reset Identity
          </CardTitle>
          <CardDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
            Enter your email and new credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-[10px] font-bold text-white/20 ml-1 uppercase tracking-widest">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="amit@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/5 rounded-xl text-white font-bold focus:border-white/20 transition-all"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[10px] font-bold text-white/20 ml-1 uppercase tracking-widest">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white/5 border-white/5 rounded-xl text-white font-bold focus:border-white/20 transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[10px] font-bold text-white/20 ml-1 uppercase tracking-widest">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white/5 border-white/5 rounded-xl text-white font-bold focus:border-white/20 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-background rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Commit Reset
            </Button>

            <div className="text-center pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Authorization
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;