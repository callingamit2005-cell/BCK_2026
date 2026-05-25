import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Email and password are required',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast({
        title: 'Error',
        description: 'Enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setLoading(false);
      if (
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('too many')
      ) {
        toast({
          title: 'Too many attempts',
          description: 'Please wait a few minutes and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    // ✅ Sign out the user to prevent auto-login
    await supabase.auth.signOut();
    setLoading(false);

    toast({
      title: 'Account Created!',
      description: 'Registration successful. Please log in with your credentials.',
    });

    // Redirect to login page
    navigate('/auth');
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
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

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border border-gray-300 rounded-lg px-4 py-3
          focus:ring-2 focus:ring-purple-400
          focus:border-purple-500
          transition-all duration-200"
        />
      </div>

      {/* CTA Button */}
      <Button
        type="submit"
        disabled={loading}
        className="
          w-full
          bg-gradient-to-r from-purple-600 to-pink-600
          text-white
          rounded-xl
          py-3
          shadow-lg
          hover:brightness-110
          hover:scale-[1.02]
          transition-all duration-200
        "
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;