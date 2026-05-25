package com.bachatkaro.smsengine.smstransactionengine.reliability

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.util.concurrent.TimeUnit

object SmsRecoveryScheduler {

    private const val TAG = "SmsRecoveryScheduler"
    private const val WORK_NAME = "sms_recovery_worker"

    fun schedule(context: Context) {
        try {
            val request = PeriodicWorkRequestBuilder<SmsRecoveryWorker>(15, TimeUnit.MINUTES)
                .addTag(WORK_NAME)
                .build()

            WorkManager.getInstance(context.applicationContext)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)

            SmsEngineLogger.i(TAG, "Scheduled periodic SMS recovery worker")
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Failed to schedule recovery worker: ${ex.message}", ex)
        }
    }
}
