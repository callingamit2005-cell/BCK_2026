import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
        />
      </div>

      {/* Error Box */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Sign In Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 shadow-lg hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>

      {/* Forgot Password */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate('/forgot-password')} // ← yahan change kiya
          className="text-sm text-purple-600 hover:underline transition-colors"
        >
          Forgot Password?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;