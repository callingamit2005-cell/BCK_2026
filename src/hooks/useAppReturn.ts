import { lifecycleService } from '@/services/lifecycleService';
import { useEffect, useRef } from 'react';

export const useAppReturn = (onReturn: () => void) => {
  const onReturnRef = useRef(onReturn);
  onReturnRef.current = onReturn;

  useEffect(() => {
    // 🛡️ [RUNTIME_STABILIZATION] Use centralized lifecycle service
    const unsubscribe = lifecycleService.onResume(() => {
      console.log("🚀 USER RETURNED FROM UPI (Centralized)");
      onReturnRef.current();
    });

    return () => {
      unsubscribe();
    };
  }, []);
};
