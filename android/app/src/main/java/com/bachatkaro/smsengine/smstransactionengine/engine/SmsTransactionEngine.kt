package com.bachatkaro.smsengine.smstransactionengine.engine

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.parser.RuleEngine
import com.bachatkaro.smsengine.smstransactionengine.parser.SmartFallbackParser
import com.bachatkaro.smsengine.smstransactionengine.parser.SmartScoringEngine
import com.bachatkaro.smsengine.smstransactionengine.parser.SmsExtractor
import com.bachatkaro.smsengine.smstransactionengine.parser.SmsParser
import com.bachatkaro.smsengine.smstransactionengine.parser.SmsClassifier
import com.bachatkaro.smsengine.smstransactionengine.parser.TransactionFilter
import com.bachatkaro.smsengine.smstransactionengine.repository.LocalTransactionRepository
import com.bachatkaro.smsengine.smstransactionengine.repository.TransactionRepository
import com.bachatkaro.smsengine.smstransactionengine.sync.TransactionSyncScheduler
import com.bachatkaro.smsengine.smstransactionengine.sync.SyncSessionStore
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class SmsTransactionEngine private constructor(context: Context) {

    private val TAG = "SmsEngine"
    private val appContext = context.applicationContext
    private val repository: TransactionRepository = LocalTransactionRepository(appContext)
    private val dao: TransactionDao = TransactionDao(appContext)
    private val prefs: SharedPreferences =
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    sealed class ProcessResult {
        data class Saved(val transaction: Transaction, val rowId: Long, val elapsedMs: Long) : ProcessResult()
        data class Duplicate(val smsHash: String) : ProcessResult()
        data class OldMessageSkipped(val timestamp: Long, val lastProcessedTimestamp: Long) : ProcessResult()
        data class Filtered(val reason: RuleEngine.RejectReason, val detail: String) : ProcessResult()
        data class ParseFailed(val sender: String) : ProcessResult()
        data class StorageError(val message: String) : ProcessResult()
        data class Error(val message: String, val cause: Throwable?) : ProcessResult()
    }

    interface Listener {
        fun onResult(result: ProcessResult)
    }

    @Volatile private var listener: Listener? = null
    fun setListener(l: Listener?) { listener = l }

    @Synchronized
    fun process(
        sender: String,
        body: String,
        timestamp: Long = System.currentTimeMillis()
    ): ProcessResult {
        Log.d("PARSER_DEBUG", "PARSER HIT")
        Log.d("SMS_BODY", body)
        val startNs = System.nanoTime()
        // ✅ MANDATORY LOG: SMS_RECEIVED
        SmsEngineLogger.d("SMS_RECEIVED", body)
        return try {
            runPipeline(sender, body.trim(), timestamp, startNs, enforceLiveTimestamp = true)
        } catch (ex: Exception) {
            val err = ProcessResult.Error("Uncaught pipeline exception", ex)
            SmsEngineLogger.e(TAG, "PIPELINE EXCEPTION: ${ex.message}", ex)
            notify(err)
            err
        }
    }

    @Synchronized
    fun processHistorical(
        sender: String,
        body: String,
        timestamp: Long
    ): ProcessResult {
        val startNs = System.nanoTime()
        // ✅ MANDATORY LOG: SMS_RECEIVED
        SmsEngineLogger.d("SMS_RECEIVED", "[HISTORICAL] $body")
        return try {
            runPipeline(sender, body.trim(), timestamp, startNs, enforceLiveTimestamp = false)
        } catch (ex: Exception) {
            val err = ProcessResult.Error("Uncaught historical pipeline exception", ex)
            SmsEngineLogger.e(TAG, "HISTORICAL PIPELINE EXCEPTION: ${ex.message}", ex)
            notify(err)
            err
        }
    }

    fun processBatch(messages: List<Triple<String, String, Long>>): List<ProcessResult> {
        SmsEngineLogger.i(TAG, "processBatch: ${messages.size} messages")
        return messages.map { (sender, body, ts) -> process(sender, body, ts) }
    }

    fun getAll(limit: Int = 0, userId: String? = null) = repository.getAll(limit, userId)
    fun getByType(type: TransactionType, userId: String? = null) = repository.getByType(type, userId)
    fun getByDateRange(from: Long, to: Long, userId: String? = null) = repository.getByDateRange(from, to, userId)
    fun count(userId: String? = null) = repository.count(userId)
    fun totalDebits(userId: String? = null) = repository.totalDebits(userId)
    fun totalCredits(userId: String? = null) = repository.totalCredits(userId)
    fun deleteAll() = repository.deleteAll()

    fun advanceLiveWatermark(timestamp: Long) {
        updateLastProcessedTimestamp(timestamp)
        SmsEngineLogger.i(TAG, "LIVE_WATERMARK_UPDATED timestamp=$timestamp")
    }

    fun currentLiveWatermark(): Long = getLastProcessedTimestamp()

    private fun runPipeline(
        sender: String,
        body: String,
        timestamp: Long,
        startNs: Long,
        enforceLiveTimestamp: Boolean
    ): ProcessResult {
        // 🛡️ PHASE 4: PROCESSED-STATE INGESTION
        // Timestamp watermark logic has been REMOVED.
        // We rely entirely on SQLite UNIQUE(sms_hash) to prevent duplicates.
        // This ensures carrier-delayed SMS or out-of-order deliveries are NEVER dropped.

        // ✅ MANDATORY LOG: SMS_PARSE
        SmsEngineLogger.d("SMS_PARSE", "Parsing started")

        // --- STEP 1: AI-GRADE CLASSIFICATION (SmsClassifier — temp 0.0) ---
        val classification = SmsClassifier.classify(sender, body)
        SmsEngineLogger.d("SMS_FILTER", "Classifier: ${classification.status} reason=${classification.ignoreReason ?: classification.fraudReason ?: "ok"}")

        when (classification.status) {
            SmsClassifier.ClassificationStatus.FRAUD -> {
                SmsEngineLogger.w(TAG, "FRAUD_DETECTED sender=$sender reason=${classification.fraudReason}")
                return ProcessResult.Filtered(RuleEngine.RejectReason.CONTAINS_SPAM_SIGNAL, "fraud: ${classification.fraudReason}")
                    .also { notify(it) }
            }
            SmsClassifier.ClassificationStatus.IGNORE -> {
                if (enforceLiveTimestamp) {
                    // Live mode: always respect classifier
                    return ProcessResult.Filtered(RuleEngine.RejectReason.CONTAINS_SPAM_SIGNAL, "ignore: ${classification.ignoreReason}")
                        .also { notify(it) }
                } else {
                    // Historical mode: TWO-TIER decision
                    //
                    // TIER 1 — HARD BLOCK: OTP / balance alert / marketing / URL
                    //   → REJECT unconditionally, even in historical mode.
                    //   These are NEVER real transactions regardless of age.
                    //
                    // TIER 2 — SOFT REJECT: unknown sender / low score / weak verb
                    //   → ALLOW bypass so genuine transactions from unlisted senders
                    //     (small banks, wallets) are not permanently lost.
                    if (TransactionFilter.isHardBlocked(body)) {
                        SmsEngineLogger.d(TAG,
                            "HISTORICAL_HARD_BLOCK: balance/OTP/marketing rejected sender='$sender' reason=${classification.ignoreReason}"
                        )
                        return ProcessResult.Filtered(RuleEngine.RejectReason.CONTAINS_SPAM_SIGNAL, "hard_block: ${classification.ignoreReason}")
                            .also { notify(it) }
                    }
                    // Soft reject — allow parse attempt for potential genuine transaction
                    SmsEngineLogger.d(TAG, "HISTORICAL_SOFT_BYPASS sender='$sender' reason=${classification.ignoreReason}")
                }
            }
            SmsClassifier.ClassificationStatus.ACCEPT -> {
                SmsEngineLogger.d(TAG, "CLASSIFIER_ACCEPT rail=${classification.rail} ref=${classification.referenceNo}")
            }
        }

        val t1 = System.nanoTime()
        val strictEvaluation = RuleEngine.evaluate(sender, body)
        val ruleMs = (System.nanoTime() - t1) / 1_000_000L

        val accept = when (strictEvaluation) {
            is RuleEngine.EvaluationResult.Accept -> {
                SmsEngineLogger.i("PARSE_SUCCESS", "Strict parse OK: ${strictEvaluation.amountPaise}p")
                strictEvaluation
            }
            is RuleEngine.EvaluationResult.Reject -> {
                SmsEngineLogger.d(
                    TAG,
                    "STRICT_REJECT reason=${strictEvaluation.reason} detail='${strictEvaluation.detail}' ruleMs=$ruleMs"
                )

                val scoringStart = System.nanoTime()
                val scoring = SmartScoringEngine.evaluate(sender, body)
                val scoringMs = (System.nanoTime() - scoringStart) / 1_000_000L

                if (!scoring.accepted) {
                    SmsEngineLogger.d(
                        TAG,
                        "SCORING_REJECT score=${scoring.score} detail='${scoring.detail}' scoringMs=$scoringMs"
                    )

                    // ✅ FIX: ENSURE FALLBACK PARSER ALWAYS RUNS IF PRIMARY FAILS
                    val normalized = com.bachatkaro.smsengine.smstransactionengine.util.SmsNormalizationHelper.normalize(body)
                    val fallback = SmartFallbackParser.parse(normalized)
                    if (fallback != null) {
                        SmsEngineLogger.i("PARSE_SUCCESS", "Fallback parse OK: ${fallback.amountPaise}p")
                        RuleEngine.EvaluationResult.Accept(
                            amountPaise = fallback.amountPaise,
                            currency = "INR",
                            type = fallback.type,
                            financialContext = fallback.entity ?: "fallback",
                            category = SmsExtractor.detectCategory(normalized)
                        )
                    } else {
                        if (!enforceLiveTimestamp) {
                            // Historical mode: RuleEngine, SmartScoringEngine, and SmartFallbackParser
                            // all rejected. Try SmsExtractor directly as last resort before giving up.
                            // normalized is already in scope from the SmartFallbackParser attempt above.
                            val extracted = SmsExtractor.extract(normalized)
                            if (extracted.amountPaise > 0L && extracted.type != TransactionType.UNKNOWN) {
                                SmsEngineLogger.i(
                                    "PARSE_SUCCESS",
                                    "HISTORICAL extractor last-resort OK: ${extracted.amountPaise}p type=${extracted.type}"
                                )
                                RuleEngine.EvaluationResult.Accept(
                                    amountPaise = extracted.amountPaise,
                                    currency = extracted.currency,
                                    type = extracted.type,
                                    financialContext = "extractor_fallback",
                                    category = extracted.category
                                )
                            } else {
                                SmsEngineLogger.w(
                                    "PARSE_FAILED",
                                    "HISTORICAL all parsers failed for sender=$sender — skipping"
                                )
                                return ProcessResult.Filtered(strictEvaluation.reason, strictEvaluation.detail).also { notify(it) }
                            }
                        } else {
                            SmsEngineLogger.w("PARSE_FAILED", "All parsers failed for sender=$sender")
                            return ProcessResult.Filtered(strictEvaluation.reason, strictEvaluation.detail).also { notify(it) }
                        }
                    }
                } else {
                    SmsEngineLogger.i("PARSE_SUCCESS", "Scoring parse OK: ${scoring.amountPaise}p")
                    RuleEngine.EvaluationResult.Accept(
                        amountPaise = scoring.amountPaise,
                        currency = scoring.currency,
                        type = scoring.type,
                        financialContext = scoring.financialContext,
                        category = scoring.category
                    )
                }
            }
        }

        val t2 = System.nanoTime()
        var tx = SmsParser.parseDetails(
            sender = sender,
            body = body,
            timestamp = timestamp,
            amountPaise = accept.amountPaise,
            currency = accept.currency,
            type = accept.type,
            category = accept.category
        )
        val parseMs = (System.nanoTime() - t2) / 1_000_000L

        if (tx == null) {
            SmsEngineLogger.w("PARSE_FAILED", "SmsParser.parseDetails returned null")
            return ProcessResult.ParseFailed(sender).also { notify(it) }
        }

        // Attach userId if available
        val session = SyncSessionStore.load(appContext)
        if (session != null && session.userId.isNotBlank()) {
            tx = tx.copy(userId = session.userId)
            SmsEngineLogger.d("SESSION_DEBUG", "Attached userId: ${session.userId}")
        } else {
            // 🛡️ PHASE 5: ORPHAN PROTECTION
            // DO NOT block local DB save if session missing? NO. 
            // We MUST block saving to prevent orphaned transactions corrupting the ledger.
            SmsEngineLogger.e("SESSION_MISSING", "No active session found natively. ORPHAN GUARD ACTIVE: Rejecting transaction.")
            return ProcessResult.StorageError("Orphan Guard: Session missing").also { notify(it) }
        }

        val t3 = System.nanoTime()
        
        // 🛡️ [ENTERPRISE IDENTITY HIERARCHY]
        // Priority 1 (ATI): Authoritative Reference Match
        if (tx.reference.isNotBlank() && repository.isReferenceDuplicate(tx.reference)) {
            SmsEngineLogger.i("DUPLICATE_DETECTED", "ref=${tx.reference} - ATI Match - SKIPPING")
            return ProcessResult.Duplicate(tx.smsHash).also { notify(it) }
        }

        // Priority 2 (HASH): Exact Body Match
        if (repository.isDuplicate(tx.smsHash)) {
            SmsEngineLogger.d("DUPLICATE_DETECTED", "hash=${tx.smsHash.take(12)} - HASH Match - SKIPPING")
            return ProcessResult.Duplicate(tx.smsHash).also { notify(it) }
        }

        // Priority 3 (CANONICAL): Structural Match (Minute-Level)
        if (tx.canonicalKey != null && dao.isCanonicalDuplicate(tx.canonicalKey)) {
            SmsEngineLogger.i("DUPLICATE_DETECTED", "canon=${tx.canonicalKey} - CANON Match - SKIPPING")
            return ProcessResult.Duplicate(tx.smsHash).also { notify(it) }
        }

        // 🛡️ [SSF-60 Fallback]
        // If none of the authoritative layers matched, perform a 60s window search.
        // If a transaction with same Amount/Sender/Type exists within ±60s, mark as POSSIBLE_DUPLICATE.
        val windowStart = tx.timestamp - 60_000
        val windowEnd = tx.timestamp + 60_000
        val sessionUserId = session?.userId
        
        // DAO method check for any close match (including tombstoned ones)
        val hasCloseMatch = dao.getByDateRange(windowStart, windowEnd, sessionUserId).any { existing ->
            existing.amount == tx.amount && 
            existing.type == tx.type && 
            existing.sender.equals(tx.sender, ignoreCase = true)
        }

        if (hasCloseMatch) {
            SmsEngineLogger.w("POSSIBLE_DUPLICATE", "Close match found for ${tx.amount} within 60s. Marking for review.")
            tx = tx.copy(isPossibleDuplicate = true)
        }

        val t4 = System.nanoTime()
        // ✅ MANDATORY LOG: DB_DEBUG (Saving)
        SmsEngineLogger.d("DB_DEBUG", "Saving to DB: hash=${tx.smsHash.take(12)}")

        val rowId: Long
        if (enforceLiveTimestamp) {
            // Live mode: use repository (strict validation enforced in insertAtomic)
            rowId = repository.insert(tx)
        } else {
            // Historical mode: use dao.insertHistoricalAtomic which relaxes
            // amount > 0 and type != UNKNOWN guards that block historical data.
            // Deduplication (CONFLICT_IGNORE on smsHash) is still enforced.
            rowId = dao.insertHistoricalAtomic(tx)
        }

        val insertMs = (System.nanoTime() - t4) / 1_000_000L
        val totalMs = (System.nanoTime() - startNs) / 1_000_000L

        val result: ProcessResult = when {
            rowId > 0L -> {
                if (enforceLiveTimestamp) {
                    updateLastProcessedTimestamp(timestamp)
                }
                // ✅ MANDATORY LOG: DB_DEBUG (Success)
                SmsEngineLogger.d("DB_DEBUG", "Saved successfully: rowId=$rowId")

                // ✅ MANDATORY LOG: SYNC_DEBUG
                SmsEngineLogger.d("SYNC_DEBUG", "Trigger sync")
                TransactionSyncScheduler.triggerImmediate(appContext)
                ProcessResult.Saved(tx.copy(id = rowId), rowId, totalMs)
            }
            rowId == 0L -> {
                SmsEngineLogger.d("DUPLICATE_DEBUG", "Atomic insert skipped duplicate")
                ProcessResult.Duplicate(tx.smsHash)
            }
            else -> {
                SmsEngineLogger.e("DB_SAVE", "SAVE_ERROR: insertAtomic returned -1")
                ProcessResult.StorageError("insertAtomic returned -1 for hash=${tx.smsHash.take(12)}")
            }
        }

        notify(result)
        return result
    }

    private fun notify(result: ProcessResult) {
        try {
            listener?.onResult(result)
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Listener.onResult threw: ${ex.message}", ex)
        }
    }

    private fun getLastProcessedTimestamp(): Long =
        prefs.getLong(KEY_LAST_PROCESSED_TS, 0L)

    private fun updateLastProcessedTimestamp(timestamp: Long) {
        val current = getLastProcessedTimestamp()
        if (timestamp > current) {
            prefs.edit().putLong(KEY_LAST_PROCESSED_TS, timestamp).apply()
        }
    }

    companion object {
        private const val PREFS_NAME = "sms_engine_prefs"
        private const val KEY_LAST_PROCESSED_TS = "last_processed_timestamp"

        @Volatile private var instance: SmsTransactionEngine? = null

        @JvmStatic
        fun getInstance(context: Context): SmsTransactionEngine =
            instance ?: synchronized(this) {
                instance ?: SmsTransactionEngine(context).also { instance = it }
            }
    }
}
