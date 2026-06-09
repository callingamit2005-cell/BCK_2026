import { useEffect } from 'react';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

const AuthCallback = () => {
  useEffect(() => {
    console.log("🛡️ [AUTH_CALLBACK_MOUNT] Component initialized. Awaiting AuthContext lifecycle.");
    console.log("🛡️ [AUTH_CALLBACK_WAITING] Relying on Supabase to process URL tokens and emit events.");
  }, []);

  return <FullScreenLoader />;
};

export default AuthCallback;
