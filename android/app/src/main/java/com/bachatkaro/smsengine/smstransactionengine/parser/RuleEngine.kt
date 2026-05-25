package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.math.RoundingMode

object RuleEngine {

    private const val TAG = "RuleEngine"

    private val FINANCIAL_CONTEXT = Regex(
        """(?ix)\b(a/?c|acct|account|upi|card|vpa|ref(?:erence)?|imps|neft|rtgs|iban|swift|bic|sepa|ach|wire|routing|sort\s*code|paypal|stripe)\b"""
    )

    sealed class EvaluationResult {
        data class Accept(
            val amountPaise: Long,
            val currency: String,
            val type: TransactionType,
            val financialContext: String,
            val category: String = "Others"
        ) : EvaluationResult()

        data class Reject(
            val reason: RejectReason,
            val detail: String = ""
        ) : EvaluationResult()
    }

    enum class RejectReason {
        SENDER_NOT_WHITELISTED,
        CONTAINS_OTP_SIGNAL,
        CONTAINS_SPAM_SIGNAL,
        NO_AMOUNT_PATTERN,
        AMOUNT_NOT_PARSEABLE,
        NO_TRANSACTION_KEYWORD,
        NO_FINANCIAL_CONTEXT,
        AMOUNT_NOT_POSITIVE,
        TYPE_AMBIGUOUS,
        TYPE_UNKNOWN
    }

    fun evaluate(sender: String, body: String): EvaluationResult {
        return try {
            doEvaluate(sender, body)
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "evaluate() threw unexpectedly: ${ex.message}", ex)
            EvaluationResult.Reject(RejectReason.TYPE_UNKNOWN, "Exception: ${ex.javaClass.simpleName}")
        }
    }

    private fun doEvaluate(sender: String, body: String): EvaluationResult {
        SmsEngineLogger.d(TAG, "STEP1 classify sender='$sender'")

        val step1Reject = classifyStep1(sender, body)
        if (step1Reject != null) {
            SmsEngineLogger.d(TAG, "STEP1 REJECT reason=${step1Reject.reason} detail=${step1Reject.detail}")
            return step1Reject
        }
        SmsEngineLogger.d(TAG, "STEP1 PASS")

        // Use the new high-precision extractor
        val extraction = SmsExtractor.extract(body)
        
        if (extraction.amountPaise <= 0L) {
            return reject(RejectReason.NO_AMOUNT_PATTERN, "No valid amount detected")
        }

        if (extraction.type == TransactionType.UNKNOWN) {
            return reject(RejectReason.TYPE_UNKNOWN, "No debit/credit keyword found")
        }

        if (extraction.confidence < 0.7f) {
            return reject(RejectReason.TYPE_AMBIGUOUS, "Low confidence in extraction: ${extraction.confidence}")
        }

        val contextMatch = FINANCIAL_CONTEXT.find(body)
            ?: return reject(RejectReason.NO_FINANCIAL_CONTEXT, "No financial context token")

        SmsEngineLogger.i(
            TAG,
            "ACCEPT type=${extraction.type} amount=${extraction.amountPaise} currency=${extraction.currency} category=${extraction.category} context=${contextMatch.value} confidence=${extraction.confidence}"
        )

        return EvaluationResult.Accept(
            amountPaise = extraction.amountPaise,
            currency = extraction.currency,
            type = extraction.type,
            financialContext = contextMatch.value,
            category = extraction.category
        )
    }

    private fun classifyStep1(sender: String, body: String): EvaluationResult.Reject? {
        val filterResult = TransactionFilter.classify(sender, body) ?: return null
        val reason = filterResult.first
        val detail = filterResult.second
        return EvaluationResult.Reject(reason, detail)
    }

    private fun reject(reason: RejectReason, detail: String) =
        EvaluationResult.Reject(reason, detail)
}
