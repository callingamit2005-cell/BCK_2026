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
          canonical_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

        CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id) WHERE is_deleted = 0;
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at);
      `;
      await db.execute(createTables);

      // 🛡️ [FORENSIC_SCHEMA_SYNC]
      const requiredColumns = [
        { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
        { name: 'entry_source', type: 'TEXT DEFAULT \'sms\'' },
        { name: 'payment_mode', type: 'TEXT' },
        { name: 'sms_hash', type: 'TEXT' },
        { name: 'canonical_key', type: 'TEXT' }
      ];

      const txInfo = await db.query("PRAGMA table_info(transactions)");
      const txCols = (txInfo.values || []).map(c => c.name);
      
      for (const col of requiredColumns) {
        if (!txCols.includes(col.name)) {
          console.log(`🛠️ [SQLITE_MIGRATION] FORCE ALTER: Adding ${col.name} to transactions`);
          await db.run(`ALTER TABLE transactions ADD COLUMN ${col.name} ${col.type}`);
        }
      }

      // 🛡️ [DETERMINISTIC_DATA_REPAIR_V5]
      console.log("🛠️ [SQLITE_REPAIR] Starting forensic data alignment...");
      
      // 1. Recover sources
      await db.run(`UPDATE transactions SET entry_source = 'manual' WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'man:%'`);
      await db.run(`UPDATE transactions SET entry_source = 'voice' WHERE (entry_source IS NULL OR entry_source = 'sms') AND sms_hash LIKE 'voice:%'`);

      // 2. Fix Amount Scale
      await db.run(`UPDATE transactions SET amount = amount * 100 WHERE (entry_source IN ('manual', 'voice')) AND amount > 0 AND amount < 10000`);

      // 3. Backfill canonical_key
      await db.run(`
        UPDATE transactions 
        SET canonical_key = 'canon:' || amount || ':' || 
            strftime('%s', REPLACE(REPLACE(REPLACE(date, 'T', ' '), 'Z', ''), '+00:00', '')) || ':' || 
            lower(replace(replace(replace(COALESCE(description, payee, ''), ' ', ''), '.', ''), '-', '')) || ':' || 
            type
        WHERE canonical_key IS NULL
      `);

      // 4. Purge duplicates
      await db.run(`
        DELETE FROM transactions 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY user_id, canonical_key 
              ORDER BY updated_at DESC
            ) as rn
            FROM transactions
            WHERE canonical_key IS NOT NULL
          ) WHERE rn = 1
        )
      `);

      // 5. Hard physical unique index
      await db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_canonical_key ON transactions(canonical_key)");

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

export const generateIdempotencyKey = async (payload: any): Promise<string> => {
  const str = JSON.stringify(payload) + getDeviceId();
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  return `sha256:${Math.abs(hash).toString(36)}`;
};

export const enqueueSync = async (tableName: string, operation: string, payload: any, silent: boolean = false) => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return false;
  try {
    const key = payload.idempotency_key || payload.sms_hash || payload.id || await generateIdempotencyKey(payload);
    await currentDb.run(`
      INSERT INTO sync_queue (id, table_name, operation, payload, idempotency_key, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(idempotency_key) DO UPDATE SET status = 'pending', retry_count = 0;
    `, [`sq_${Date.now()}`, tableName, operation, JSON.stringify(payload), key]);
    if (!silent) window.dispatchEvent(new Event('sync_queue_updated'));
    return true;
  } catch (err) { return false; }
};

export const saveLocalTransaction = async (tx: any) => {
  const currentDb = await ensureDbReady();
  if (!currentDb) return null;
  try {
    const normAmount = Math.round(Number(tx.amount || 0));
    const dateObj = new Date(tx.date);
    const ts = Math.floor(dateObj.getTime() / 1000);
    const normPayee = (tx.description || tx.payee || "").toLowerCase().replace(/[\s\.-]/g, "");
    const canonicalKey = tx.canonical_key || `canon:${normAmount}:${ts}:${normPayee}:${tx.type || 'expense'}`;

    const query = `
      INSERT INTO transactions (
        id, user_id, amount, type, category, payment_mode, 
        description, date, sms_hash, entry_source, sync_status, is_deleted, canonical_key
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(canonical_key) DO UPDATE SET
        amount = excluded.amount,
        description = excluded.description,
        updated_at = CURRENT_TIMESTAMP
      WHERE transactions.is_deleted = 0;
    `;
    await currentDb.run(query, [
      tx.id || crypto.randomUUID(), tx.user_id, tx.amount, tx.type, tx.category, 
      tx.payment_mode, tx.description, tx.date, tx.sms_hash || null,
      tx.entry_source || 'sms', 'pending', 0, canonicalKey
    ]);
    return tx;
  } catch (err) { throw err; }
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
