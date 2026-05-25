package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import com.bachatkaro.smsengine.smstransactionengine.util.SmsNormalizationHelper
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.regex.Pattern

/**
 * SmsExtractor
 * ────────────
 * Advanced extraction engine for Fintech-grade SMS parsing.
 * Focuses on high-accuracy amount extraction and noise filtering.
 * Updated for Indian bank SMS formats (Dr/Cr, UPI, mixed context).
 */
object SmsExtractor {

    private const val TAG = "SmsExtractor"

    data class ExtractionResult(
        val amountPaise: Long,
        val type: TransactionType,
        val currency: String,
        val confidence: Float,
        val rawAmount: String = "",
        val category: String = "Others"
    )

    // Regex for amount with currency symbols (Priority 1)
    private val CURRENCY_AMOUNT_REGEX = Regex(
        """(?i)(?:rs\.?|usd|eur|gbp|₹|\$|€|£)\s*[:\-]?\s*(\d[\d,]*(\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE
    )

    // Regex for amount followed by currency (Priority 1)
    private val AMOUNT_CURRENCY_REGEX = Regex(
        """(?i)(\d[\d,]*(\.\d{1,2})?)\s*(?:rs|usd|eur|gbp)""",
        RegexOption.IGNORE_CASE
    )

    // Generic number regex (Priority 3)
    private val GENERIC_NUMBER_REGEX = Regex(
        """(?i)(?:amt|amount|of|for)\s*[:\-]?\s*(\d[\d,]*(\.\d{1,2})?)"""
    )

    fun detectBankName(sender: String): String {
        val s = sender.uppercase()
        return when {
            s.contains("HDFCBK") || s.contains("HDFC") -> "HDFC Bank"
            s.contains("SBI") -> "SBI"
            s.contains("ICICI") -> "ICICI Bank"
            s.contains("AXIS") -> "Axis Bank"
            s.contains("KOTAK") -> "Kotak Bank"
            s.contains("PNB") -> "PNB"
            s.contains("BOB") -> "Bank of Baroda"
            s.contains("CANBNK") -> "Canara Bank"
            s.contains("IDFC") -> "IDFC First"
            s.contains("RBL") -> "RBL Bank"
            s.contains("YESBNK") -> "Yes Bank"
            s.contains("FEDBK") -> "Federal Bank"
            s.contains("UNIONB") -> "Union Bank"
            s.contains("INDUS") -> "IndusInd Bank"
            s.contains("PAYTM") || s.contains("PYTM") -> "Paytm"
            s.contains("PHONEPE") || s.contains("PPAY") -> "PhonePe"
            else -> "Unknown Bank"
        }
    }

    // Keywords that indicate a balance (should be ignored for transaction amount)
    private val BALANCE_KEYWORDS = listOf(
        "bal", "balance", "avl", "available", "closing", "current", "limit", "avlbal"
    )

    // Noise/OTP detection
    private val OTP_KEYWORDS = listOf("otp", "verification", "code", "secret")
    private val NOISE_KEYWORDS = listOf("ref", "id", "txn", "transaction", "no.", "number", "ending")

    fun extract(body: String): ExtractionResult {
        // CRITICAL: Early filter for non-transaction SMS (OTP, balance alerts, spam)
        if (!isRealTransactionSms(body)) {
            SmsEngineLogger.d(TAG, "BLOCKED: Not a real transaction SMS")
            return ExtractionResult(0L, TransactionType.UNKNOWN, "INR", 0f)
        }

        // HIGHLIGHT: STEP 2 — NORMALIZE MESSAGE BEFORE EXTRACTION
        val normalizedBody = SmsNormalizationHelper.normalize(body)
        
        // 1. Identify all number candidates
        val candidates = findAllCandidates(normalizedBody)
        
        if (candidates.isEmpty()) {
            return ExtractionResult(0L, TransactionType.UNKNOWN, "INR", 0f)
        }

        // 2. Filter out OTPs and ID-like numbers
        val filteredCandidates = filterNoise(candidates, normalizedBody)
        
        if (filteredCandidates.isEmpty()) {
            return ExtractionResult(0L, TransactionType.UNKNOWN, "INR", 0f)
        }

        // 3. Determine Transaction Type
        val type = detectType(normalizedBody)

        // 4. Select the best candidate
        val best = selectBestCandidate(filteredCandidates, normalizedBody, type)

        return ExtractionResult(
            amountPaise = best.amountPaise,
            type = type,
            currency = best.currency,
            confidence = calculateConfidence(best, normalizedBody, type),
            rawAmount = best.raw,
            category = detectCategory(normalizedBody)
        )
    }

    fun detectCategory(body: String): String {
        val text = body.uppercase()
        return when {
            text.contains("FASTAG") || text.contains("TOLL") -> "Toll"
            text.contains("MILK") || text.contains("KIRANA") || text.contains("GROCERY") || text.contains("BLINKIT") || text.contains("ZEPTO") || text.contains("SWIGGY INSTAMART") -> "Grocery"
            text.contains("ZOMATO") || text.contains("SWIGGY") || text.contains("DUNZO") || text.contains("RESTAURANT") || text.contains("CAFE") -> "Food"
            text.contains("UBER") || text.contains("OLA") || text.contains("RAPIDO") || text.contains("IRCTC") -> "Travel"
            text.contains("PETROL") || text.contains("HP") || text.contains("IOCL") || text.contains("BPCL") || text.contains("FUEL") -> "Fuel"
            text.contains("AMAZON") || text.contains("FLIPKART") || text.contains("MEESHO") || text.contains("MYNTRA") || text.contains("AJIO") -> "Shopping"
            text.contains("JIO") || text.contains("AIRTEL") || text.contains("VI") || text.contains("RECHARGE") || text.contains("BILL") || text.contains("ELECTRICITY") || text.contains("BROADBAND") -> "Bills"
            text.contains("SELF") || text.contains("OWN ACCOUNT") || text.contains("TO OWN A/C") -> "Self-Transfer"
            else -> "Others"
        }
    }

    data class Candidate(
        val raw: String,
        val amountPaise: Long,
        val currency: String,
        val start: Int,
        val end: Int,
        val hasCurrencySymbol: Boolean,
        var isBalance: Boolean = false
    )

    /**
     * HIGHLIGHT: Indian Amount Parser
     * Converts "1 lakh", "2 crore", "5 thousand" to BigDecimal (Rupees)
     */
    private fun parseIndianAmount(text: String): Long {
        val lower = text.lowercase()
        
        // Extract numeric value from text
        val number = Regex("""\d+""").find(lower)?.value?.toBigDecimalOrNull() ?: return 0L
        
        val amountInRupees = when {
            lower.contains("crore") -> number.multiply(BigDecimal(10000000))
            lower.contains("lakh") || lower.contains("lac") -> number.multiply(BigDecimal(100000))
            lower.contains("thousand") -> number.multiply(BigDecimal(1000))
            else -> BigDecimal.ZERO
        }

        return if (amountInRupees > BigDecimal.ZERO) convertToPaisa(amountInRupees) else 0L
    }

    private fun findAllCandidates(body: String): List<Candidate> {
        val list = mutableListOf<Candidate>()

        // HIGHLIGHT: PRIORITY 0 — Indian Number Words (lakh, crore, thousand)
        val indianAmount = parseIndianAmount(body)
        if (indianAmount > 0) {
            // Find the match position in text for consistency
            val matchRegex = Regex("""(\d+)\s*(crore|lakh|lac|thousand)""", RegexOption.IGNORE_CASE)
            val match = matchRegex.find(body)
            if (match != null) {
                list.add(Candidate(
                    raw = match.value,
                    amountPaise = indianAmount,
                    currency = "INR",
                    start = match.range.first,
                    end = match.range.last,
                    hasCurrencySymbol = false
                ))
                SmsEngineLogger.d(TAG, "Indian amount parsed: ${match.value} → ${indianAmount} paisa")
            }
        }

        // Find with symbols
        CURRENCY_AMOUNT_REGEX.findAll(body).forEach { match ->
            val symbol = match.groupValues[0].takeWhile { !it.isDigit() }.trim()
            val amountStr = match.groupValues[1]
            list.add(Candidate(
                raw = amountStr,
                amountPaise = parseAmount(amountStr),
                currency = resolveCurrency(symbol),
                start = match.range.first,
                end = match.range.last,
                hasCurrencySymbol = true
            ))
        }

        // Find with trailing currency
        AMOUNT_CURRENCY_REGEX.findAll(body).forEach { match ->
            val amountStr = match.groupValues[1]
            val symbol = match.groupValues[0].takeLastWhile { !it.isDigit() }.trim()
            list.add(Candidate(
                raw = amountStr,
                amountPaise = parseAmount(amountStr),
                currency = resolveCurrency(symbol),
                start = match.range.first,
                end = match.range.last,
                hasCurrencySymbol = true
            ))
        }

        // Find generic numbers if no currency matches yet
        if (list.isEmpty()) {
            GENERIC_NUMBER_REGEX.findAll(body).forEach { match ->
                val amountStr = match.groupValues[1]
                list.add(Candidate(
                    raw = amountStr,
                    amountPaise = parseAmount(amountStr),
                    currency = "INR", // Default
                    start = match.range.first,
                    end = match.range.last,
                    hasCurrencySymbol = false
                ))
            }
        }

        // Mark balance-like candidates
        list.forEach { it.isBalance = isBalanceContext(body, it.start) }

        return list
    }

    private fun filterNoise(candidates: List<Candidate>, body: String): List<Candidate> {
        return candidates.filter { cand ->
            // Skip very small numbers that aren't marked with currency
            if (!cand.hasCurrencySymbol && cand.amountPaise < 100) return@filter false

            // Skip potential OTPs (4-6 digit standalone numbers)
            if (!cand.hasCurrencySymbol && cand.raw.length in 4..6 && !cand.raw.contains(".")) {
                val context = body.substring(maxOf(0, cand.start - 20), minOf(body.length, cand.end + 20)).lowercase()
                if (OTP_KEYWORDS.any { context.contains(it) }) return@filter false
            }

            // Skip potential transaction IDs / Ref numbers
            val beforeContext = body.substring(maxOf(0, cand.start - 15), cand.start).lowercase()
            if (NOISE_KEYWORDS.any { beforeContext.contains(it) }) return@filter false

            true
        }
    }

    private fun selectBestCandidate(candidates: List<Candidate>, body: String, type: TransactionType): Candidate {
        // Priority 1: Has currency symbol AND not a balance
        val p1 = candidates.filter { it.hasCurrencySymbol && !it.isBalance }
        if (p1.isNotEmpty()) return p1.maxByOrNull { it.amountPaise }!!

        // Priority 2: Not a balance
        val p2 = candidates.filter { !it.isBalance }
        if (p2.isNotEmpty()) return p2.maxByOrNull { it.amountPaise }!!

        // Fallback: Pick the one that is likely NOT the balance (usually smaller than balance)
        if (candidates.size > 1) {
            val nonBalance = candidates.filter { !it.isBalance }
            if (nonBalance.isNotEmpty()) return nonBalance.first()
        }

        return candidates.maxByOrNull { it.amountPaise }!!
    }

    private fun isBalanceContext(body: String, start: Int): Boolean {
        val context = body.substring(maxOf(0, start - 30), start).lowercase()
        return BALANCE_KEYWORDS.any { context.contains(it) }
    }

    /**
     * HIGHLIGHT: STEP 3 — HANDLE MIXED TRANSACTION (CRITICAL)
     * PRIORITIZE "debited" (expense) if both are present.
     */
    private fun detectType(body: String): TransactionType {
        val lowercaseBody = body.lowercase()
        val debitKeywords = listOf("debited", "spent", "paid", "sent", "withdrawn")
        val creditKeywords = listOf("credited", "received", "deposited", "deposit")

        val hasDebit = debitKeywords.any { lowercaseBody.contains(it) }
        val hasCredit = creditKeywords.any { lowercaseBody.contains(it) }

        return when {
            // Prioritize DEBIT if both are present or only debit is present.
            hasDebit -> TransactionType.DEBIT
            hasCredit -> TransactionType.CREDIT
            else -> TransactionType.UNKNOWN
        }
    }

    /**
     * ✅ FIX: convertToPaisa — ALWAYS multiply by 100.
     *
     * Previous bug: amounts >= 1000 (whole integers) were returned as-is,
     * causing ₹19,416 to be stored as 19416 "paise" instead of 1941600 paise.
     * formatCurrency(19416) → 19416/100 = ₹194.16 ❌
     *
     * Root cause of the old logic: it incorrectly assumed that large integers
     * might "already be in paise". But this function ALWAYS receives rupee values
     * from SMS parsing — never paise. So always multiply by 100.
     *
     * Examples after fix:
     *   ₹1      → 100 paise  → formatCurrency(100)     = ₹1.00     ✅
     *   ₹100    → 10000      → formatCurrency(10000)   = ₹100.00   ✅
     *   ₹19416  → 1941600    → formatCurrency(1941600) = ₹19,416   ✅
     *   ₹1 lakh → 10000000  → formatCurrency(10000000)= ₹1,00,000 ✅
     */
    private fun convertToPaisa(amount: BigDecimal): Long {
        // 🔒 FINTECH RULE:
        // This is the ONLY place where rupees → paisa conversion happens.
        // Input is ALWAYS in rupees (from SMS text). ALWAYS multiply by 100.
        return amount.multiply(BigDecimal(100))
            .setScale(0, RoundingMode.HALF_UP)
            .toLong()
    }

    // HIGHLIGHT: ENHANCED AMOUNT PARSING (Decimal Safe + PAISA Correct)
    private fun parseAmount(raw: String): Long {
        val clean = raw.replace(",", "").trim()
        return try {
            val bd = BigDecimal(clean)
            // Ensure 2 decimal places, round HALF_UP
            val rounded = bd.setScale(2, RoundingMode.HALF_UP)

            // FINAL FIX: convert once only via convertToPaisa
            return convertToPaisa(rounded)
        } catch (e: Exception) {
            0L
        }
    }

    /**
     * Strict transaction intent filter - MUST contain real transaction keyword
     * Blocks OTP, balance alerts, spam, offers, etc.
     */
    private fun isRealTransactionSms(text: String): Boolean {
        val lower = text.lowercase()

        // HARD BLOCK — mirrors TransactionFilter.HARD_BLOCK (keep in sync)
        val blockPatterns = listOf(
            // OTP / codes
            "otp", "otp is", "otp for", "your otp",
            "one time password", "one-time password", "one time pin",
            "verification code", "secret code", "dynamic password",
            "do not share", "dont share", "not share",
            "ipin", "mpin", "cvv", "pin change",
            "cancellation code", "happiness code",
            "cancellation request", "your ticket no is",
            // Balance alerts
            "available bal", "avl bal", "avl balance", "avlbl bal",
            "available balance", "available limit",
            "as on yesterday", "bal as on", "balance as on",
            "yesterday's bal", "yesterday bal",
            "gone below minimum", "below minimum limit",
            "minimum limit of inr", "minimum balance",
            "low balance alert", "closing balance", "opening balance",
            "total bal:", "avlbl amt:",
            "cheques are subject to clearing",
            "for updated a/c bal", "balance alert",
            "bal is inr", "bal: inr", "bal inr",
            "insufficient balance", "your balance is",
            "balance is rs", "daily bal",
            // Bill reminders
            "bill alert", "new bill alert", "bill is due",
            "is due on", "due on", "payment due", "bill due",
            "minimum due", "outstanding amount", "unbilled amount",
            "emi due", "emi reminder", "emi is due", "is due tomorrow",
            "cred cash", "delayed payment", "late fees",
            "autopay", "auto debit on", "auto-debit",
            "standing instruction", "credit card statement",
            "ignore if paid", "payment reminder",
            // Declined / failed
            "is declined", "has been declined", "transaction declined",
            "payment declined", "payment failed", "transaction failed",
            "could not be processed", "crossed the domestic pos",
            "set your card limit", "exceeds limit",
            "not authorised", "authorization failed",
            // Card payment confirmations (not spending)
            "payment received for your", "received for your bobcard",
            "received for your credit card", "received towards your",
            "card bill payment", "visit bobcard",
            "bobcard.io", "bobcard app", "online card account",
            // AMC / warranty / service
            "amc/ew no", "amc ew no", "warranty created",
            "service created", "created for your",
            "track the ticket", "service ticket", "ticket raised",
            // Marketing
            "loan offer", "personal loan offer", "home loan offer",
            "no collateral loan", "loan against property",
            "tenure of upto", "get funds in your bank",
            "pre-approved", "pre approved",
            "apply now", "book now", "shop now", "offer valid",
            "exclusive offer", "special offer",
            "congratulation", "congratulations",
            "you have won", "you've won",
            "lucky draw", "lucky winner", "winner",
            "prize", "gift card", "voucher",
            "cashback offer", "earn cashback", "reward points",
            "loyalty points", "bonus points", "redeem",
            "discount", "% off", "world cup", "big screen",
            "dth box", "enjoy up to", "save rs.", "save upto",
            "safe second account", "moneycontrol",
            // KYC / Regulatory
            "ckyc", "central kyc", "ckycrr",
            "kyc update", "kyc pending", "kyc required",
            "link aadhaar", "link pan",
            "income tax", "itr", "as per rbi",
            // Insurance / Investment
            "insurance premium", "life insurance", "mutual fund",
            "sip amount", "invest now", "credit score",
            "cibil score", "cibil report",
            // Utility confirmations (user requested to ignore)
            "uppcl", "bescom", "msedcl", "bses",
            // Self-Transfers (Ignored as per requirements)
            "to own account", "to self", "self transfer", "to own a/c",
            // URLs / Links
            "http://", "https://", "https", "http",
            "www.", "click here", ".io/", ".io ",
            "acl.cc", "bit.ly", "goo.gl", "mm7.in",
            "idfcfs.in", "cred.club", "hdfcbk.io",
            // Misc
            "whatsapp banking", "missed call",
            "customer care", "helpline"
        )
        if (blockPatterns.any { lower.contains(it) }) return false

        // MUST contain real transaction intent keyword
        val hasTxnKeyword = listOf(
            "debited", "credited", "sent", "paid", "received",
            "withdrawn", "deposit", "deposited", "deducted", "transferred"
        ).any { lower.contains(it) }

        // MUST also contain a currency marker
        val hasCurrency = listOf("₹", "rs.", "rs ", "inr").any { lower.contains(it) }

        return hasTxnKeyword && hasCurrency
    }

    private fun resolveCurrency(symbol: String): String {
        return when (symbol.uppercase().trim()) {
            "₹", "RS", "RS.", "INR" -> "INR"
            "$", "USD" -> "USD"
            "€", "EUR" -> "EUR"
            "£", "GBP" -> "GBP"
            else -> "INR"
        }
    }

    private fun calculateConfidence(best: Candidate, body: String, type: TransactionType): Float {
        var confidence = 0.5f
        if (best.hasCurrencySymbol) confidence += 0.2f
        if (!best.isBalance) confidence += 0.1f
        if (type != TransactionType.UNKNOWN) confidence += 0.2f
        return confidence.coerceAtMost(1.0f)
    }
}
