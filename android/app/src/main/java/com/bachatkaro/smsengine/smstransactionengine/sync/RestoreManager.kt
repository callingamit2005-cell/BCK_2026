package com.bachatkaro.smsengine.smstransactionengine.sync

import android.content.Context
import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import com.bachatkaro.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * RestoreManager
 * ──────────────
 * Logic for Supabase → SQLite history restoration.
 * Should be triggered after successful user login.
 */
class RestoreManager(private val context: Context) {

    private val TAG = "RestoreManager"
    private val dao = TransactionDao(context)
    private val syncClient = SupabaseSyncClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        anonKey = BuildConfig.SUPABASE_KEY
    )

    /**
     * Restore all user history from cloud.
     * Idempotent logic: CONFLICT_REPLACE via DAO.
     * Performance: Single transaction for batch insert.
     */
    suspend fun restoreHistory(userId: String, accessToken: String) = withContext(Dispatchers.IO) {
        SmsEngineLogger.i(TAG, "RESTORE_START: Initiating restoration for user $userId")
        
        try {
            // 1. Fetch all history from Supabase (last 6 months)
            val history = syncClient.fetchHistory(accessToken, userId)
            
            if (history.isEmpty()) {
                SmsEngineLogger.i(TAG, "RESTORE_DONE: No history found in cloud")
                return@withContext
            }

            SmsEngineLogger.i(TAG, "RESTORE_START: Syncing ${history.size} records to local DB")

            // 2. Insert into SQLite using a single transaction for efficiency
            var restoredCount = 0
            dao.runInTransaction {
                for (tx in history) {
                    val rowId = dao.upsert(tx)
                    if (rowId > 0) restoredCount++
                }
            }

            SmsEngineLogger.i(TAG, "RESTORE_DONE: Restored $restoredCount records (Upserted/Replaced)")
        } catch (e: Exception) {
            SmsEngineLogger.e(TAG, "RESTORE_FAIL: Error during restoration", e)
        }
    }
}
