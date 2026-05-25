package com.bachatkaro.smsengine.smstransactionengine.engine

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class HistoricalSmsImporter(private val context: Context) {

    private val TAG = "HistoricalSmsImporter"
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    data class ImportResult(
        val total: Int = 0,
        val saved: Int = 0,
        val skipped: Int = 0,
        val filtered: Int = 0,
        val failed: Int = 0
    )

    @Synchronized
    fun importAll(
        maxMessages: Int = 1000,
        lookBackDays: Int = 30,
        onProgress: ((Int, Int) -> Unit)? = null
    ): ImportResult {
        SmsEngineLogger.i(TAG, "importAll() max=$maxMessages lookBack=${lookBackDays}d")

        if (isHistoricalImportDone()) {
            SmsEngineLogger.i(TAG, "Historical import already completed - skipping")
            return ImportResult()
        }
        if (importInProgress) {
            SmsEngineLogger.i(TAG, "Historical import already in progress - skipping")
            return ImportResult()
        }
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            SmsEngineLogger.w(TAG, "READ_SMS permission not granted - aborting import")
            return ImportResult()
        }

        importInProgress = true
        return try {
            doImport(maxMessages, lookBackDays, onProgress).also {
                SmsTransactionEngine.getInstance(context).advanceLiveWatermark(System.currentTimeMillis())
                markHistoricalImportDone()
            }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "importAll failed unexpectedly", ex)
            ImportResult()
        } finally {
            importInProgress = false
        }
    }

    private fun doImport(
        maxMessages: Int,
        lookBackDays: Int,
        onProgress: ((Int, Int) -> Unit)?
    ): ImportResult {
        val engine = SmsTransactionEngine.getInstance(context)
        val inboxUri = Telephony.Sms.Inbox.CONTENT_URI
        val cutoffMs =
            if (lookBackDays > 0) System.currentTimeMillis() - (lookBackDays.toLong() * 86_400_000L) else 0L
        val selection = if (cutoffMs > 0) "${Telephony.Sms.DATE} >= ?" else null
        val selectionArgs = if (cutoffMs > 0) arrayOf(cutoffMs.toString()) else null
        val sortOrder = if (maxMessages > 0) {
            "${Telephony.Sms.DATE} DESC LIMIT $maxMessages"
        } else {
            "${Telephony.Sms.DATE} DESC"
        }

        val cursor = try {
            context.contentResolver.query(
                inboxUri,
                arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
                selection,
                selectionArgs,
                sortOrder
            )
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "ContentResolver.query failed: ${ex.message}", ex)
            return ImportResult()
        }

        if (cursor == null) {
            SmsEngineLogger.w(TAG, "Cursor is null - inbox not accessible")
            return ImportResult()
        }

        var saved = 0
        var skipped = 0
        var filtered = 0
        var failed = 0
        var done = 0

        cursor.use {
            val colAddress = it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
            val colBody = it.getColumnIndexOrThrow(Telephony.Sms.BODY)
            val colDate = it.getColumnIndexOrThrow(Telephony.Sms.DATE)

            while (it.moveToNext()) {
                try {
                    val sender = it.getString(colAddress) ?: continue
                    val body = it.getString(colBody) ?: continue
                    val timestamp = it.getLong(colDate)

                    when (engine.processHistorical(sender, body, timestamp)) {
                        is SmsTransactionEngine.ProcessResult.Saved -> saved++
                        is SmsTransactionEngine.ProcessResult.Duplicate -> skipped++
                        is SmsTransactionEngine.ProcessResult.OldMessageSkipped -> skipped++
                        is SmsTransactionEngine.ProcessResult.Filtered -> filtered++
                        is SmsTransactionEngine.ProcessResult.ParseFailed,
                        is SmsTransactionEngine.ProcessResult.StorageError,
                        is SmsTransactionEngine.ProcessResult.Error -> failed++
                    }
                } catch (ex: Exception) {
                    SmsEngineLogger.w(TAG, "Row error at position $done: ${ex.message}")
                    failed++
                }

                done++
                if (done % 25 == 0) {
                    onProgress?.invoke(done, -1)
                    SmsEngineLogger.d(
                        TAG,
                        "Progress: done=$done saved=$saved filtered=$filtered skipped=$skipped"
                    )
                }
            }
        }

        onProgress?.invoke(done, done)
        val result = ImportResult(done, saved, skipped, filtered, failed)
        SmsEngineLogger.i(
            TAG,
            "Import complete: total=$done saved=$saved skipped=$skipped filtered=$filtered failed=$failed"
        )
        return result
    }

    fun isHistoricalImportDone(): Boolean =
        prefs.getBoolean(KEY_HISTORICAL_IMPORT_DONE, false)

    private fun markHistoricalImportDone() {
        prefs.edit().putBoolean(KEY_HISTORICAL_IMPORT_DONE, true).apply()
        SmsEngineLogger.i(TAG, "historical_import_done = true")
    }

    companion object {
        private const val PREFS_NAME = "sms_engine_prefs"
        private const val KEY_HISTORICAL_IMPORT_DONE = "historical_import_done"
        @Volatile private var importInProgress = false
    }
}
