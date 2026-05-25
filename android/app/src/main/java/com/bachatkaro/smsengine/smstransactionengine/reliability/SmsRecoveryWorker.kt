package com.bachatkaro.smsengine.smstransactionengine.reliability

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.bachatkaro.smsengine.smstransactionengine.engine.SmsTransactionEngine
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class SmsRecoveryWorker(
    appContext: Context,
    params: WorkerParameters
) : Worker(appContext, params) {

    private val TAG = "SmsRecoveryWorker"

    override fun doWork(): Result {
        SmsEngineLogger.i(TAG, "Periodic SMS recovery started")

        if (ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            SmsEngineLogger.w(TAG, "READ_SMS not granted - skipping recovery")
            return Result.success()
        }

        return try {
            recoverMissedSms()
            Result.success()
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Recovery worker failed: ${ex.message}", ex)
            Result.retry()
        }
    }

    private fun recoverMissedSms() {
        try {
            val engine = SmsTransactionEngine.getInstance(applicationContext)
            val lastProcessedTimestamp = engine.currentLiveWatermark()

            val cursor = try {
                applicationContext.contentResolver.query(
                    Telephony.Sms.Inbox.CONTENT_URI,
                    arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
                    "${Telephony.Sms.DATE} > ?",
                    arrayOf(lastProcessedTimestamp.toString()),
                    "${Telephony.Sms.DATE} ASC"
                )
            } catch (ex: Exception) {
                SmsEngineLogger.e(TAG, "Inbox query failed during recovery", ex)
                null
            } ?: run {
                SmsEngineLogger.w(TAG, "Inbox query returned null cursor")
                return
            }

            var processed = 0
            cursor.use {
                val colAddress = it.getColumnIndex(Telephony.Sms.ADDRESS)
                val colBody = it.getColumnIndex(Telephony.Sms.BODY)
                val colDate = it.getColumnIndex(Telephony.Sms.DATE)

                if (colAddress < 0 || colBody < 0 || colDate < 0) {
                    SmsEngineLogger.w(TAG, "Recovery cursor missing required columns")
                    return
                }

                while (it.moveToNext()) {
                    val sender = try { it.getString(colAddress) } catch (_: Exception) { null } ?: continue
                    val body = try { it.getString(colBody) } catch (_: Exception) { null } ?: continue
                    val timestamp = try { it.getLong(colDate) } catch (_: Exception) { continue }
                    try {
                        engine.process(sender, body, timestamp)
                        processed++
                    } catch (ex: Exception) {
                        SmsEngineLogger.e(TAG, "Failed recovering SMS during worker processing", ex)
                    }
                }
            }

            SmsEngineLogger.i(TAG, "Periodic SMS recovery finished processed=$processed")
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "recoverMissedSms failed unexpectedly", ex)
        }
    }
}
