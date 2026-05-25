package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.math.RoundingMode

object SmartScoringEngine {

    private const val TAG = "SmartScoringEngine"
    private const val ACCEPT_THRESHOLD = 7

    private val AMOUNT_REGEX = Regex(
        """(?ix)(?<![A-Za-z0-9])(₹|Rs\.?|INR|USD|EUR|GBP|\$|€|£)\s*(\d[\d,]*(?:\.\d{1,2})?)|(?<![A-Za-z0-9])(\d[\d,]*(?:\.\d{1,2})?)\s*(INR|USD|EUR|GBP)(?![A-Za-z0-9])"""
    )

    private val DEBIT_KEYWORDS = Regex(
        """(?ix)\b(debited|dr\.?|spent|deducted|sent|withdrawn|purchased|purchase|paid|payment(?:\s+of)?|transferred?)\b"""
    )

    private val CREDIT_KEYWORDS = Regex(
        """(?ix)\b(credited|cr\.?|received|deposited|deposit|refund(?:ed)?|reversed?)\b"""
    )

    private val FINANCIAL_CONTEXT = Regex(
        """(?ix)\b(a/?c|acct|account|upi|card|vpa|ref(?:erence)?|imps|neft|rtgs|iban|swift|bic|sepa|ach|wire|routing|sort\s*code|paypal|stripe)\b"""
    )

    private val REFERENCE_REGEX = Regex(
        """(?ix)\b(upi\s*ref(?:erence)?(?:\s*no\.?)?|ref(?:erence)?\s*no\.?|ref\s*id|txn\s*(?:id|no\.?|ref)|transaction\s*id|trxn\s*id|imps\s*ref|neft\s*ref|rrn)\b"""
    )

    private val CURRENCY_REGEX = Regex("""(?ix)(₹|Rs\.?|INR|USD|EUR|GBP|\$|€|£)\b""")

    private val OTP_REGEX = Regex(
        """(?ix)\b(otp|one[- ]time[- ]pass|verification[- ]code|auth(?:entication)?[- ]code|do\s+not\s+share|never\s+share|login\s+attempt)\b"""
    )

    private val OFFER_REGEX = Regex(
        """(?ix)\b(cashback|offer|discount|save|pre[- ]approved|exclusive\s+offer)\b"""
    )

    private val MARKETING_REGEX = Regex(
        """(?ix)\b(marketing|unsubscribe|click\s+here|insurance\s+offer|loan\s+offer|credit\s+limit)\b"""
    )

    data class ScoringResult(
        val accepted: Boolean,
        val score: Int,
        val amountPaise: Long = 0L,
        val currency: String = "",
        val type: TransactionType = TransactionType.UNKNOWN,
        val financialContext: String = "",
        val category: String = "Others",
        val detail: String = ""
    )

    fun evaluate(sender: String, body: String): ScoringResult {
        return try {
            doEvaluate(sender, body)
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "evaluate() failed: ${ex.message}", ex)
            ScoringResult(false, Int.MIN_VALUE, detail = "Exception: ${ex.javaClass.simpleName}")
        }
    }

    private fun doEvaluate(sender: String, body: String): ScoringResult {
        if (!TransactionFilter.isRecognizedFinancialSender(sender, body)) {
            return ScoringResult(false, Int.MIN_VALUE, detail = "sender not recognized")
        }

        var score = 0
        val reasons = mutableListOf<String>()

        // Use the new advanced extractor
        val extraction = SmsExtractor.extract(body)
        val amountPaise = extraction.amountPaise
        val currency = extraction.currency
        val type = extraction.type

        if (amountPaise > 0L) {
            score += 3
            reasons += "amount"
        }

        if (type != TransactionType.UNKNOWN) {
            score += 3
            reasons += "type"
        }

        val context = FINANCIAL_CONTEXT.find(body)?.value.orEmpty()
        if (context.isNotBlank()) {
            score += 2
            reasons += "context"
        }

        if (REFERENCE_REGEX.containsMatchIn(body)) {
            score += 2
            reasons += "reference"
        }

        if (currency.isNotBlank() || CURRENCY_REGEX.containsMatchIn(body)) {
            score += 1
            reasons += "currency"
        }

        if (OTP_REGEX.containsMatchIn(body)) {
            score -= 5
            reasons += "otp-penalty"
        }
        if (OFFER_REGEX.containsMatchIn(body)) {
            score -= 4
            reasons += "offer-penalty"
        }
        if (MARKETING_REGEX.containsMatchIn(body)) {
            score -= 3
            reasons += "marketing-penalty"
        }

        val accepted = score >= ACCEPT_THRESHOLD &&
            amountPaise > 0L &&
            type != TransactionType.UNKNOWN &&
            context.isNotBlank()

        SmsEngineLogger.i(TAG, "score=$score accepted=$accepted detail=${reasons.joinToString(",")} confidence=${extraction.confidence}")

        return ScoringResult(
            accepted = accepted,
            score = score,
            amountPaise = amountPaise,
            currency = currency,
            type = type,
            financialContext = context,
            category = extraction.category,
            detail = reasons.joinToString(",")
        )
    }

    private fun resolveType(body: String, debitPos: Int?, creditPos: Int?): TransactionType {
        return when {
            debitPos != null && creditPos == null -> TransactionType.DEBIT
            creditPos != null && debitPos == null -> TransactionType.CREDIT
            debitPos != null && creditPos != null -> if (debitPos < creditPos) TransactionType.DEBIT else TransactionType.CREDIT
            else -> TransactionType.UNKNOWN
        }
    }

    private fun parseMinorUnits(raw: String): Long {
        val normalized = raw.replace(",", "").trim()
        val decimal = normalized.toBigDecimalOrNull() ?: return 0L
        return try {
            decimal.setScale(2, RoundingMode.UNNECESSARY).movePointRight(2).longValueExact()
        } catch (_: Exception) {
            0L
        }
    }

    private fun resolveCurrency(token: String): String {
        return when (token.uppercase()) {
            "₹", "RS", "RS.", "INR" -> "INR"
            "$", "USD" -> "USD"
            "€", "EUR" -> "EUR"
            "£", "GBP" -> "GBP"
            else -> ""
        }
    }
}
