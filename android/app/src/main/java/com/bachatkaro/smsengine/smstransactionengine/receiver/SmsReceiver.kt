package com.bachatkaro.smsengine.smstransactionengine.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.os.SystemClock
import com.bachatkaro.smsengine.smstransactionengine.engine.SmsTransactionEngine
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException

/**
 * SmsReceiver
 * ───────────
 * BroadcastReceiver that intercepts incoming SMS and routes them through
 * the SmsTransactionEngine pipeline.
 *
 * ── Threading ──────────────────────────────────────────────────────────
 * onReceive() is always called on the main thread by the Android runtime.
 * We use goAsync() to immediately release the main thread back to the
 * system, then do all work (filtering, parsing, SQLite writes) on a
 * dedicated single-background thread.
 *
 * Why a single-thread executor (not a pool)?
 *   • Transactions must be processed one at a time to avoid duplicate-check
 *     race conditions between concurrent SQLite reads and writes.
 *   • A single thread naturally serialises delivery guaranteeing ordered
 *     processing even if two SMS arrive in rapid succession.
 *   • No thread-count explosion on cheap ₹5000 Android devices.
 *
 * The 10-second BroadcastReceiver timeout starts from onReceive().
 * Our pipeline (regex + SQLite) completes in < 50 ms under normal load,
 * so we are well within budget.  If storage I/O degrades catastrophically,
 * pendingResult.finish() is still called inside the finally{} block.
 *
 * ── Multi-part SMS ordering ────────────────────────────────────────────
 * Previously: parts.joinToString("") { it.messageBody ?: "" }
 * This joined parts in broadcast-arrival order, which is NOT guaranteed
 * to match the UDH sequence numbers on all carrier configurations.
 *
 * Now: SmsAssembler.fromIntent() parses the raw PDU bytes, extracts the
 * UDH concatenation header (ref number + sequence number), groups parts
 * by (sender + refNumber), sorts by sequence number, then concatenates.
 * Single-part SMS (no UDH) are handled identically to before.
 *
 * ── Crash safety ───────────────────────────────────────────────────────
 * • Null context / null intent: guarded before goAsync()
 * • getMessagesFromIntent failure: caught; SmsAssembler has its own fallback
 * • Engine pipeline exception: caught per-message; processing continues
 * • Executor rejected (shutdown): caught; logs warning, no crash
 * • pendingResult.finish(): always called in finally{}
 */
class SmsReceiver : BroadcastReceiver() {

    private val TAG = "SmsReceiver"

    override fun onReceive(context: Context?, intent: Intent?) {
        // ── Null guards (must happen before goAsync()) ──────────────────
        if (context == null) {
            android.util.Log.e(TAG, "onReceive: context is null — aborting")
            return
        }
        if (intent == null) {
            SmsEngineLogger.w(TAG, "onReceive: intent is null — ignoring")
            return
        }
        
        // ✅ MANDATORY LOG: SMS_RECEIVED_TRIGGER
        android.util.Log.d("SMS_ENGINE", "Receiver Triggered: " + intent.getAction());

        val action = intent.action
        if (action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION && 
            action != Telephony.Sms.Intents.SMS_DELIVER_ACTION) {
            SmsEngineLogger.d(TAG, "Ignoring unknown action: $action")
            return
        }

        // ── Capture a PendingResult BEFORE returning from onReceive() ───
        // goAsync() tells the system "I'm not done yet — don't kill my process."
        // We MUST call pendingResult.finish() when done, or the system
        // will ANR / force-stop the app after 10 seconds.
        val pendingResult = goAsync()

        try {
            EXECUTOR.execute {
                try {
                    processIntent(context.applicationContext, intent)
                } catch (ex: Exception) {
                    SmsEngineLogger.e(TAG, "Uncaught error in background processing: ${ex.message}", ex)
                } finally {
                    // Always release — even if we crashed half-way through
                    try { pendingResult.finish() }
                    catch (_: Exception) { /* already finished or system reclaimed */ }
                }
            }
        } catch (ex: RejectedExecutionException) {
            // Executor was shut down (should not happen in normal operation).
            SmsEngineLogger.e(TAG, "Executor rejected task — finishing immediately", ex)
            try { pendingResult.finish() } catch (_: Exception) {}
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Failed to submit task to executor: ${ex.message}", ex)
            try { pendingResult.finish() } catch (_: Exception) {}
        }
    }

    // ─── Background processing ────────────────────────────────────────────

    private fun processIntent(context: Context, intent: Intent) {
        SmsEngineLogger.i(TAG, "SMS_RECEIVED — assembling PDUs on background thread")

        // SmsAssembler handles:
        //   • Raw PDU extraction from intent extras
        //   • UDH-based grouping (sender + concatenation reference number)
        //   • Sequence-number-based sorting within each group
        //   • Body concatenation in correct order
        //   • Fallback to getMessagesFromIntent() if raw PDUs unavailable
        val assembled = try {
            SmsAssembler.fromIntent(intent)
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "SmsAssembler.fromIntent failed: ${ex.message}", ex)
            return
        }

        if (assembled.isEmpty()) {
            SmsEngineLogger.w(TAG, "No assembled messages produced from intent")
            return
        }

        SmsEngineLogger.d(TAG, "Assembled ${assembled.size} logical SMS from broadcast")

        val engine = SmsTransactionEngine.getInstance(context)

        for (sms in assembled) {
            try {
                if (sms.body.isBlank()) {
                    SmsEngineLogger.w(TAG, "Blank body for sender='${sms.sender}' — skipping")
                    continue
                }
                if (shouldDebounce(sms.sender, sms.body, sms.timestamp)) {
                    SmsEngineLogger.d(TAG, "Receiver debounce skipped duplicate broadcast")
                    continue
                }

                SmsEngineLogger.d(TAG,
                    "Processing sender='${sms.sender}' parts=${sms.partCount} " +
                    "bodyLen=${sms.body.length}"
                )

                val result = engine.process(sms.sender, sms.body, sms.timestamp)
                SmsEngineLogger.i(TAG, "Pipeline result for '${sms.sender}': ${result::class.simpleName}")

            } catch (ex: Exception) {
                // Per-message catch: log and continue with remaining messages
                SmsEngineLogger.e(TAG, "Error processing SMS from '${sms.sender}': ${ex.message}", ex)
            }
        }
    }

    // ─── Singleton executor ───────────────────────────────────────────────

    companion object {
        private const val DEBOUNCE_WINDOW_MS = 2_000L
        private val recentDispatches = HashMap<String, Long>()

        /**
         * Single-thread executor shared across all BroadcastReceiver instances.
         *
         * Single-thread rationale:
         *   1. Serialises all SMS processing → no duplicate-check race conditions.
         *   2. SQLite writes are naturally ordered.
         *   3. Keeps memory/CPU footprint minimal on low-end devices.
         *
         * The thread is daemon-backed so it does not prevent JVM/process shutdown.
         */
        private val EXECUTOR = Executors.newSingleThreadExecutor { runnable ->
            Thread(runnable, "SmsEngine-Worker").also { it.isDaemon = true }
        }

        @Synchronized
        private fun shouldDebounce(sender: String, body: String, timestamp: Long): Boolean {
            val now = SystemClock.elapsedRealtime()
            val key = "$sender|$body|$timestamp"
            val previous = recentDispatches[key]

            recentDispatches.entries.removeAll { now - it.value > DEBOUNCE_WINDOW_MS }
            recentDispatches[key] = now

            return previous != null && (now - previous) <= DEBOUNCE_WINDOW_MS
        }
    }
}
