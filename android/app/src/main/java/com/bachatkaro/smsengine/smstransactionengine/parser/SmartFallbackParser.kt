package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * SmartFallbackParser
 * ───────────────────
 * High-recall fallback parser for SMS formats that bypass the primary RuleEngine.
 * Designed to handle Dr/Cr notations, UPI multiline, and unknown sender patterns.
 */
object SmartFallbackParser {

    private const val TAG = "SmartFallback"

    data class FallbackResult(
        val amountPaise: Long,
        val type: TransactionType,
        val entity: String?,
        val confidence: Float
    )

    // Regex for amount extraction (supporting commas and decimals)
    private val AMOUNT_REGEX = Regex("""(?i)(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)""")
    
    // Entity extraction patterns
    private val ENTITY_TO_REGEX = Regex("""(?i)\bto\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,30}?)(\s+via|on|balance|\.|,|$)""")
    private val ENTITY_FROM_REGEX = Regex("""(?i)\bfrom\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,30}?)(\s+via|on|to|balance|\.|,|$)""")

    /**
     * Parse transaction details using fallback heuristics.
     */
    fun parse(normalizedBody: String): FallbackResult? {
        if (!isValidTransaction(normalizedBody)) return null

        val amountPaise = extractAmountPaise(normalizedBody) ?: return null
        val type = detectType(normalizedBody)
        val entity = extractEntity(normalizedBody)

        SmsEngineLogger.i(TAG, "[SMS_FALLBACK_PARSED] type=$type amt=$amountPaise entity='$entity'")

        return FallbackResult(
            amountPaise = amountPaise,
            type = type,
            entity = entity,
            confidence = 0.6f // Fallback has lower base confidence than primary
        )
    }

    /**
     * STEP 4 — SMART FILTER (FALLBACK ONLY)
     */
    private fun isValidTransaction(body: String): Boolean {
        // Hard Rejects
        val rejectKeywords = listOf("otp", "offer", "reward", "cashback", "recharge", "http", "www.")
        if (rejectKeywords.any { body.contains(it) }) return false

        // Mandatory presence of amount
        val hasAmount = AMOUNT_REGEX.containsMatchIn(body)
        if (!hasAmount) return false

        // Context check
        val contextKeywords = listOf("to", "from", "via", "@", "upi", "ref", "debited", "credited", "spent", "paid", "sent", "received")
        val hasContext = contextKeywords.any { body.contains(it) }
        
        // Reject purely balance messages (balance present but no txn context)
        val isBalanceOnly = body.contains("balance") && !listOf("debited", "credited", "spent", "paid", "sent", "received").any { body.contains(it) }
        
        return hasContext && !isBalanceOnly
    }

    /**
     * STEP 2 — UNIVERSAL AMOUNT EXTRACTOR
     */
    private fun extractAmountPaise(body: String): Long? {
        val match = AMOUNT_REGEX.find(body) ?: return null
        val raw = match.groupValues[1].replace(",", "")
        return try {
            BigDecimal(raw)
                .setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .toLong()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * STEP 3 — TYPE DETECTION
     */
    private fun detectType(body: String): TransactionType {
        val debitKeywords = listOf("debited", "spent", "paid", "sent", "withdrawn")
        val creditKeywords = listOf("credited", "received", "deposited", "deposit")

        val hasDebit = debitKeywords.any { body.contains(it) }
        val hasCredit = creditKeywords.any { body.contains(it) }

        return when {
            // Prioritize DEBIT if both are present (Requirement Step 3)
            hasDebit -> TransactionType.DEBIT
            hasCredit -> TransactionType.CREDIT
            else -> TransactionType.UNKNOWN
        }
    }

    /**
     * STEP 5 — ENTITY EXTRACTION
     */
    private fun extractEntity(body: String): String? {
        val toMatch = ENTITY_TO_REGEX.find(body)?.groupValues?.get(1)?.trim()
        if (!toMatch.isNullOrBlank()) return toMatch

        val fromMatch = ENTITY_FROM_REGEX.find(body)?.groupValues?.get(1)?.trim()
        if (!fromMatch.isNullOrBlank()) return fromMatch

        return null
    }
}
