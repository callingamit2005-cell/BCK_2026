import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Parse URL hash immediately
    const hash = window.location.hash;
    const search = window.location.search;
    
    const searchParams = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace('#', '?'));
    
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code') || searchParams.get('error');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

    // 2. Error handling
    if (errorCode) {
      console.error(`🛡️ [AUTH_CALLBACK_ERROR] Error detected (${errorCode}):`, errorDescription);
      navigate('/forgot-password?error=expired', { replace: true });
      return;
    }

    let isNavigated = false;

    // 3. Listen for specific auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (isNavigated) return;

      if (event === 'PASSWORD_RECOVERY') {
        console.log("🛡️ [AUTH_CALLBACK_PASSWORD_RECOVERY] Recovery session established.");
        isNavigated = true;
        navigate('/forgot-password', { replace: true });
      } else if (event === 'SIGNED_IN') {
        console.log("🛡️ [AUTH_CALLBACK_SIGNED_IN] Valid session established.");
        isNavigated = true;
        navigate('/dashboard', { replace: true });
      }
    });

    // 4. Fail-safe timeout
    const fallbackTimer = setTimeout(() => {
      if (!isNavigated) {
        console.warn("🛡️ [AUTH_CALLBACK_TIMEOUT] No auth event received within 1500ms.");
        isNavigated = true;
        navigate('/auth', { replace: true });
      }
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return <FullScreenLoader />;
};

export default AuthCallback;

