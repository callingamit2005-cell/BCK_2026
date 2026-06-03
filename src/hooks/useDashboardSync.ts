import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { startOfMonth, subMonths } from 'date-fns';
import { purgeExpiredCloudLedgerData, type LedgerWindow } from '@/features/transactions/ledger';
import { addSmsListener, checkSmsPermission, getNativeTransactions, purgeExpiredNativeTransactions, scanHistoricalSms } from '@/integrations/smsBridge';
import { useToast } from '@/hooks/use-toast';
import { initSQLite, saveLocalTransaction } from '@/integrations/sqlite';
import { syncEngine } from '@/services/sqliteSyncEngine';

export const useDashboardSync = (
  user: any,
  canReadSms: boolean,
  ledgerWindow: LedgerWindow,
  isReady: boolean,
  loadNativeTransactions: () => Promise<void>,
  onSQLiteReady?: () => void
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- INITIALIZE SQLITE & SYNC ENGINE ---
  useEffect(() => {
    let isMounted = true;
    
    const setupSQLite = async () => {
      try {
        const db = await initSQLite();
        if (db && isMounted) {
          syncEngine.start();
          // 🛡️ [SYNC_SIGNAL_LOCK] 
          // Callback MUST only fire after initSQLite (including ALTER TABLE migrations) completes.
          if (onSQLiteReady) onSQLiteReady();
        }
      } catch (err) {
        console.error("Critical SQLite Init Failure:", err);
      }
    };
    
    setupSQLite();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // --- SMS PERMISSIONS & LISTENERS ---
  useEffect(() => {
    let isMounted = true;

    const initListener = async () => {
      if (!user?.id || !canReadSms || Capacitor.getPlatform() !== 'android') {
        return;
      }

      try {
        const permission = await checkSmsPermission();
        if (!isMounted) return;
        
        if (permission?.status === 'granted') {
          // Initial hydration on boot/permission grant
          await loadNativeTransactions();
        }
      } catch (err) {
        console.error("SMS Initialization failed", err);
      }
    };

    initListener();

    return () => {
      isMounted = false;
    };
  }, [user?.id, canReadSms, loadNativeTransactions]);

  // --- FIRST LOAD SYNC & BOOTSTRAP ---
  const hasRunBootstrapRef = useRef(false);
  useEffect(() => {
    if (!isReady || !user?.id || hasRunBootstrapRef.current) return;
    
    hasRunBootstrapRef.current = true;
    let active = true;

    const runFirstLoadSync = async () => {
      let backgroundTimerId: NodeJS.Timeout | null = null;
      
      try {
        if (Capacitor.getPlatform() === 'android') {
          if (active) void syncEngine.processQueue();
        }

        // 🛡️ [HYDRATION_WINDOW_STRATEGY]
        const bootstrapStart = startOfMonth(subMonths(new Date(), 1)).toISOString();

        const [localData, { data: cloudData }] = await Promise.all([
          canReadSms ? getNativeTransactions(user.id, user.created_at) : Promise.resolve({ transactions: [] }),
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .gte('date', bootstrapStart)
            .order('date', { ascending: false })
            .limit(500) 
        ]);

        if (!active) return;

        const localCount = localData?.transactions?.length ?? 0;
        const cloudCount = cloudData?.length ?? 0;
        const bootstrapKey = `bstrap_v2_${user.id}`;
        const isBootstrapDone = localStorage.getItem(bootstrapKey) === 'true';

        // SEED SQLITE FROM CLOUD IF ON ANDROID
        if (Capacitor.getPlatform() === 'android' && cloudData && cloudData.length > 0) {
          console.log(`🚀 [SQLite] Seeding ${cloudData.length} bootstrap records to local storage SILENTLY`);
          let seeded = 0;
          for (const row of cloudData) {
            await saveLocalTransaction(row, true, 'completed').catch(() => undefined);
            seeded++;
            
            if (seeded % 50 === 0) {
               await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          // 🚀 [DETERMINISTIC_SINGLE_SIGNAL] One event after batch is complete
          window.dispatchEvent(new Event('sync_queue_updated'));
          window.dispatchEvent(new Event('newLocalTransaction')); 
        }

        if (cloudCount === 0 && localCount === 0 && canReadSms && !isBootstrapDone) {
          try {
            // 🚀 [PHASE_P1E] Enable silent batch mode for historical hydration
            (window as any).BK_IS_SCANNING = true;
            await scanHistoricalSms(62);
            (window as any).BK_IS_SCANNING = false;
            
            if (!active) return;
            
            localStorage.setItem(bootstrapKey, 'true');
            // Feeder also emits internal events, so we use it as a settled trigger
            await loadNativeTransactions();

            // 🚀 [PHASE_6C_BACKGROUND_HYDRATION]
            // After fast bootstrap is visible, trigger a deeper 180-day scan in the background.
            // Using a 5s delay to ensure the UI has finished its first render cycle.
            backgroundTimerId = setTimeout(async () => {
              if (active) {
                console.log("🚀 [Background] Starting full history hydration (180 days)...");
                // 🚀 [PHASE_P1E] Enable silent batch mode for historical hydration
                (window as any).BK_IS_SCANNING = true;
                await scanHistoricalSms(180);
                (window as any).BK_IS_SCANNING = false;
                
                await loadNativeTransactions();
                // 🚀 [STORM_FIX] Final 'settled' signal after background hydration
                window.dispatchEvent(new Event('newLocalTransaction'));
                console.log("🚀 [Background] History hydration complete.");
              }
            }, 5000);

            if (Capacitor.getPlatform() === 'android') {
              if (active) void syncEngine.processQueue();
            }

            // Final settling invalidation
            await queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] });
          } catch (err) {
            console.error("❌ [Bootstrap] Migration failed:", err);
          }
        }
        else if (cloudCount === 0 && localCount > 0) {
          if (Capacitor.getPlatform() === 'android') {
            if (active) void syncEngine.processQueue();
          }
        }
      } catch (err) {
        console.error("First Load Sync Error:", err);
      }

      return () => {
        if (backgroundTimerId) clearTimeout(backgroundTimerId);
      };
    };

    const cleanupSync = runFirstLoadSync();

    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (today.getDate() > lastDayOfMonth - 5) {
      toast({
        title: "End of Month Reminder ⚠️",
        description: "This month's data will be hidden soon. Please take a backup if needed.",
        className: "bg-indigo-900/80 text-white border-indigo-500/50 backdrop-blur-md",
        duration: 10000,
      });
    }

    return () => { 
      active = false; 
      cleanupSync.then(cleanup => cleanup?.());
    };
  }, [isReady, user?.id, user?.created_at, toast, queryClient, canReadSms, loadNativeTransactions]);

  // --- RETENTION CLEANUP ---
  useEffect(() => {
    if (!user?.id) return;

    const runRetentionCleanup = async () => {
      try {
        await purgeExpiredCloudLedgerData(user.id, ledgerWindow);
        if (canReadSms) {
          await purgeExpiredNativeTransactions(user.id, ledgerWindow.start.getTime());
        }
        await queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] });
      } catch (err) {
        console.error("Retention cleanup failed:", err);
      }
    };

    void runRetentionCleanup();
  }, [user?.id, queryClient, ledgerWindow, canReadSms]);
};

