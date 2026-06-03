import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { upsertNativeTransactions } from '../integrations/smsBridge';

class RestoreService {
    constructor() {
        this.isRestoring = false;
        this.onProgress = null; // Callback for UI: (isRestoring: boolean) => void
    }

    /**
     * Restore data from Supabase to SQLite.
     * Should be called on app start or after login.
     */
    async restoreFromCloud() {
        if (Capacitor.getPlatform() !== 'android') return;
        if (this.isRestoring) return;
        
        console.log('RESTORE_START: Starting restoration from cloud...');
        this.isRestoring = true;
        if (this.onProgress) this.onProgress(true);
        
        try {
            // Get current user session
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            if (authError || !session) {
                console.warn('RESTORE_START: No active session, skipping restore');
                return;
            }

            const userId = session.user.id;
            let from = 0;
            const PAGE_SIZE = 500;
            let hasMore = true;

            // HIGHLIGHT: FALLBACK SAFETY - Securely reading from localStorage
            const LAST_SYNC_KEY = `last_synced_at_${userId}`;
            let lastSyncedAt;
            try {
                lastSyncedAt = localStorage.getItem(LAST_SYNC_KEY);
            } catch (e) {
                console.warn('RESTORE_START: localStorage unavailable', e);
                lastSyncedAt = null;
            }

            // 🔥 CRITICAL FIX 7 — APP REINSTALL RECOVERY GUARANTEE
            if (!lastSyncedAt) {
                lastSyncedAt = '1970-01-01T00:00:00.000Z';
            }
            
            console.log(`RESTORE_START: Fetching records updated after ${lastSyncedAt}`);

            while (hasMore) {
                console.log(`RESTORE_START: Fetching range ${from} to ${from + PAGE_SIZE - 1}...`);
                
                // 1. Fetch page from Supabase where updated_at > lastSyncedAt
                const { data: cloudTransactions, error: fetchError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .gt('updated_at', lastSyncedAt)
                    .order('updated_at', { ascending: true }) // Order by updated_at to safely resume
                    .range(from, from + PAGE_SIZE - 1);

                if (fetchError) {
                    console.error('RESTORE_START: Failed to fetch page from cloud:', fetchError);
                    break;
                }

                if (!cloudTransactions || cloudTransactions.length === 0) {
                    hasMore = false;
                    break;
                }

                // HIGHLIGHT: CLOCK DRIFT FIX - Using server-provided timestamps instead of device clock
                const lastItem = cloudTransactions[cloudTransactions.length - 1];
                if (lastItem && lastItem.updated_at) {
                    try {
                        localStorage.setItem(LAST_SYNC_KEY, lastItem.updated_at);
                    } catch (e) {
                        console.error('RESTORE_START: Failed to save sync progress', e);
                    }
                }

                console.log(`RESTORE_START: Processing batch of ${cloudTransactions.length} records...`);

                // 2. Map and Save into SQLite directly
                const { saveLocalTransaction } = await import('../integrations/sqlite');
                
                let restoredCount = 0;
                for (const ct of cloudTransactions) {
                    try {
                        const payload = {
                            id: ct.id,
                            user_id: userId,
                            amount: ct.amount,
                            type: ct.type,
                            category: ct.category || 'Others',
                            payment_mode: ct.payment_mode || (ct.type === 'income' ? 'Bank Credit' : 'App'),
                            description: ct.description,
                            date: ct.date,
                            sms_hash: ct.sms_hash,
                            canonical_key: ct.canonical_key,
                            idempotency_key: ct.idempotency_key,
                            entry_source: ct.entry_source || (ct.sms_hash?.startsWith('man:') ? 'manual' : ct.sms_hash?.startsWith('voice:') ? 'voice' : 'sms'),
                            sync_status: 'completed',
                            is_deleted: ct.is_deleted ? 1 : 0
                        };
                        
                        await saveLocalTransaction(payload, true);
                        restoredCount++;
                    } catch (err) {
                        console.error(`RESTORE_START: Failed to restore record ${ct.id}`, err);
                    }
                }

                console.log(`RESTORE_START: Successfully restored ${restoredCount} records to local DB`);

                if (cloudTransactions.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    from += PAGE_SIZE;
                }
            }

            console.log('RESTORE_DONE: Restoration completed.');
        } catch (error) {
            console.error('RESTORE_DONE: Restoration process failed:', error);
        } finally {
            this.isRestoring = false;
            if (this.onProgress) this.onProgress(false);
        }
    }
}

export const restoreService = new RestoreService();
