import { getDB, initSQLite, enqueueSync, generateIdempotencyKey, ensureDbReady } from './sqlite';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

/**
 * 🛡️ UNIVERSAL OFFLINE-FIRST SDK
 * All reads/writes route through here to ensure zero-latency UI and reliable sync.
 */

// ⏱️ Debounce Timer for UI Refresh
let syncEventTimeout: NodeJS.Timeout | null = null;
const SQLITE_TABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const schemaCache: Record<string, string[]> = {};

const getTableColumns = async (db: any, tableName: string) => {
  if (schemaCache[tableName]) return schemaCache[tableName];
  const tableInfo = await db.query(`PRAGMA table_info(${tableName})`);
  const cols = ((tableInfo.values || []) as Array<{ name: string }>).map((v) => v.name);
  if (cols.length > 0) schemaCache[tableName] = cols;
  return cols;
};

/**
 * 🚀 High-Performance UI Dispatcher
 * Prevents UI flicker and re-render loops by debouncing the sync_queue_updated event.
 */
export const dispatchSyncUpdate = () => {
  if (syncEventTimeout) clearTimeout(syncEventTimeout);
  syncEventTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('sync_queue_updated'));
  }, 150); // 150ms buffer for batch operations
};

export const seedLocalCacheRow = async (
  tableName: string,
  row: Record<string, any>,
  syncStatus = 'completed',
) => {
  const db = await ensureDbReady();
  if (!db || !row || !SQLITE_TABLE_NAME.test(tableName)) return false;

  try {
    const validCols = await getTableColumns(db, tableName);
    if (validCols.length === 0) return false;

    // 🛡️ [SQLITE_SEED_SERIALIZATION]
    // Ensure nested objects (like loan_details) are stringified before local insertion.
    // Ensure booleans are converted to 0/1 for SQLite compatibility.
    // This prevents Android SQLite parameter errors and boolean-to-falsey bugs.
    const seedRow = { ...row };
    Object.keys(seedRow).forEach(key => {
      if (seedRow[key] !== null && typeof seedRow[key] === 'object' && !Array.isArray(seedRow[key])) {
        seedRow[key] = JSON.stringify(seedRow[key]);
      } else if (typeof seedRow[key] === 'boolean') {
        seedRow[key] = seedRow[key] ? 1 : 0;
      }
    });

    if (validCols.includes('sync_status') && seedRow.sync_status === undefined) {
      seedRow.sync_status = syncStatus;
    }
    if (validCols.includes('is_deleted') && seedRow.is_deleted === undefined) {
      seedRow.is_deleted = 0;
    }

    const rowCols = Object.keys(seedRow).filter((col) => validCols.includes(col) && seedRow[col] !== undefined);
    if (rowCols.length === 0) return false;

    const colsString = rowCols.join(', ');
    const placeholders = rowCols.map(() => '?').join(', ');
    const values = rowCols.map((col) => seedRow[col]);

    if (rowCols.includes('id')) {
      const updates = rowCols
        .filter((col) => col !== 'id')
        .map((col) => `${col} = excluded.${col}`)
        .join(', ');

      // 🛡️ [TOMBSTONE_PROTECTION]
      // NEVER overwrite a local tombstone (is_deleted = 1) with incoming cloud data.
      // This prevents deleted records from "resurrecting" during background seeding.
      await db.run(
        `INSERT INTO ${tableName} (${colsString}) VALUES (${placeholders})
         ON CONFLICT(id) DO UPDATE SET ${updates || 'id = excluded.id'}
         WHERE ${tableName}.is_deleted = 0`,
        values,
      );
    } else {
      await db.run(`INSERT OR IGNORE INTO ${tableName} (${colsString}) VALUES (${placeholders})`, values);
    }

    return true;
  } catch (err) {
    console.warn(`[LOCAL_CACHE_SEED_FAIL] ${tableName}`, err);
    return false;
  }
};

export const fetchLocalOrCloud = async (tableName: string, filterValue: string | null, extraCondition = '', orderBy = 'created_at DESC', filterColumn: string | null = 'user_id', includeDeleted = false, forceCloud = false) => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  if (isAndroid) {
    const db = await ensureDbReady();
    if (db) {
      console.log(`🔍 [SQLITE_QUERY_START] Table: ${tableName}, Filter: ${filterColumn || 'NONE'}=${filterValue || 'NONE'}, ForceCloud: ${forceCloud}`);
      
      const deletedCondition = includeDeleted ? '' : 'AND is_deleted = 0';
      let query = `SELECT * FROM ${tableName} WHERE 1=1 ${deletedCondition} ${extraCondition} ORDER BY ${orderBy} LIMIT 500`;
      let params: any[] = [];
      
      // 🛡️ [SEED_DETECTION_HARDENING] Count ALL rows (including tombstones) 
      // to correctly identify if a table has been hydrated for this context.
      let countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      let countParams: any[] = [];

      if (filterColumn && filterValue) {
        query = `SELECT * FROM ${tableName} WHERE ${filterColumn} = ? ${deletedCondition} ${extraCondition} ORDER BY ${orderBy} LIMIT 500`;
        params = [filterValue];
        countQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${filterColumn} = ?`;
        countParams = [filterValue];
      }

      
      try {
        const res = await db.query(query, params);
        const localRows = res.values || [];
        
        console.log(`📊 [SQLITE_QUERY_RESULT] Table: ${tableName}, Count: ${localRows.length}`);

        // 🛡️ [HYDRATION_FIX] Prevent cloud fallback if any rows (active or deleted) exist locally.
        // 🚀 BUG_FIX: If forceCloud is true, we skip the hydration guard and fetch from Supabase to discover new members.
        const countRes = await db.query(countQuery, countParams);
        const totalCount = countRes.values?.[0]?.count || 0;

        if (!forceCloud && (localRows.length > 0 || totalCount > 0)) {
          console.log(`💡 [SQLITE_HYDRATED] Returning local cache (Total historical rows: ${totalCount})`);
          return localRows;
        }
        console.log(`💡 [SQLITE_FETCH_REQUIRED] ${forceCloud ? 'Force Refresh' : 'Local Empty'} - Fetching from cloud for ${tableName}`);
      } catch (err) {
        console.error(`❌ [SQLITE_QUERY_FAIL] Table: ${tableName}`, err);
      }
    }
  }

  // Cloud Fallback
  console.log(`🌐 [CLOUD_FETCH_START] Table: ${tableName}, Filter: ${filterColumn || 'NONE'}=${filterValue || 'NONE'}`);
  let cloudQuery = supabase.from(tableName).select('*');
  
  if (filterColumn && filterValue) {
    cloudQuery = cloudQuery.eq(filterColumn, filterValue);
  }

  if (extraCondition.includes('month_year')) {
    const match = extraCondition.match(/month_year = '([^']+)'/);
    if (match && match[1]) {
      cloudQuery = cloudQuery.eq('month_year', match[1]);
    }
  }

  const { data, error } = await cloudQuery
    .order(orderBy.split(' ')[0], { ascending: !orderBy.includes('DESC') })
    .limit(500);

  if (error) {
    console.error(`❌ [CLOUD_FETCH_FAIL] Table: ${tableName}`, error);
    throw error;
  }

  const cloudRows = data || [];
  console.log(`✅ [CLOUD_FETCH_SUCCESS] Table: ${tableName}, Count: ${cloudRows.length}`);

  // Background Seed SQLite
  if (isAndroid && cloudRows.length > 0) {
    const db = await ensureDbReady();
    if (db) {
      console.log(`🌱 [SQLite_SEED] Seeding ${cloudRows.length} records into ${tableName}`);
      
      try {
        for (const row of cloudRows) {
          await seedLocalCacheRow(tableName, row);
        }
      } catch (infoErr) {
          console.error(`❌ [SCHEMA_INFO_FAIL] Table: ${tableName}`, infoErr);
      }
    }
  }
  return cloudRows;
};

/**
 * 🛡️ TABLE CONTRACT CLASSIFICATION
 */
export const DETERMINISTIC_OVERWRITE_TABLES = ['salaries', 'budgets'];
export const VERSIONED_TABLES = ['transactions', 'emis', 'group_expenses', 'savings_goals', 'subscriptions'];

/**
 * 🛡️ [REMOTE_CONTRACT_TRANSLATION]
 * Centralized mapping of modern local fields to legacy remote columns.
 */
export const translateToRemote = (tableName: string, payload: any) => {
  const remotePayload = { ...payload };

  if (tableName === 'salaries' && remotePayload.amount !== undefined) {
    remotePayload.monthly_salary = remotePayload.amount;
    delete remotePayload.amount;
  }

  if (tableName === 'budgets' && remotePayload.amount !== undefined) {
    remotePayload.monthly_budget = remotePayload.amount;
    delete remotePayload.amount;
  }

  // Remove fields that the remote schema doesn't support for overwrite tables
  if (DETERMINISTIC_OVERWRITE_TABLES.includes(tableName)) {
    delete remotePayload.idempotency_key;
    delete remotePayload.is_latest;
    delete remotePayload.version;
  }

  return remotePayload;
};

/**
 * 🛡️ [SYNC_CONFLICT_TARGET_RESOLUTION]
 */
export const getConflictTarget = (tableName: string) => {
  if (DETERMINISTIC_OVERWRITE_TABLES.includes(tableName)) return 'user_id,month_year';

  // 🛡️ [PHASE_2_IDENTITY_HARDENING]
  // Transactions MUST collide on canonical_key to prevent multi-client duplicates.
  if (tableName === 'transactions') return 'user_id,canonical_key';

  // 🚀 FIX: Standardize on 'id' for all versioned tables.
  return 'id';
};
export const saveAndSync = async (tableName: string, payload: any, operation: 'INSERT' | 'UPSERT' | 'RPC' = 'UPSERT') => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isOverwriteTable = DETERMINISTIC_OVERWRITE_TABLES.includes(tableName);
  
  // 🛡️ [RPC_SIGNATURE_SAFEGUARD]
  if (operation !== 'RPC') {
    // 🛡️ [UUID_CONTRACT_HARDENING]
    // Overwrite tables use user_id+month_year, but local SQLite still needs a PK (id).
    // We preserve the same ID if it exists to prevent local duplicates.
    if (!payload.id && tableName !== 'stats') {
      payload.id = crypto.randomUUID();
    }
    
    // Only generate idempotency_key for versioned tables
    if (!isOverwriteTable) {
      payload.idempotency_key = await generateIdempotencyKey(payload);
    }
  }

  console.log(`🧪 [TABLE_CONTRACT_FORENSIC] Save Start:`, {
    table: tableName,
    type: isOverwriteTable ? 'OVERWRITE' : 'VERSIONED',
    operation,
    payload
  });

  if (isAndroid) {
    const db = await ensureDbReady();
    if (db) {
      if (operation !== 'RPC') {
        const sqlitePayload = { ...payload };
        const validCols = await getTableColumns(db, tableName);
        
        if (validCols.length === 0) {
          throw new Error(`SQLite schema metadata missing for ${tableName}.`);
        }

        // 🛡️ [SQLITE_PARAM_SERIALIZATION]
        Object.keys(sqlitePayload).forEach(key => {
          if (sqlitePayload[key] !== null && typeof sqlitePayload[key] === 'object' && !Array.isArray(sqlitePayload[key])) {
            sqlitePayload[key] = JSON.stringify(sqlitePayload[key]);
          } else if (typeof sqlitePayload[key] === 'boolean') {
            sqlitePayload[key] = sqlitePayload[key] ? 1 : 0;
          }
        });

        const filteredPayload: Record<string, any> = {};
        Object.keys(sqlitePayload).forEach(key => {
          if (validCols.includes(key)) {
            filteredPayload[key] = sqlitePayload[key];
          }
        });

        const colsArray = Object.keys(filteredPayload);
        if (colsArray.length === 0) {
          throw new Error(`Filtered payload is empty for ${tableName}.`);
        }

        const cols = colsArray.join(', ');
        const placeholders = colsArray.map(() => '?').join(', ');
        const values = Object.values(filteredPayload);
        
        // 🛡️ [ATOMIC_WRITE_CONTRACT]
        // Ensure local save and sync enqueue are strictly sequential.
        await db.run(`INSERT OR REPLACE INTO ${tableName} (${cols}, sync_status, is_deleted) VALUES (${placeholders}, 'pending', 0)`, [...values]);
        console.log(`🧪 [TABLE_CONTRACT_FORENSIC] SQLite Persisted:`, { table: tableName, cols: colsArray });
      }
      
      const enqueued = await enqueueSync(tableName, operation, payload);
      if (!enqueued) throw new Error("Sync Queue insertion failed.");
      
      dispatchSyncUpdate();
      return payload;
    }
  }

  // Cloud Direct Fallback
  if (operation === 'RPC') {
    const cleanPayload = { ...payload };
    const keysToStrip = ['id', 'idempotency_key', 'created_at', 'updated_at', 'sync_status', 'is_deleted'];
    keysToStrip.forEach(key => {
      if (!Object.keys(cleanPayload).includes(`p_${key}`)) {
        delete cleanPayload[key];
      }
    });

    const { error } = await supabase.rpc(tableName, cleanPayload);
    if (error) throw error;
  } else {
    const conflictTarget = getConflictTarget(tableName);
    const remotePayload = translateToRemote(tableName, payload);

    console.log(`🧪 [TABLE_CONTRACT_FORENSIC] Remote Attempt:`, { 
      table: tableName, 
      target: conflictTarget, 
      payload: remotePayload 
    });

    const { data, error } = await supabase.from(tableName).upsert(remotePayload, { onConflict: conflictTarget });
    
    if (error) {
      console.error(`❌ [TABLE_CONTRACT_FORENSIC] Remote Fail:`, { error, table: tableName });
      throw error;
    }
    
    console.log(`✅ [TABLE_CONTRACT_FORENSIC] Remote Success:`, { table: tableName, data });
  }
  return payload;
};

export const deleteAndSync = async (tableName: string, id: string) => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  if (isAndroid) {
    const db = await ensureDbReady();
    if (db) {
      // 🛡️ SYNC CONSISTENCY: Fetch idempotency_key before deletion to override pending inserts
      const res = await db.query(`SELECT idempotency_key FROM ${tableName} WHERE id = ?`, [id]);
      const key = res.values?.[0]?.idempotency_key;

      // Soft delete locally
      await db.run(`UPDATE ${tableName} SET is_deleted = 1 WHERE id = ?`, [id]);
      
      // Enqueue with key to ensure atomic conflict resolution in sync_queue
      await enqueueSync(tableName, 'DELETE', { id, idempotency_key: key });
      dispatchSyncUpdate();
      return true;
    }
  }

  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw error;
  return true;
};
