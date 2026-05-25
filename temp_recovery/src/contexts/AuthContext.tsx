import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  preferences: { language: string; country: string | null } | null;
  preferencesLoading: boolean;
  signOut: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<{ language: string; country: string | null } | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPreferences = async (userId: string) => {
    setPreferencesLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_user_preferences', { p_user_id: userId });

      // Enhanced logging
      console.group('🔍 Auth Preferences Debug');
      console.log('User ID:', userId);
      console.log('RPC Error:', error);
      console.log('RPC Data:', data);
      
      if (error) {
        console.error('❌ RPC Error:', error);
        console.groupEnd();
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No preferences data returned');
        console.groupEnd();
        return;
      }

      const pref = data[0];
      console.log('✅ Preference Record:', pref);
      console.log('is_new_user:', pref.is_new_user);
      console.log('country:', pref.country);
      console.log('language:', pref.language);
      console.groupEnd();

      setPreferences({
        language: pref.language,
        country: pref.country,
      });

      // Redirect conditions:
      // 1. If RPC says this is a new user
      // 2. If country is null (meaning preferences were just created with defaults)
      if (pref.is_new_user || !pref.country) {
        console.log('🔄 Redirecting to /setup (new user or missing country)');
        navigate('/setup', { replace: true });
      } else {
        console.log('🏠 Staying on dashboard (existing user)');
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const refreshPreferences = async () => {
    if (user) {
      await fetchPreferences(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchPreferences(session.user.id);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchPreferences(session.user.id);
          } else {
            setPreferences(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      preferences,
      preferencesLoading,
      signOut,
      refreshPreferences,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};