package com.bachatkaro.smsengine.smstransactionengine.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.util.concurrent.TimeUnit

/**
 * TransactionSyncScheduler
 * ────────────────────────
 * Production-grade WorkManager orchestration for background sync.
 * Enforces network connectivity and exponential backoff.
 */
object TransactionSyncScheduler {

    private const val TAG = "SyncScheduler"
    private const val PERIODIC_WORK_NAME = "transaction_sync_periodic"
    private const val IMMEDIATE_WORK_NAME = "transaction_sync_immediate"

    private val networkConstraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * Schedules a periodic background sync (every 15 min).
     * Maintains data consistency when app is closed.
     */
    @JvmStatic
    fun schedulePeriodic(context: Context) {
        try {
            SmsEngineLogger.i(TAG, "SYNC_START: Scheduling periodic sync worker (15 min)")
            val request = PeriodicWorkRequestBuilder<TransactionSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(networkConstraints)
                .addTag(PERIODIC_WORK_NAME)
                .build()

            WorkManager.getInstance(context.applicationContext)
                .enqueueUniquePeriodicWork(
                    PERIODIC_WORK_NAME, 
                    ExistingPeriodicWorkPolicy.KEEP, 
                    request
                )
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Failed to schedule periodic sync: ${ex.message}", ex)
        }
    }

    /**
     * Triggers an immediate sync pass.
     * Called after new local insertions to ensure low latency.
     */
    @JvmStatic
    fun triggerImmediate(context: Context) {
        try {
            SmsEngineLogger.i(TAG, "SYNC_START: Triggering immediate sync worker")
            val request = OneTimeWorkRequestBuilder<TransactionSyncWorker>()
                .setConstraints(networkConstraints)
                .addTag(IMMEDIATE_WORK_NAME)
                .build()

            WorkManager.getInstance(context.applicationContext)
                .enqueueUniqueWork(
                    IMMEDIATE_WORK_NAME, 
                    ExistingWorkPolicy.REPLACE, 
                    request
                )
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Failed to trigger immediate sync: ${ex.message}", ex)
        }
    }
}
