package com.bachatkaro.smsengine.smstransactionengine.database

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteDatabase
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

/**
 * TransactionDao
 * ──────────────
 * Data-Access Object for [Transaction] ↔ SQLite.
 *
 * Production-grade upgrade:
 *   [insertAtomic] wraps every insert in an explicit SQLite transaction
 *   (beginTransaction / setTransactionSuccessful / endTransaction).
 *
 *   Why explicit transactions matter for fintech:
 *     SQLite's default auto-commit opens and commits a transaction per
 *     statement. If the process is killed between the write-ahead log
 *     (WAL) flush and the page file update, the record could be partially
 *     written. An explicit transaction guarantees all-or-nothing atomicity
 *     even under process kill, low battery shutdown, or storage failure.
 *
 *   Thread safety: all public methods are @Synchronized on this instance.
 *   The SQLiteOpenHelper itself is also safe to call from multiple threads.
 */
class TransactionDao(context: Context) {

    private val TAG = "TransactionDao"
    private val dbHelper = TransactionDbHelper(context)

    private fun writableDbOrNull(): SQLiteDatabase? {
        return try {
            dbHelper.writableDatabase
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Cannot open writable DB: ${ex.message}", ex)
            null
        }
    }

    private fun readableDbOrNull(): SQLiteDatabase? {
        return try {
            dbHelper.readableDatabase
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Cannot open readable DB: ${ex.message}", ex)
            null
        }
    }

    // ─── Write ────────────────────────────────────────────────────────────

    /**
     * Insert [tx] atomically using an explicit SQLite transaction.
     * Skips silently if sms_hash already exists (CONFLICT_IGNORE).
     * Enforces strict fintech validation: amount > 0, type != UNKNOWN.
     * Used for LIVE SMS processing only.
     *
     * @return The new row's _id (> 0), 0 if duplicate was ignored, -1 on error.
     */
    @Synchronized
    fun insertAtomic(tx: Transaction): Long {
        val db = writableDbOrNull() ?: return -1L

        SmsEngineLogger.d("DB_DEBUG", "Saving transaction: hash=${tx.smsHash.take(12)} amt=${tx.amount} user=${tx.userId}")

        // Validate before touching the database
        if (tx.smsHash.isBlank()) {
            SmsEngineLogger.e(TAG, "insertAtomic rejected: smsHash is blank")
            return -1L
        }
        if (tx.amount <= 0L) {
            SmsEngineLogger.e(TAG, "insertAtomic rejected: amount=${tx.amount} not positive")
            return -1L
        }
        if (tx.type == TransactionType.UNKNOWN) {
            SmsEngineLogger.e(TAG, "insertAtomic rejected: type=UNKNOWN — fintech rule violation")
            return -1L
        }

        db.beginTransaction()
        return try {
            val values = tx.toContentValues()
            val rowId  = db.insertWithOnConflict(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                values,
                SQLiteDatabase.CONFLICT_IGNORE
            )
            db.setTransactionSuccessful()

            if (rowId == -1L) {
                SmsEngineLogger.d("DB_DEBUG", "insertAtomic: duplicate skipped hash=${tx.smsHash.take(12)}…")
                0L
            } else {
                SmsEngineLogger.i("DB_DEBUG", "Saved successfully: rowId=$rowId")
                rowId
            }
        } catch (ex: SQLiteConstraintException) {
            SmsEngineLogger.d("DB_DEBUG", "insertAtomic: SQLite unique constraint hit")
            0L
        } catch (ex: Exception) {
            SmsEngineLogger.e("DB_DEBUG", "insertAtomic failed: ${ex.message}", ex)
            -1L
        } finally {
            // endTransaction MUST be called regardless of success or failure.
            // If setTransactionSuccessful() was not called, SQLite rolls back.
            try { db.endTransaction() }
            catch (ex: Exception) {
                SmsEngineLogger.e(TAG, "endTransaction threw: ${ex.message}", ex)
            }
        }
    }

    /**
     * Insert [tx] atomically for HISTORICAL SMS processing.
     * Relaxes the amount > 0 and type != UNKNOWN guards that block historical data,
     * because historical SMS may have partially-parsed amounts or ambiguous types
     * that still represent real transactions.
     * Deduplication via CONFLICT_IGNORE on sms_hash is still enforced.
     * The smsHash blank guard is still enforced for data integrity.
     * Used ONLY by SmsTransactionEngine.processHistorical — never for live SMS.
     *
     * @return The new row's _id (> 0), 0 if duplicate was ignored, -1 on error.
     */
    @Synchronized
    fun insertHistoricalAtomic(tx: Transaction): Long {
        val db = writableDbOrNull() ?: return -1L

        SmsEngineLogger.d("DB_DEBUG", "Saving HISTORICAL transaction: hash=${tx.smsHash.take(12)} amt=${tx.amount} type=${tx.type} user=${tx.userId}")

        // Only guard against blank smsHash — this is required for CONFLICT_IGNORE dedup
        if (tx.smsHash.isBlank()) {
            SmsEngineLogger.e(TAG, "insertHistoricalAtomic rejected: smsHash is blank")
            return -1L
        }

        // Log relaxed fields for observability (not blocking)
        if (tx.amount <= 0L) {
            SmsEngineLogger.w(TAG, "insertHistoricalAtomic: amount=${tx.amount} — inserting anyway (historical relaxed mode)")
        }
        if (tx.type == TransactionType.UNKNOWN) {
            SmsEngineLogger.w(TAG, "insertHistoricalAtomic: type=UNKNOWN — inserting anyway (historical relaxed mode)")
        }

        db.beginTransaction()
        return try {
            val values = tx.toContentValues()
            val rowId = db.insertWithOnConflict(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                values,
                SQLiteDatabase.CONFLICT_IGNORE
            )
            db.setTransactionSuccessful()

            if (rowId == -1L) {
                SmsEngineLogger.d("DB_DEBUG", "insertHistoricalAtomic: duplicate skipped hash=${tx.smsHash.take(12)}…")
                0L
            } else {
                SmsEngineLogger.i("DB_DEBUG", "Historical saved successfully: rowId=$rowId")
                rowId
            }
        } catch (ex: SQLiteConstraintException) {
            SmsEngineLogger.d("DB_DEBUG", "insertHistoricalAtomic: SQLite unique constraint hit")
            0L
        } catch (ex: Exception) {
            SmsEngineLogger.e("DB_DEBUG", "insertHistoricalAtomic failed: ${ex.message}", ex)
            -1L
        } finally {
            try { db.endTransaction() }
            catch (ex: Exception) {
                SmsEngineLogger.e(TAG, "endTransaction threw: ${ex.message}", ex)
            }
        }
    }

    /** Kept for backward compatibility — delegates to insertAtomic. */
    @Synchronized
    fun insertOrSkip(tx: Transaction): Long = insertAtomic(tx)

    /** Delete a transaction by marking it as a tombstone. Returns true if marked. */
    @Synchronized
    fun delete(id: Long): Boolean {
        return try {
            val db = writableDbOrNull() ?: return false
            val values = ContentValues().apply {
                put(TransactionDbHelper.COL_IS_DELETED, 1)
                put(TransactionDbHelper.COL_SYNC_STATUS, "pending_delete") // Keep it syncable
                put(TransactionDbHelper.COL_UPDATED_AT, System.currentTimeMillis())
            }
            val rows = db.update(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                values,
                "${TransactionDbHelper.COL_ID} = ?",
                arrayOf(id.toString())
            )
            SmsEngineLogger.i(TAG, "tombstoned id=$id updated=$rows")
            rows > 0
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "delete($id) failed: ${ex.message}", ex)
            false
        }
    }

    /** Delete all rows by tombstoning them. Used by test UI and data-wipe flows. */
    @Synchronized
    fun deleteAll(): Int {
        return try {
            val db = writableDbOrNull() ?: return 0
            val values = ContentValues().apply {
                put(TransactionDbHelper.COL_IS_DELETED, 1)
                put(TransactionDbHelper.COL_SYNC_STATUS, "pending_delete")
                put(TransactionDbHelper.COL_UPDATED_AT, System.currentTimeMillis())
            }
            val count = db.update(TransactionDbHelper.TABLE_TRANSACTIONS, values, null, null)
            SmsEngineLogger.w(TAG, "deleteAll tombstoned $count rows")
            count
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "deleteAll failed: ${ex.message}", ex)
            0
        }
    }

    // ─── Read ─────────────────────────────────────────────────────────────

    /** Returns true if sms_hash already exists in the database. */
    @Synchronized
    fun isDuplicate(smsHash: String): Boolean {
        return try {
            val db = readableDbOrNull() ?: return false
            val cursor = db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                arrayOf(TransactionDbHelper.COL_ID),
                "${TransactionDbHelper.COL_SMS_HASH} = ?",
                arrayOf(smsHash),
                null, null, null, "1"
            )
            cursor.use { it.moveToFirst() }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "isDuplicate failed: ${ex.message}", ex)
            false   // fail-open: attempt insert; CONFLICT_IGNORE will handle it
        }
    }

    /** Fetch a single transaction by _id. Returns null if not found or on error. */
    @Synchronized
    fun getById(id: Long): Transaction? {
        return try {
            val db = readableDbOrNull() ?: return null
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                "${TransactionDbHelper.COL_ID} = ? AND ${TransactionDbHelper.COL_IS_DELETED} = 0",
                arrayOf(id.toString()),
                null, null, null
            ).use { cursor ->
                if (cursor.moveToFirst()) cursor.toTransaction() else null
            }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getById($id) failed: ${ex.message}", ex)
            null
        }
    }

    /** Fetch most recent [limit] transactions. Pass 0 for no limit. */
    @Synchronized
    fun getAll(limit: Int = 0, userId: String? = null): List<Transaction> {
        return try {
            val limitStr = if (limit > 0) limit.toString() else null
            val db = readableDbOrNull() ?: return emptyList()
            var selection = "${TransactionDbHelper.COL_IS_DELETED} = 0"
            var selectionArgs = emptyArray<String>()
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf(userId)
            }
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null, selection, selectionArgs.takeIf { it.isNotEmpty() }, null, null,
                "${TransactionDbHelper.COL_TIMESTAMP} DESC",
                limitStr
            ).use { it.toTransactionList() }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getAll failed: ${ex.message}", ex)
            emptyList()
        }
    }

    /** Fetch transactions filtered by type. */
    @Synchronized
    fun getByType(type: TransactionType, userId: String? = null): List<Transaction> {
        return try {
            val db = readableDbOrNull() ?: return emptyList()
            var selection = "${TransactionDbHelper.COL_TYPE} = ? AND ${TransactionDbHelper.COL_IS_DELETED} = 0"
            var selectionArgs = arrayOf(type.name)
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf(type.name, userId)
            }
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                selection,
                selectionArgs,
                null, null,
                "${TransactionDbHelper.COL_TIMESTAMP} DESC"
            ).use { it.toTransactionList() }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getByType($type) failed: ${ex.message}", ex)
            emptyList()
        }
    }

    /** Fetch transactions between two epoch-millis timestamps (inclusive). */
    @Synchronized
    fun getByDateRange(
        fromEpochMs: Long,
        toEpochMs: Long,
        userId: String? = null,
        limit: Int = 0,
        offset: Int = 0
    ): List<Transaction> {
        return try {
            val limitStr = if (limit > 0) {
                if (offset > 0) "$offset, $limit" else limit.toString()
            } else null

            val db = readableDbOrNull() ?: return emptyList()
            var selection = "${TransactionDbHelper.COL_TIMESTAMP} BETWEEN ? AND ? AND ${TransactionDbHelper.COL_IS_DELETED} = 0"
            var selectionArgs = arrayOf(fromEpochMs.toString(), toEpochMs.toString())
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf(fromEpochMs.toString(), toEpochMs.toString(), userId)
            }
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                selection,
                selectionArgs,
                null, null,
                "${TransactionDbHelper.COL_TIMESTAMP} DESC",
                limitStr
            ).use { it.toTransactionList() }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getByDateRange failed: ${ex.message}", ex)
            emptyList()
        }
    }

    /** Fetch locally stored rows that have not yet been synced to Supabase. */
    @Synchronized
    fun getPendingTransactions(limit: Int = 50, userId: String? = null): List<Transaction> {
        return try {
            val db = readableDbOrNull() ?: return emptyList()
            var selection = "${TransactionDbHelper.COL_SYNC_STATUS} IN (?, ?)"
            var selectionArgs = arrayOf("pending", "pending_delete")
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf("pending", "pending_delete", userId)
            }
            val list = db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                selection,
                selectionArgs,
                null, null,
                "${TransactionDbHelper.COL_TIMESTAMP} ASC",
                limit.toString()
            ).use { it.toTransactionList() }

            SmsEngineLogger.d("DB_DEBUG", "Pending count = " + list.size)
            list
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getPendingTransactions failed: ${ex.message}", ex)
            emptyList()
        }
    }

    /** Fetch locally stored rows that have not yet been synced to Supabase. */
    @Synchronized
    fun getUnsynced(limit: Int = 50, userId: String? = null): List<Transaction> {
        return try {
            val db = readableDbOrNull() ?: return emptyList()
            var selection = "${TransactionDbHelper.COL_SYNC_STATUS} IN (?, ?, ?)"
            var selectionArgs = arrayOf("pending", "failed", "pending_delete")
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf("pending", "failed", "pending_delete", userId)
            }
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                selection,
                selectionArgs,
                null, null,
                "${TransactionDbHelper.COL_TIMESTAMP} ASC",
                limit.toString()
            ).use { it.toTransactionList() }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getUnsynced failed: ${ex.message}", ex)
            emptyList()
        }
    }

    /** Mark a locally stored row as completed after successful backend upload. */
    @Synchronized
    fun markAsCompleted(id: Long): Boolean {
        return updateSyncStatus(id, "completed")
    }

    /** Mark a locally stored row as synced after successful backend upload. */
    @Synchronized
    fun updateSyncStatus(id: Long, status: String): Boolean {
        return try {
            val db = writableDbOrNull() ?: return false
            val values = ContentValues().apply {
                put(TransactionDbHelper.COL_SYNC_STATUS, status)
                put(TransactionDbHelper.COL_UPDATED_AT, System.currentTimeMillis())
                if (status == "completed") {
                    put(TransactionDbHelper.COL_IS_SYNCED, 1)
                }
            }
            val rows = db.update(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                values,
                "${TransactionDbHelper.COL_ID} = ?",
                arrayOf(id.toString())
            )
            rows > 0
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "updateSyncStatus($id, $status) failed: ${ex.message}", ex)
            false
        }
    }

    /** Execute multiple database operations within a single transaction. */
    fun runInTransaction(action: Runnable) {
        val db = writableDbOrNull() ?: return
        db.beginTransaction()
        try {
            action.run()
            db.setTransactionSuccessful()
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Batch transaction failed: ${ex.message}", ex)
        } finally {
            try { db.endTransaction() }
            catch (ex: Exception) { SmsEngineLogger.e(TAG, "endTransaction failure", ex) }
        }
    }

    /** 
     * Upsert a transaction with conflict resolution (LATEST WINS).
     * Used primarily by RestoreManager and RestoreService.
     */
    @Synchronized
    fun upsert(tx: Transaction): Long {
        val db = writableDbOrNull() ?: return -1L
        
        try {
            // 1. Check for existing record by sms_hash
            val existing = getByHash(tx.smsHash)
            
            if (existing != null) {
                // 2. CONFLICT RESOLUTION: Latest updated_at wins
                // Note: local DB stores updatedAt as Long (ms), cloud returns Iso which we map to Long
                if (tx.updatedAt > existing.updatedAt) {
                    SmsEngineLogger.i(TAG, "CONFLICT_RESOLVED: Cloud record is newer for ${tx.smsHash.take(8)}")
                    // Cloud wins -> Overwrite local
                    val values = tx.toContentValues()
                    return db.update(
                        TransactionDbHelper.TABLE_TRANSACTIONS,
                        values,
                        "${TransactionDbHelper.COL_SMS_HASH} = ?",
                        arrayOf(tx.smsHash)
                    ).toLong()
                } else {
                    // Local wins or equal -> Skip update
                    return 0L 
                }
            } else {
                // 3. New record -> Regular insert
                val values = tx.toContentValues()
                return db.insert(
                    TransactionDbHelper.TABLE_TRANSACTIONS,
                    null,
                    values
                )
            }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "upsert failed: ${ex.message}", ex)
            return -1L
        }
    }

    /** Find a transaction by its unique sms_hash. */
    @Synchronized
    fun getByHash(hash: String): Transaction? {
        val db = readableDbOrNull() ?: return null
        return try {
            val selection = "${TransactionDbHelper.COL_SMS_HASH} = ?"
            val selectionArgs = arrayOf(hash)
            db.query(
                TransactionDbHelper.TABLE_TRANSACTIONS,
                null,
                selection,
                selectionArgs,
                null, null, null, "1"
            ).use { cursor ->
                if (cursor.moveToFirst()) cursor.toTransaction() else null
            }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "getByHash failed: ${ex.message}", ex)
            null
        }
    }

    /** Total count of stored transactions. */
    @Synchronized
    fun count(userId: String? = null): Long {
        return try {
            val db = readableDbOrNull() ?: return 0L
            val selection = if (userId != null) "${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL" else null
            val selectionArgs = if (userId != null) arrayOf(userId) else null
            android.database.DatabaseUtils.queryNumEntries(
                db,
                TransactionDbHelper.TABLE_TRANSACTIONS,
                selection,
                selectionArgs
            )
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "count() failed: ${ex.message}", ex)
            0L
        }
    }

    /** Sum of all DEBIT amounts in minor units. */
    @Synchronized fun totalDebits(userId: String? = null)  = sumByType(TransactionType.DEBIT, userId)

    /** Sum of all CREDIT amounts in minor units. */
    @Synchronized fun totalCredits(userId: String? = null) = sumByType(TransactionType.CREDIT, userId)

    private fun sumByType(type: TransactionType, userId: String? = null): Long {
        return try {
            val db = readableDbOrNull() ?: return 0L
            var selection = "${TransactionDbHelper.COL_TYPE} = ?"
            var selectionArgs = arrayOf(type.name)
            if (userId != null) {
                selection += " AND (${TransactionDbHelper.COL_USER_ID} = ? OR ${TransactionDbHelper.COL_USER_ID} IS NULL)"
                selectionArgs = arrayOf(type.name, userId)
            }
            db.rawQuery(
                "SELECT SUM(${TransactionDbHelper.COL_AMOUNT}) " +
                "FROM ${TransactionDbHelper.TABLE_TRANSACTIONS} " +
                "WHERE $selection",
                selectionArgs
            ).use { cursor ->
                if (cursor.moveToFirst()) cursor.getLong(0) else 0L
            }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "sumByType($type) failed: ${ex.message}", ex)
            0L
        }
    }

    // ─── Mapping helpers ──────────────────────────────────────────────────

    private fun Transaction.toContentValues() = ContentValues().apply {
        put(TransactionDbHelper.COL_SMS_HASH,    smsHash)
        put(TransactionDbHelper.COL_SENDER,      sender)
        put(TransactionDbHelper.COL_RAW_BODY,    rawBody)
        put(TransactionDbHelper.COL_TYPE,        type.name)
        put(TransactionDbHelper.COL_AMOUNT,      amount)
        put(TransactionDbHelper.COL_CURRENCY,    currency)
        put(TransactionDbHelper.COL_ACCOUNT_REF, accountRef)
        put(TransactionDbHelper.COL_REFERENCE,   reference)
        put(TransactionDbHelper.COL_MERCHANT,    merchantName)
        put(TransactionDbHelper.COL_CATEGORY,    category)
        put(TransactionDbHelper.COL_PAYMENT_HANDLE, paymentHandle)
        put(TransactionDbHelper.COL_LOCATION,    location)
        put(TransactionDbHelper.COL_BALANCE,     balance)
        put(TransactionDbHelper.COL_TIMESTAMP,   timestamp)
        put(TransactionDbHelper.COL_PARSED_AT,   parsedAt)
        put(TransactionDbHelper.COL_IS_SYNCED,   if (isSynced) 1 else 0)
        put(TransactionDbHelper.COL_SYNC_STATUS, syncStatus)
        put(TransactionDbHelper.COL_UPDATED_AT,  updatedAt)
        put(TransactionDbHelper.COL_USER_ID,     userId)
        put(TransactionDbHelper.COL_IS_DELETED,  if (isDeleted) 1 else 0)
        put(TransactionDbHelper.COL_CANONICAL_KEY, canonicalKey)
        put(TransactionDbHelper.COL_IDEMPOTENCY_KEY, idempotencyKey)
    }

    /** Safe enum lookup — never throws on unknown strings. */
    private fun safeTransactionType(raw: String?): TransactionType =
        if (raw == null) TransactionType.UNKNOWN
        else TransactionType.entries.firstOrNull { it.name == raw }
            ?: TransactionType.UNKNOWN.also {
                SmsEngineLogger.w(TAG, "Unknown TransactionType '$raw' in DB — mapped to UNKNOWN")
            }

    private fun Cursor.toTransaction() = Transaction(
        id           = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_ID)),
        smsHash      = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_SMS_HASH))   ?: "",
        sender       = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_SENDER))      ?: "",
        rawBody      = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_RAW_BODY))    ?: "",
        type         = safeTransactionType(getString(getColumnIndexOrThrow(TransactionDbHelper.COL_TYPE))),
        amount       = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_AMOUNT)),
        currency     = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_CURRENCY))    ?: "INR",
        accountRef   = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_ACCOUNT_REF)) ?: "",
        reference    = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_REFERENCE))   ?: "",
        merchantName = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_MERCHANT))    ?: "",
        category     = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_CATEGORY))    ?: "Others",
        paymentHandle = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_PAYMENT_HANDLE)) ?: "",
        location     = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_LOCATION))    ?: "",
        balance      = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_BALANCE)),
        timestamp    = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_TIMESTAMP)),
        parsedAt     = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_PARSED_AT)),
        isSynced     = getInt(getColumnIndexOrThrow(TransactionDbHelper.COL_IS_SYNCED)) == 1,
        syncStatus   = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_SYNC_STATUS)) ?: "pending",
        updatedAt    = getLong(getColumnIndexOrThrow(TransactionDbHelper.COL_UPDATED_AT)),
        userId       = getString(getColumnIndexOrThrow(TransactionDbHelper.COL_USER_ID)),
        canonicalKey = getColumnIndex(TransactionDbHelper.COL_CANONICAL_KEY).takeIf { it >= 0 }?.let { getString(it) },
        idempotencyKey = getColumnIndex(TransactionDbHelper.COL_IDEMPOTENCY_KEY).takeIf { it >= 0 }?.let { getString(it) },
        isDeleted    = getInt(getColumnIndexOrThrow(TransactionDbHelper.COL_IS_DELETED)) == 1
    )

    private fun Cursor.toTransactionList(): List<Transaction> {
        val list = mutableListOf<Transaction>()
        while (moveToNext()) {
            try { list.add(toTransaction()) }
            catch (ex: Exception) {
                SmsEngineLogger.w(TAG, "Row mapping error at pos $position: ${ex.message}")
            }
        }
        return list
    }
}
