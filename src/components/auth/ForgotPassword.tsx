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
    <div className="min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br from-purple-50 via-white to-pink-50">

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/40 p-8 transition-all duration-300">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg ring-4 ring-white/40">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Enter your email and new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-4 py-3
                  focus:ring-2 focus:ring-purple-400
                  focus:border-purple-500
                  transition-all duration-200"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="border border-gray-300 rounded-lg px-4 py-3
                  focus:ring-2 focus:ring-purple-400
                  focus:border-purple-500
                  transition-all duration-200"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="border border-gray-300 rounded-lg px-4 py-3
                  focus:ring-2 focus:ring-purple-400
                  focus:border-purple-500
                  transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 shadow-lg hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;