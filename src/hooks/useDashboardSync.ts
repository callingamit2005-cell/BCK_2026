import { useEffect } from 'react';
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
    let listener: any = null;
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
        } else {
          console.warn("SMS permission not granted");
        }
      } catch (err) {
        console.error("SMS Initialization failed", err);
      }
    };

    initListener();

    return () => {
      isMounted = false;
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [user?.id, canReadSms, loadNativeTransactions]);

  // --- FIRST LOAD SYNC & BOOTSTRAP ---
  useEffect(() => {
    if (!isReady || !user?.id) return;

    let active = true;

    const runFirstLoadSync = async () => {
      try {
        if (Capacitor.getPlatform() === 'android') {
          const { syncService } = await import('@/services/syncService');
          if (active) void syncService.startSync();
        }

        // 🛡️ [HYDRATION_WINDOW_STRATEGY]
        // Fetch Current + Previous month for initial bootstrap (2-month window)
        // This ensures the dashboard cards and recent lists are populated correctly 
        // without loading all 36 months of history synchronously.
        const bootstrapStart = startOfMonth(subMonths(new Date(), 1)).toISOString();

        console.log(`[HYDRATION_TRACE] Starting bootstrap fetch from ${bootstrapStart}`);

        const [localData, { data: cloudData, error }] = await Promise.all([
          canReadSms ? getNativeTransactions(user.id, user.created_at) : Promise.resolve({ transactions: [] }),
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .gte('date', bootstrapStart)
            .order('date', { ascending: false })
            .limit(500) // Sufficient for 2 months of high-velocity users
        ]);

        if (!active) return;

        const localCount = localData?.transactions?.length ?? 0;
        const cloudCount = cloudData?.length ?? 0;
        const bootstrapKey = `bstrap_v2_${user.id}`;
        const isBootstrapDone = localStorage.getItem(bootstrapKey) === 'true';

        console.log(`[HYDRATION_TRACE] Bootstrap Results - Cloud: ${cloudCount}, Local: ${localCount}`);

        // SEED SQLITE FROM CLOUD IF ON ANDROID
        if (Capacitor.getPlatform() === 'android' && cloudData && cloudData.length > 0) {
          console.log(`🚀 [SQLite] Seeding ${cloudData.length} bootstrap records to local storage SILENTLY`);
          for (const row of cloudData) {
            // 🛡️ [SILENT_HYDRATION] Use silent: true during batch seeding
            await saveLocalTransaction(row, true).catch(() => undefined);
          }
          // 🚀 [DETERMINISTIC_SINGLE_SIGNAL] One event after batch is complete
          window.dispatchEvent(new Event('sync_queue_updated'));
        }

        // ... rest of error check ...

        if (cloudCount === 0 && localCount === 0 && canReadSms && !isBootstrapDone) {
          console.log("🚀 [Bootstrap] Starting emergency scan (2 months)...");
          try {
            const scanRes = await scanHistoricalSms(62);
            if (!active) return;
            console.log(`🚀 [Bootstrap] Scan complete: ${scanRes.scanned} messages processed`);
            
            localStorage.setItem(bootstrapKey, 'true');
            // Feeder also emits internal events, so we use it as a settled trigger
            await loadNativeTransactions();

            if (Capacitor.getPlatform() === 'android') {
              const { syncService } = await import('@/services/syncService');
              if (active) void syncService.startSync();
            }

            // Final settling invalidation
            await queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] });
          } catch (err) {
            console.error("❌ [Bootstrap] Migration failed:", err);
          }
        }
        else if (cloudCount === 0 && localCount > 0) {
          console.log("🚀 [Sync] Found local data but no cloud, starting sync engine...");
          if (Capacitor.getPlatform() === 'android') {
            const { syncService } = await import('@/services/syncService');
            if (active) void syncService.startSync();
          }
        }
      } catch (err) {
        console.error("First Load Sync Error:", err);
      }
    };

    void runFirstLoadSync();

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

    return () => { active = false; };
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
