import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import SmsBridge from '../integrations/smsBridge';
import { convertToPaisa } from '../utils/currencyFormatter';

class SyncService {
    constructor() {
        this.isSyncing = false;
        this.syncInterval = null;

        // Listen for new transactions from native engine
        if (SmsBridge && typeof SmsBridge.addListener === 'function') {
            SmsBridge.addListener('newTransaction', () => {
                console.log('SyncService: New transaction detected from native engine');
                this.triggerSync();
            });
        }

        if (typeof window !== 'undefined') {
            window.triggerImmediateSync = () => this.triggerSync();
        }
    }

    /**
     * 🛡️ PHASE 1: SYNC OWNERSHIP REMOVAL
     * The JS sync engine is now DEPRECATED for cloud uploads.
     * The Native WorkManager (TransactionSyncWorker.kt) is the SOLE owner of the sync queue.
     * This function now only acts as a UI trigger signal for React Query invalidation.
     */
    async startSync() {
        if (this.isSyncing) return;
        console.log('SyncService: Frontend sync loop deprecated. Delegating to Native WorkManager.');
        
        // We no longer call syncPendingRecords() to prevent duplicate uploads.
        // The native background worker handles it.
    }

    /**
     * DEPRECATED: Retained for backward compatibility with imports, but does nothing.
     */
    async syncPendingRecords(retryCount = 0) {
        console.warn('SyncService.syncPendingRecords() is deprecated. Native engine handles sync.');
        return;
    }

    /**
     * Call this when a new transaction is inserted locally.
     */
    triggerSync() {
        this.startSync().catch(console.error);
    }
}

export const syncService = new SyncService();

