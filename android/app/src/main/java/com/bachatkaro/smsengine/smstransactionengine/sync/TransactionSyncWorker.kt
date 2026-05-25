package com.bachatkaro.smsengine.smstransactionengine.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import com.bachatkaro.app.BuildConfig
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * TransactionSyncWorker
 * ─────────────────────
 * Hardened background sync engine with high-priority debug logging.
 */
class TransactionSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    private val dao = TransactionDao(appContext)
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    override suspend fun doWork(): Result {
        // 1. Worker Start Log - Confirming Latest Build
        Log.d("WORKER_START", "TxnSyncWorker running NEW BUILD")
        
        val pending = try {
            dao.getUnsynced(limit = 20)
        } catch (e: Exception) {
            Log.e("WORKER_ERROR", "DAO Query failure: ${e.message}")
            return Result.failure()
        }

        if (pending.isEmpty()) {
            Log.d("WORKER_STATUS", "No pending transactions to sync.")
            return Result.success()
        }

        val session = SyncSessionStore.load(applicationContext)
        if (session == null || session.accessToken.isNullOrBlank()) {
            Log.w("WORKER_STATUS", "Sync deferred: Session missing or invalid")
            return Result.retry()
        }

        var hasFailures = false
        for (txn in pending) {
            Log.d("SYNC_DEBUG", "Syncing transaction: ${txn.id} hash=${txn.smsHash} amt=${txn.amount}")
            val success = pushToSupabase(txn, session.userId, session.accessToken)

            if (success) {
                dao.updateSyncStatus(txn.id, "completed")
            } else {
                hasFailures = true
            }
        }

        return if (hasFailures) Result.retry() else Result.success()
    }

    private fun pushToSupabase(txn: Transaction, userId: String, token: String): Boolean {
        var payloadString = ""
        try {
            val json = JSONObject().apply {
                // SENSITIVE PRODUCTION FIX (Issue A: Amount Distortion)
                // RULE: Always store PAISA (Integer/Long) in backend. 
                put("amount", txn.amount)
                put("type", if (txn.type.name == "CREDIT") "income" else "expense")
                put("user_id", userId)
                put("sms_hash", txn.smsHash)
                put("category", txn.category)
                put("description", txn.merchantName.ifBlank { txn.sender.ifBlank { "SMS Transaction" } })
                
                val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply {
                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                }
                put("date", sdf.format(java.util.Date(txn.timestamp)))
                put("updated_at", sdf.format(java.util.Date(txn.updatedAt)))
                
                // 🛡️ [TOMBSTONE SYNC]
                // If marked for deletion locally, push as a tombstone instead of physical delete.
                put("is_deleted", txn.syncStatus == "pending_delete" || txn.isDeleted)
            }
            
            payloadString = json.toString()
            
            // 2. Log Payload Before API Call
            Log.d("SYNC_DEBUG", "Payload: $payloadString")
            Log.d("SYNC_PAYLOAD", payloadString)

            val url = "${BuildConfig.SUPABASE_URL}/rest/v1/transactions?on_conflict=user_id,sms_hash"
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", BuildConfig.SUPABASE_KEY)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .post(payloadString.toRequestBody("application/json".toMediaTypeOrNull()))
                .build()

            client.newCall(request).execute().use { response ->
                val responseCode = response.code
                
                // 3. Log Response Code
                Log.d("SYNC_RESPONSE", "Code: $responseCode")
                
                if (!response.isSuccessful) {
                    // 4. Log Error Body if response >= 400
                    val errorBody = response.body?.string() ?: "null error body"
                    Log.e("SYNC_ERROR", errorBody)
                    return false
                }
                
                return true
            }
        } catch (e: Exception) {
            Log.e("SYNC_CRASH", "Exception during push [Payload: $payloadString]: ${e.message}", e)
            return false
        }
    }

    companion object {
        private const val TAG = "TxnSyncWorker"
    }
}
