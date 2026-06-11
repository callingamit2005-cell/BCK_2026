import { supabase } from '@/integrations/supabase/client';
import { getDB, ensureDbReady } from '@/integrations/sqlite';
import { 
  seedLocalCacheRow, 
  getConflictTarget, 
  translateToRemote, 
  DETERMINISTIC_OVERWRITE_TABLES 
} from '@/integrations/sqliteService';
import { safeJsonParse } from '@/utils/jsonUtils';

let isSyncing = false;
let isCleaning = false;
let isStarted = false;

/**
 * 🚀 High-Level Sync States for UI
 */
const emitSyncStatus = (status: 'idle' | 'syncing' | 'completed' | 'failed') => {
  window.dispatchEvent(new CustomEvent('global_sync_status', { detail: status }));
};

const emitSyncQueueUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sync_queue_updated'));
  }
};

const readJsonString = (value: unknown, key: string) => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return typeof record[key] === 'string' ? record[key] : null;
};

const seedSyncedGroup = async (groupId: string, fallback: Record<string, any>) => {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
  if (error) throw error;
  await seedLocalCacheRow('groups', {
    ...fallback,
    ...(data || {}),
    id: groupId,
    sync_status: 'completed',
    is_deleted: 0,
  });
};

const seedSyncedMember = async (memberId: string, fallback: Record<string, any>) => {
  const { data, error } = await supabase.from('group_members').select('*').eq('id', memberId).maybeSingle();
  if (error) throw error;
  await seedLocalCacheRow('group_members', {
    ...fallback,
    ...(data || {}),
    id: memberId,
    sync_status: 'completed',
    is_deleted: 0,
  });
};

export const syncEngine = {
  start: () => {
    if (isStarted) return;
    isStarted = true;
    console.log("🚀 [SyncEngine] Starting centralized sync engine...");

    // 1. Sync Loop: Every 15s when online
    setInterval(async () => {
      if (isSyncing || isCleaning || !navigator.onLine) return;
      await syncEngine.processQueue();
    }, 15000); 
    
    // 2. Cleanup Loop: Every 6 hours
    setInterval(async () => {
      if (isSyncing || isCleaning) return;
      await syncEngine.performCleanup();
    }, 6 * 60 * 60 * 1000);

    // 3. 🛡️ [RACE_CONDITION_FIX] Single authoritative 'online' listener.
    // syncService.js previously had its own 'online' listener with a separate
    // isSyncing flag — both engines fired simultaneously on network restore.
    // Now sqliteSyncEngine is the sole owner of network-restore sync triggering.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 [SyncEngine] Network restored — triggering queue processing');
        if (!isSyncing && !isCleaning) {
          syncEngine.processQueue();
        }
      });
    }

    if (navigator.onLine) {
      setTimeout(() => syncEngine.processQueue(), 1000);
    }
  },

  performCleanup: async () => {
    const db = await ensureDbReady();
    if (!db || isSyncing || isCleaning) return;
    
    isCleaning = true;
    console.log("🧹 [SyncEngine] Starting safety-verified UTC cleanup...");
    
    const versionedTables = ['group_expenses', 'savings_goals', 'emis', 'subscriptions', 'salaries', 'budgets'];
    const allTables = ['transactions', ...versionedTables];
    
    try {
      for (const table of allTables) {
        /**
         * 🛡️ STRICT DATA RETENTION RULES:
         * 1. UTC Consistency: Use 'now' which is UTC in SQLite.
         * 2. Persistence Check: sync_status MUST be 'completed'.
         * 3. Soft-Delete Purge: is_deleted = 1 items are removed once synced.
         * 4. Version Purge (Versioned Tables only): non-latest records (is_latest = 0) 
         *    older than 180 days based on updated_at.
         * 5. Ledger Purge (Transactions only): records older than 180 days based on date.
         */
        const isVersioned = versionedTables.includes(table);
        const isLedger = table === 'transactions';
        
        const query = `
          DELETE FROM ${table} 
          WHERE sync_status = 'completed'
          AND (
            is_deleted = 1
            ${isVersioned ? "OR (is_latest = 0 AND datetime(COALESCE(updated_at, created_at)) < datetime('now', '-1080 days'))" : ""}
            ${isLedger ? "OR datetime(date) < datetime('now', '-1080 days')" : ""}
          )
        `;
        
        await db.run(query);
      }

      // Cleanup Sync Queue (Completed tasks > 7 days based on created_at)
      await db.run(`
        DELETE FROM sync_queue 
        WHERE status = 'completed' 
        AND datetime(created_at) < datetime('now', '-7 days')
      `);
      
      console.log("✨ [SyncEngine] Safe cleanup successful.");
    } catch (err) {
      console.error("❌ [SyncEngine] Safe cleanup failed:", err);
    } finally {
      isCleaning = false;
    }
  },

  processQueue: async () => {
    const db = await ensureDbReady();
    if (!db) return;
    if (isSyncing || isCleaning) return;

    isSyncing = true;
    emitSyncStatus('syncing');

    try {
      await db.run(`
        UPDATE sync_queue
        SET status = 'failed',
            next_retry_at = CURRENT_TIMESTAMP
        WHERE status = 'syncing'
      `);

      // 1. FETCH BATCH (Max 50 records, Exponential Backoff Check)
      // 🛡️ [PRIORITY_QUEUE] Prioritize DELETE operations to harden tombstones first.
      const query = `
        SELECT * FROM sync_queue 
        WHERE status IN ('pending', 'failed') 
        AND retry_count < 5 
        AND datetime(next_retry_at) <= datetime('now')
        ORDER BY CASE WHEN operation = 'DELETE' THEN 0 ELSE 1 END ASC, created_at ASC LIMIT 50
      `;
      const result = await db.query(query);
      const rows = result.values || [];

      if (rows.length === 0) {
        isSyncing = false;
        emitSyncStatus('idle');
        return;
      }

      // 2. LOCK STATE
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      await db.run(`UPDATE sync_queue SET status = 'syncing' WHERE id IN (${placeholders})`, ids);

      // 3. PARALLEL SAFE EXECUTION
      const promises = rows.map(async (row) => {
        try {
          const payload = safeJsonParse(row.payload, null);
          if (!payload) throw new Error("Invalid sync payload");

          if (row.table_name === 'add_group_member_ghost' && payload.p_group_id) {
            const groupState = await db.query(`SELECT sync_status FROM groups WHERE id = ?`, [payload.p_group_id]);
            if (groupState.values?.[0]?.sync_status === 'pending') {
              throw new Error("Group sync pending");
            }
          }
          
          let success = false;
          let serverData: any = null;

          if (row.operation === 'INSERT' || row.operation === 'UPSERT') {
            const conflictTarget = getConflictTarget(row.table_name);
            const remotePayload = translateToRemote(row.table_name, payload);

            console.log(`🧪 [SYNC_ENGINE_TRACE] Attempting UPSERT: ${row.table_name} conflictTarget=${conflictTarget} ID=${remotePayload.id}`);
            const { data, error } = await supabase
              .from(row.table_name)
              .upsert(remotePayload, { onConflict: conflictTarget })
              .select()
              .single();
            
            if (!error && data) {
              success = true;
              serverData = data;
              console.log(`🧪 [SYNC_ENGINE_TRACE] UPSERT Success: [${row.id}]`);
            } else if (error) {
              console.error(`❌ [SYNC_ENGINE_TRACE] UPSERT Fail: [${row.id}]`, {
                code: error.code,
                message: error.message,
                details: error.details,
                payload: JSON.stringify(remotePayload)
              });
            }
          } else if (row.operation === 'UPDATE') {
            // 🛡️ [REPLAY_UPDATE_PATH]
            // Use .update() for explicit edits. This ensures that metadata changes
            // don't trigger secondary insert attempts that fail on PKey constraints.
            const remotePayload = translateToRemote(row.table_name, payload);
            console.log(`🧪 [SYNC_ENGINE_TRACE] Attempting UPDATE: ${row.table_name} ID=${payload.id}`);
            const { data, error } = await supabase
              .from(row.table_name)
              .update(remotePayload)
              .eq('id', payload.id)
              .select()
              .single();
            
            if (!error && data) {
              success = true;
              serverData = data;
              console.log(`🧪 [SYNC_ENGINE_TRACE] UPDATE Success: [${row.id}]`);
            } else if (error) {
              console.error(`❌ [SYNC_ENGINE_TRACE] UPDATE Fail: [${row.id}]`, {
                code: error.code,
                message: error.message,
                details: error.details,
                payload: JSON.stringify(remotePayload)
              });
            }
          } else if (row.operation === 'RPC') {
            console.log(`[SYNC_RPC_START] [${row.id}] Func: ${row.table_name}`);
            
            // 🛡️ [POSTGREST_RPC_ALIGNMENT]
            // PostgREST 404s if an RPC call includes parameters that don't match the function signature.
            // We strip standard table columns (id, updated_at, etc.) that might have leaked into the payload.
            const cleanPayload = { ...payload };
            const keysToStrip = ['id', 'idempotency_key', 'created_at', 'updated_at', 'sync_status', 'is_deleted'];
            
            keysToStrip.forEach(key => {
              // Only strip if the function doesn't explicitly expect it (checking for p_ prefix)
              if (!Object.keys(cleanPayload).includes(`p_${key}`)) {
                delete cleanPayload[key];
              }
            });

            const { data, error } = await supabase.rpc(row.table_name, cleanPayload);
            if (!error) {
              const rejected = data && typeof data === 'object' && !Array.isArray(data) && (data as any).success === false;
              if (rejected) {
                console.error(`[SYNC_RPC_REJECTED] [${row.id}]`, data);
              } else {
                success = true;
                serverData = data;
                console.log(`[SYNC_RPC_SUCCESS] [${row.id}]`);
              }
            } else {
              console.error(`[SYNC_RPC_FAIL] [${row.id}] Error:`, error);
            }
          } else if (row.operation === 'DELETE') {
            console.log(`[SYNC_DELETE_START] [${row.id}] Table: ${row.table_name}`);
            
            // 🛡️ [TOMBSTONE ARCHITECTURE]
            // Never physically delete 'transactions' from Supabase. Update is_deleted to true.
            if (row.table_name === 'transactions') {
              const { error } = await supabase.from(row.table_name)
                .update({ is_deleted: true, updated_at: new Date().toISOString() })
                .eq('id', payload.id);
              if (!error) {
                success = true;
                console.log(`[SYNC_TOMBSTONE_SUCCESS] [${row.id}]`);
              } else {
                console.error(`[SYNC_TOMBSTONE_FAIL] [${row.id}] Error:`, error);
              }
            } else {
              const { error } = await supabase.from(row.table_name).delete().eq('id', payload.id);
              if (!error) {
                success = true;
                console.log(`[SYNC_DELETE_SUCCESS] [${row.id}]`);
              } else {
                console.error(`[SYNC_DELETE_FAIL] [${row.id}] Error:`, error);
              }
            }
          }

          if (success) {
            // 🛡️ [SYNC_STATUS_LOCK]
            // Only mark as completed if the row is still in 'syncing' status.
            // This prevents a stale sync completion from overwriting a newer 'pending' update
            // from a local edit that occurred while this sync was in-flight.
            await db.run(`UPDATE sync_queue SET status = 'completed' WHERE id = ? AND status = 'syncing'`, [row.id]);
            
            // 🛡️ SYNC CONSISTENCY: Update local record status to allow eventual cleanup
            try {
              if (row.operation === 'DELETE') {
                await db.run(`UPDATE ${row.table_name} SET sync_status = 'completed' WHERE id = ?`, [payload.id]);
              } else if (row.table_name === 'create_group_with_admin') {
                const groupId = readJsonString(serverData, 'group_id') || payload.p_group_id;
                const memberId = readJsonString(serverData, 'member_id') || payload.p_member_id;
                if (groupId) {
                  await seedSyncedGroup(groupId, {
                    id: groupId,
                    name: payload.p_name,
                    user_id: payload.p_user_id,
                    member_count: 1,
                  });
                }
                if (memberId) {
                  await seedSyncedMember(memberId, {
                    id: memberId,
                    group_id: groupId,
                    user_id: payload.p_user_id,
                    name: payload.p_admin_name || 'You',
                    role: 'admin',
                    upi_id: null,
                  });
                }
              } else if (row.table_name === 'add_group_member_ghost') {
                const memberId = readJsonString(serverData, 'member_id') || payload.p_member_id;
                if (payload.p_member_id && memberId && payload.p_member_id !== memberId) {
                  await db.run(`UPDATE group_members SET is_deleted = 1, sync_status = 'completed' WHERE id = ?`, [payload.p_member_id]);
                }
                if (memberId) {
                  await seedSyncedMember(memberId, {
                    id: memberId,
                    group_id: payload.p_group_id,
                    user_id: null,
                    name: payload.p_name,
                    role: 'member',
                    upi_id: null,
                  });
                }
              } else if (row.table_name === 'delete_group_expense_atomic') {
                // 🛡️ [POST_SYNC_CLEANUP]
                // Immediately hard-delete the local record after successful cloud deletion
                // to eliminate the resurrection window during background sync.
                await db.run(`DELETE FROM group_expenses WHERE id = ?`, [payload.p_expense_id]);
                await db.run(`DELETE FROM expense_splits WHERE expense_id = ?`, [payload.p_expense_id]);
              } else if (row.table_name === 'clear_group_ledger_atomic') {
                // 🛡️ [POST_SYNC_CLEANUP]
                // Immediately hard-delete all local records for the group after successful cloud clear.
                await db.run(`DELETE FROM group_expenses WHERE group_id = ?`, [payload.p_group_id]);
                await db.run(`DELETE FROM expense_splits WHERE group_id = ?`, [payload.p_group_id]);
              } else if (serverData && serverData.updated_at) {
                const targetTable = row.table_name === 'insert_group_expense_with_split' ? 'group_expenses' : row.table_name;
                const isOverwrite = DETERMINISTIC_OVERWRITE_TABLES.includes(targetTable);
                
                if (isOverwrite) {
                  await db.run(
                    `UPDATE ${targetTable} SET updated_at = ?, sync_status = 'completed' WHERE user_id = ? AND month_year = ?`,
                    [serverData.updated_at, payload.user_id, payload.month_year]
                  );
                } else {
                  await db.run(
                    `UPDATE ${targetTable} SET updated_at = ?, sync_status = 'completed' WHERE idempotency_key = ?`,
                    [serverData.updated_at, row.idempotency_key]
                  );
                }
              }
            } catch (updateErr) {
              // Ignore if table doesn't have these columns or record not found
            }
          } else {
            throw new Error("Supabase rejected payload");
          }
        } catch (err) {
          const backoffSeconds = Math.pow(2, row.retry_count) * 10;
          await db.run(`
            UPDATE sync_queue 
            SET status = 'failed', 
                retry_count = retry_count + 1,
                next_retry_at = datetime('now', '+${backoffSeconds} seconds')
            WHERE id = ?
          `, [row.id]);
        }
      });

      await Promise.allSettled(promises);
      emitSyncQueueUpdated();
      emitSyncStatus('completed');

    } catch (error) {
      console.error('Sync Engine Error:', error);
      emitSyncStatus('failed');
    } finally {
      isSyncing = false;
      setTimeout(() => emitSyncStatus('idle'), 3000);
    }
  }
};

