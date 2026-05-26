import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;
let initPromise: Promise<SQLiteDBConnection | null> | null = null;

export const initSQLite = async () => {
  if (Capacitor.getPlatform() === 'web') return null;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const ret = await sqlite.checkConnectionsConsistency();
      const isConn = (await sqlite.isConnection('sms_engine_db', false)).result;
      if (ret.result && isConn) {
        db = await sqlite.retrieveConnection('sms_engine_db', false);
      } else {
        db = await sqlite.createConnection('sms_engine_db', false, 'no-encryption', 1, false);
      }
      if (!(await db.isDBOpen()).result) await db.open();

      // 🛡️ [DATABASE_SCHEMA_MASTER_CONTRACT]
      const createTables = `
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL, type TEXT NOT NULL,
          category TEXT, payment_mode TEXT, description TEXT, date TEXT NOT NULL, 
          sms_hash TEXT UNIQUE, entry_source TEXT DEFAULT 'sms',
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0,
          canonical_key TEXT UNIQUE, idempotency_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER DEFAULT 2, user_id TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0,
          idempotency_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS group_expenses (
          id TEXT PRIMARY KEY, group_id TEXT NOT NULL, title TEXT NOT NULL, category TEXT, amount INTEGER NOT NULL,
          paid_by TEXT NOT NULL, paid_by_member_id TEXT, user_id TEXT NOT NULL, notes TEXT, 
          split_type TEXT DEFAULT 'equal', idempotency_key TEXT UNIQUE,
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_latest INTEGER DEFAULT 1, version INTEGER
        );

        CREATE TABLE IF NOT EXISTS expense_splits (
          id TEXT PRIMARY KEY, expense_id TEXT NOT NULL, group_id TEXT NOT NULL, member_id TEXT NOT NULL,
          user_id TEXT, share_amount INTEGER NOT NULL, sync_status TEXT DEFAULT 'pending', 
          is_deleted INTEGER DEFAULT 0, idempotency_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS group_members (
          id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT, name TEXT NOT NULL,
          role TEXT DEFAULT 'member', upi_id TEXT, sync_status TEXT DEFAULT 'pending',
          is_deleted INTEGER DEFAULT 0, idempotency_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, goal_name TEXT NOT NULL, target_amount INTEGER NOT NULL,
          saved_amount INTEGER DEFAULT 0, idempotency_key TEXT UNIQUE,
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_latest INTEGER DEFAULT 1, version INTEGER
        );

        CREATE TABLE IF NOT EXISTS emis (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, amount INTEGER NOT NULL,
          emi_day INTEGER, loan_details TEXT, idempotency_key TEXT UNIQUE,
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_latest INTEGER DEFAULT 1, version INTEGER,
          emi_name TEXT 
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, amount INTEGER NOT NULL,
          category TEXT, billing_cycle TEXT, idempotency_key TEXT UNIQUE,
          sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_latest INTEGER DEFAULT 1, version INTEGER
        );

        CREATE TABLE IF NOT EXISTS salaries (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL, month_year TEXT NOT NULL,
          idempotency_key TEXT UNIQUE, sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_latest INTEGER DEFAULT 1, version INTEGER,
          UNIQUE(user_id, month_year)
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, monthly_budget INTEGER NOT NULL, month_year TEXT NOT NULL,
          idempotency_key TEXT UNIQUE, sync_status TEXT DEFAULT 'pending', is_deleted INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_latest INTEGER DEFAULT 1, version INTEGER,
          UNIQUE(user_id, month_year)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY, table_name TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL,
          idempotency_key TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pending', retry_count INTEGER DEFAULT 0,
          next_retry_at DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settlement_intents (
          id TEXT PRIMARY KEY, group_id TEXT NOT NULL, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
          amount INTEGER NOT NULL, currency TEXT DEFAULT 'INR', status TEXT DEFAULT 'created',
          payment_method TEXT DEFAULT 'upi', metadata TEXT, idempotency_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_groups_user ON groups(user_id) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_group_expenses_group ON group_expenses(group_id) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_expense_splits_group ON expense_splits(group_id) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at);
        CREATE INDEX IF NOT EXISTS idx_settlement_intents_status ON settlement_intents(status);
      `;
      await db.execute(createTables);

      // 🛡️ [FORENSIC_SCHEMA_SYNC]
      // Comprehensive migration map covering ALL tables in the master contract.
      // Ensures columns AND unique indices exist for reliable ON CONFLICT execution.
      const tableMigrations = [
        {
          table: 'transactions',
          columns: [
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'entry_source', type: 'TEXT DEFAULT \'sms\'' },
            { name: 'payment_mode', type: 'TEXT' },
            { name: 'sms_hash', type: 'TEXT' },
            { name: 'canonical_key', type: 'TEXT' },
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_canonical_key ON transactions(canonical_key)",
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key)"
          ]
        },
        {
          table: 'groups',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_idempotency ON groups(idempotency_key)"
          ]
        },
        {
          table: 'group_expenses',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { name: 'is_latest', type: 'INTEGER DEFAULT 1' },
            { name: 'version', type: 'INTEGER' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_group_expenses_idempotency ON group_expenses(idempotency_key)"
          ]
        },
        {
          table: 'expense_splits',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_splits_idempotency ON expense_splits(idempotency_key)"
          ]
        },
        {
          table: 'group_members',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { name: 'upi_id', type: 'TEXT' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_idempotency ON group_members(idempotency_key)"
          ]
        },
        {
          table: 'savings_goals',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_goals_idempotency ON savings_goals(idempotency_key)"
          ]
        },
        {
          table: 'emis',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { name: 'emi_name', type: 'TEXT' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_emis_idempotency ON emis(idempotency_key)"
          ]
        },
        {
          table: 'subscriptions',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_idempotency ON subscriptions(idempotency_key)"
          ]
        },
        {
          table: 'salaries',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_salaries_idempotency ON salaries(idempotency_key)"
          ]
        },
        {
          table: 'budgets',
          columns: [
            { name: 'idempotency_key', type: 'TEXT' },
            { name: 'sync_status', type: 'TEXT DEFAULT \'pending\'' },
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
          ],
          indices: [
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_idempotency ON budgets(idempotency_key)"
          ]
        }
      ];

      console.log("🛠️ [SQLITE_MIGRATION] Starting forensic schema validation...");
      for (const migration of tableMigrations) {
        try {
          const info = await db.query(`PRAGMA table_info(${migration.table})`);
          const existingCols = (info.values || []).map(c => c.name);
          
          if (existingCols.length === 0) continue; // Table might not exist yet (execute should have created it)

          for (const col of migration.columns) {
            if (!existingCols.includes(col.name)) {
              console.log(`🛠️ [SQLITE_MIGRATION] FORCE ALTER: Adding ${col.name} to ${migration.table}`);
              await db.run(`ALTER TABLE ${migration.table} ADD COLUMN ${col.name} ${col.type}`);
            }
          }

          if (migration.indices) {
            for (const indexSql of migration.indices) {
              await db.run(indexSql);
            }
          }
        } catch (migErr) {
          console.error(`❌ [SQLITE_MIGRATION_FAIL] Table: ${migration.table}`, migErr);
        }
      }

      // 🛡️ [DETERMINISTIC_DATA_REPAIR_V6]
      console.log("🛠️ [SQLITE_REPAIR] Starting forensic data alignment...");
      
      // 1. Recover sources
      await db.run(`UPDATE transactions SET entry_source = 'manual' WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'man:%'`);
      await db.run(`UPDATE transactions SET entry_source = 'voice' WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'voice:%'`);

      // 2. Fix Amount Scale
      await db.run(`UPDATE transactions SET amount = amount * 100 WHERE (entry_source IN ('manual', 'voice')) AND amount > 0 AND amount < 10000`);

      // 3. Backfill canonical_key (UTC safe)
      await db.run(`
        UPDATE transactions 
        SET canonical_key = 'canon:' || amount || ':' || 
            strftime('%s', REPLACE(REPLACE(REPLACE(date, 'T', ' '), 'Z', ''), '+00:00', '')) || ':' || 
            lower(replace(replace(replace(COALESCE(description, ''), ' ', ''), '.', ''), '-', '')) || ':' || 
            type
        WHERE canonical_key IS NULL
      `);

      // 4. Purge duplicates (BACKWARD COMPATIBLE: No Window Functions / ROW_NUMBER)
      // Uses SQLite-native aggregate behavior to identify the latest record per canonical_key.
      // This is compatible with all versions of SQLite on Android (API 21+).
      await db.run(`
        DELETE FROM transactions 
        WHERE canonical_key IS NOT NULL 
        AND id NOT IN (
          SELECT id 
          FROM (
            SELECT id, MAX(updated_at) 
            FROM transactions 
            WHERE canonical_key IS NOT NULL
            GROUP BY user_id, canonical_key
          )
        )
      `);

      // 5. Finalize schema parity
      await db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_canonical_key ON transactions(canonical_key)");

      // 🛡️ [FORENSIC_RUNTIME_DUMP]
      if (import.meta.env.DEV || Capacitor.getPlatform() === 'android') {
        const txInfo = await db.query("PRAGMA table_info(transactions)");
        console.log("📊 [SQLITE_FORENSIC] transactions schema:", JSON.stringify(txInfo.values));
        
        const txIndices = await db.query("PRAGMA index_list(transactions)");
        console.log("📊 [SQLITE_FORENSIC] transactions indices:", JSON.stringify(txIndices.values));

        const sqInfo = await db.query("PRAGMA table_info(sync_queue)");
        console.log("📊 [SQLITE_FORENSIC] sync_queue schema:", JSON.stringify(sqInfo.values));
      }

      return db;
    } catch (error) {
      console.error('SQLite Forensic Repair Error:', error);
      initPromise = null;
      return null;
    }
  })();
  return initPromise;
};

export const ensureDbReady = async () => {
  if (Capacitor.getPlatform() === 'web') return null;
  if (initPromise) await initPromise;
  if (!db || !(await db.isDBOpen()).result) {
    initPromise = null;
    await initSQLite();
  }
  return db;
};

export const getDB = () => db;

let cachedDeviceId: string | null = null;
export const getDeviceId = () => {
  if (cachedDeviceId) return cachedDeviceId;
  let deviceId = localStorage.getItem('bk_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}`;
    localStorage.setItem('bk_device_id', deviceId);
  }
  cachedDeviceId = deviceId;
  return deviceId;
};

// 🛡️ [HIGH_ENTROPY_UUID_SAFEGUARD]
// Ensures reliable unique ID generation across all Android WebView versions.
export const getSafeUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {}
  
  // Fallback for non-secure contexts or older engines
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateIdempotencyKey = async (payload: any): Promise<string> => {
  // 🛡️ [IDEMPOTENCY_SAFETY_CONTRACT]
  // Rule 1: Manual/Voice actions MUST be unique to prevent collisions on legitimate repeated expenses.
  // Detect both 'entry_source' and 'source' fields for backward/bridge compatibility.
  const source = payload.entry_source || payload.source;
  if (source === 'manual' || source === 'voice' || source === 'paste') {
    return `user_act:${getSafeUUID()}`;
  }

  // Rule 2: SMS imports MUST remain deterministic to prevent duplicate processing of same PDUs.
  // We use the sms_hash if available as the primary deterministic seed.
  const seed = payload.sms_hash || payload.smsHash || (JSON.stringify(payload) + getDeviceId());
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  return `det_hash:${Math.abs(hash).toString(36)}`;
};

export const enqueueSync = async (tableName: string, operation: string, payload: any, silent: boolean = false) => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return false;
  try {
    // 🛡️ [IDEMPOTENCY_CONTINUITY] 
    // If payload already has a key (from saveLocalTransaction), use it.
    // Otherwise, generate a context-aware key.
    const key = payload.idempotency_key || payload.sms_hash || payload.smsHash || payload.id || await generateIdempotencyKey(payload);
    
    await currentDb.run(`
      INSERT INTO sync_queue (id, table_name, operation, payload, idempotency_key, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(idempotency_key) DO UPDATE SET status = 'pending', retry_count = 0;
    `, [getSafeUUID(), tableName, operation, JSON.stringify(payload), key]);
    if (!silent) {
      window.dispatchEvent(new Event('sync_queue_updated'));
      window.dispatchEvent(new Event('newTransaction')); // Trigger global dashboard refresh
    }
    return true;
  } catch (err) { return false; }
};

export const saveLocalTransaction = async (tx: any, silent: boolean = false, syncStatus: 'pending' | 'completed' = 'pending') => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return null;
  try {
    // 🛡️ [IDENTITY_STABILIZATION]
    // Rule: Transaction MUST have a solid ID before any persistence or mapping.
    // This prevents double-inserts in the group activity ledger by ensuring 
    // downstream components (like AutoGroupMapper) reuse the same ID.
    if (!tx.id) {
      tx.id = getSafeUUID();
    }
    
    const source = tx.entry_source || tx.source || 'sms';
    const isUserAction = source === 'manual' || source === 'voice' || source === 'paste';
    
    const normAmount = Math.round(Number(tx.amount || 0));
    const dateObj = tx.date ? new Date(tx.date) : new Date();
    const ts = Math.floor(dateObj.getTime() / 1000);
    const normPayee = (tx.description || tx.payee || "").toLowerCase().replace(/[\s\.-]/g, "");
    
    const canonicalKey = tx.canonical_key || (isUserAction 
      ? `user_canon:${getSafeUUID()}` 
      : `canon:${normAmount}:${ts}:${normPayee}:${tx.type || 'expense'}`);

    // Pass full tx to generator to ensure correct source detection
    const idempotencyKey = tx.idempotency_key || tx.idempotencyKey || await generateIdempotencyKey({ ...tx, entry_source: source });

    console.log(`🧪 [SQLITE_SAVE_TRACE] Identity: ${idempotencyKey} Canon: ${canonicalKey} Source: ${source} ID: ${tx.id}`);

    const query = `
      INSERT INTO transactions (
        id, user_id, amount, type, category, payment_mode, 
        description, date, sms_hash, entry_source, sync_status, is_deleted, canonical_key,
        idempotency_key
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(canonical_key) DO UPDATE SET
        amount = excluded.amount,
        description = excluded.description,
        sync_status = CASE 
          WHEN transactions.sync_status = 'completed' THEN 'completed' 
          ELSE excluded.sync_status 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE transactions.is_deleted = 0;
    `;
    
    tx.idempotency_key = idempotencyKey;

    await currentDb.run(query, [
      tx.id, tx.user_id, tx.amount, tx.type || 'expense', tx.category || 'Others', 
      tx.payment_mode || 'UPI', tx.description || tx.payee || 'Transaction', tx.date || new Date().toISOString(), 
      tx.sms_hash || tx.smsHash || null,
      source, syncStatus, 0, canonicalKey,
      idempotencyKey
    ]);

    // 🛡️ [PIPELINE_SYNCHRONIZATION]
    // Rule: Every new expense transaction (Manual, Voice, SMS) must attempt auto-mapping.
    if (tx.type !== 'income' && !tx.is_deleted) {
      try {
        const { autoMapTransactionToGroup } = await import('@/features/auto-group/AutoGroupMapper');
        // Ensure we pass the full resolved object for mapping with the PRE-SET ID
        void autoMapTransactionToGroup({
          ...tx,
          entry_source: source
        });
      } catch (err) {
        console.warn('⚠️ [AutoGroupMapper] Trigger failed:', err);
      }
    }

    if (!silent) {
      window.dispatchEvent(new Event('newTransaction'));
      window.dispatchEvent(new Event('newLocalTransaction'));
      console.log(`🔄 [SQLITE_REFRESH] Events dispatched for ID: ${tx.id}`);
    }

    return tx;
  } catch (err) { 
    console.error('❌ [SQLite_Save_FAIL] Payload:', JSON.stringify(tx), 'Error:', err);
    throw err; 
  }
};

export const getLocalTransactions = async (userId: string, limit = 500) => {
  if (!db) return [];
  const res = await db.query(`SELECT * FROM transactions WHERE user_id = ? AND is_deleted = 0 ORDER BY date DESC LIMIT ?`, [userId, limit]);
  return res.values || [];
};

export const getAggregateStats = async (userId: string, monthYear?: string) => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return { total_spent: 0, monthly_spent: 0, monthly_income: 0 };
  const params = [userId];
  let monthlyQuery = "";
  if (monthYear) {
    monthlyQuery = `AND strftime('%Y-%m', date) = ?`;
    params.push(monthYear);
  }
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type != 'income' THEN amount ELSE 0 END), 0) as total_spent,
      COALESCE(SUM(CASE WHEN type != 'income' ${monthlyQuery} THEN amount ELSE 0 END), 0) as monthly_spent,
      COALESCE(SUM(CASE WHEN type = 'income' ${monthlyQuery} THEN amount ELSE 0 END), 0) as monthly_income
    FROM transactions WHERE user_id = ? AND is_deleted = 0
  `;
  const res = await currentDb.query(query, params);
  return res.values?.[0] || { total_spent: 0, monthly_spent: 0, monthly_income: 0 };
};

export const getCategoryTotals = async (userId: string, monthYear: string) => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return [];
  const res = await currentDb.query(`
    SELECT category, SUM(amount) as amount FROM transactions
    WHERE user_id = ? AND is_deleted = 0 AND strftime('%Y-%m', date) = ?
    AND type != 'income' GROUP BY category ORDER BY amount DESC
  `, [userId, monthYear]);
  return res.values || [];
};
