import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import SmsBridge from '../integrations/smsBridge';
import { convertToPaisa } from '../utils/currencyFormatter';

class SyncService {
    constructor() {
        this.isSyncing = false;
        console.log('🛡️ [SyncService] Legacy engine disabled in favor of sqliteSyncEngine.');
    }

    async startSync() {
        return;
    }

    async syncPendingRecords() {
        return;
    }

    triggerSync() {
        return;
    }
}

export const syncService = new SyncService();

