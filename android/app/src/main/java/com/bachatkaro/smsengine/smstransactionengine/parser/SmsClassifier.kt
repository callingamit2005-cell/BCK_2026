package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import com.bachatkaro.smsengine.smstransactionengine.util.SmsNormalizationHelper
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * SmsClassifier — Production-Grade Indian Banking SMS Classification Engine
 * ──────────────────────────────────────────────────────────────────────────
 * Implements merged logic from two research-grade classification prompts.
 *
 * Classification Output:
 *   ACCEPT  → Real settled financial transaction (debit/credit/withdrawal)
 *   IGNORE  → Noise (balance alert, OTP, marketing, reminder, admin)
 *   FRAUD   → Suspicious sender or phishing attempt
 *
 * For ACCEPT messages, extracts structured data:
 *   - type        : DEBIT / CREDIT
 *   - amountPaise : amount in paisa (integer)
 *   - accountMask : last 4 digits of account/card
 *   - merchant    : payee / merchant name
 *   - rail        : UPI / CARD / ATM / NEFT / IMPS / RTGS / BANK_TRANSFER
 *   - referenceNo : UTR / RRN / Ref number (for deduplication)
 *   - categoryHint: Food / Travel / Shopping / etc.
 *
 * Temperature equivalent: 0.0 — fully deterministic rule-based.
 * No API calls. Fully offline. No hallucination possible.
 */
object SmsClassifier {

    private const val TAG = "SmsClassifier"

    // ─── Output Models ────────────────────────────────────────────────────

    enum class ClassificationStatus { ACCEPT, IGNORE, FRAUD }

    data class ClassificationResult(
        val status: ClassificationStatus,
        val type: TransactionType = TransactionType.UNKNOWN,
        val amountPaise: Long = 0L,
        val currency: String = "INR",
        val accountMask: String? = null,
        val merchantName: String? = null,
        val rail: PaymentRail = PaymentRail.UNKNOWN,
        val referenceNo: String? = null,
        val categoryHint: String = "Others",
        val ignoreReason: String? = null,
        val fraudReason: String? = null
    )

    enum class PaymentRail {
        UPI, CARD, ATM, NEFT, IMPS, RTGS, BANK_TRANSFER, WALLET, UNKNOWN
    }

    // ─── Settlement Verbs (past tense = completed transaction) ────────────
    // Prompt Rule: "ACCEPT only if it confirms a SETTLED movement of funds"
    private val DEBIT_VERBS = listOf(
        "debited", "deducted", "withdrawn", "spent",
        "paid", "sent", "used", "charged",
        "transferred to", "payment of", "purchase",
        "dr ", "a/c dr", "a/c debited", "account debited",
        "transaction of", "txn of"
    )
    private val CREDIT_VERBS = listOf(
        "credited", "received", "deposited", "added",
        "refunded", "reversed", "cashback credited",
        "cr ", "a/c cr", "a/c credited", "account credited",
        "salary credited", "money added"
    )

    // ─── Payment Rail Detectors ───────────────────────────────────────────
    private val UPI_SIGNALS  = listOf("upi", "@ybl", "@okhdfc", "@paytm", "@oksbi", "@okhdfcbank", "upi ref", "upi txn", "upi id", "upi/")
    private val CARD_SIGNALS = listOf("credit card", "debit card", "card ending", "card no", "card xx", "pos txn", "pos transaction", "pos purchase", "spent on", "used at", "at merchant")
    private val ATM_SIGNALS  = listOf("atm", "cash withdrawn", "cash withdrawal", "cash at atm", "atm withdrawal")
    private val NEFT_SIGNALS = listOf("neft")
    private val IMPS_SIGNALS = listOf("imps")
    private val RTGS_SIGNALS = listOf("rtgs")
    private val WALLET_SIGNALS = listOf("paytm wallet", "wallet transfer", "wallet added", "loaded to wallet")

    // ─── Reference Number Patterns ───────────────────────────────────────
    // UPI RRN = 12 digits, UTR = 16-22 alphanumeric
    private val REF_PATTERNS = listOf(
        Regex("""(?:ref(?:no|\.| no)?[:\s#]*|rrn[:\s#]*|utr[:\s#]*)([A-Z0-9]{6,22})""", RegexOption.IGNORE_CASE),
        Regex("""(?:txn(?:id)?[:\s#]*|tran(?:saction)?[:\s#]*)([A-Z0-9]{6,22})""", RegexOption.IGNORE_CASE),
        Regex("""(?:imps|neft|upi)[:\s#/]*([0-9]{6,22})""", RegexOption.IGNORE_CASE),
        Regex("""\b(\d{12})\b""")  // 12-digit standalone number = UPI RRN
    )

    // ─── Account Mask Patterns ────────────────────────────────────────────
    private val ACCOUNT_PATTERNS = listOf(
        Regex("""(?:a/c|acct|account|a/c no)[.\s*]*([xX*]{1,4}\d{4})"""),
        Regex("""(?:card|card ending|card no)[.\s*]*([xX*]{0,4}\d{4})"""),
        Regex("""(?:ending|ending in)[.\s]*(\d{4})"""),
        Regex("""[xX*]{2,4}(\d{4})""")
    )

    // ─── Merchant Extraction Hints ────────────────────────────────────────
    private val MERCHANT_PREFIXES = listOf(
        "to ", "at ", "via ", "from ", "towards ",
        "to:", "at:", "payee:", "merchant:"
    )

    // ─── Category Keywords ────────────────────────────────────────────────
    private val CATEGORIES = mapOf(
        "Food"      to listOf("zomato", "swiggy", "dunzo", "restaurant", "food", "cafe", "hotel", "eat"),
        "Grocery"   to listOf("milk", "kirana", "blinkit", "zepto", "grocery", "supermarket", "mart", "bigbasket"),
        "Toll"      to listOf("fastag", "toll", "nhai"),
        "Travel"    to listOf("uber", "ola", "rapido", "irctc", "indian railway", "flight", "airline", "cab", "auto", "metro", "bus"),
        "Shopping"  to listOf("amazon", "flipkart", "meesho", "myntra", "nykaa", "snapdeal", "ajio", "shopping"),
        "Fuel"      to listOf("petrol", "diesel", "hp", "iocl", "bpcl", "shell", "fuel"),
        "Bills"     to listOf("jio", "airtel", "vi", "bsnl", "recharge", "electricity", "water bill", "gas bill", "broadband", "dth"),
        "Health"    to listOf("pharmacy", "medical", "hospital", "clinic", "apollo", "netmeds", "1mg", "pharmeasy"),
        "Self-Transfer" to listOf("self", "own account", "to own a/c"),
        "Transfer"  to listOf("neft", "imps", "rtgs", "transfer", "sent to"),
        "CardPayment" to listOf("card bill", "credit card bill", "card payment"),
        "Refund"    to listOf("refund", "reversed", "reversal", "cashback credited")
    )

    // ─── Fraud Signals ────────────────────────────────────────────────────
    // Prompt Rule: "Mark FRAUD if: normal 10-digit number claiming bank,
    //               urgent language + suspicious links, asking for OTP/details"
    private val FRAUD_SIGNALS = listOf(
        "share your otp",
        "share the otp",
        "give otp",
        "send otp",
        "provide otp",
        "your account will be blocked",
        "account suspended immediately",
        "verify now or blocked",
        "click to unblock",
        "your kyc expired",
        "re-kyc required immediately",
        "dear customer your netbanking",
        "netbanking will be blocked",
        "urgent: account"
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Main classification entry point.
     * Temperature = 0.0: fully deterministic.
     *
     * @param sender  SMS sender ID (e.g. "VM-HDFCBK" or "9876543210")
     * @param body    Raw SMS body
     * @return [ClassificationResult] with full structured extraction
     */
    fun classify(sender: String, body: String): ClassificationResult {
        if (body.isBlank()) {
            return ignore("empty_body")
        }

        val normalized = SmsNormalizationHelper.normalize(body)
        val lower      = normalized.lowercase()
        val senderUpper = sender.uppercase().trim()

        // ── Step 1: Fraud check (before anything else) ────────────────────
        val fraudCheck = checkFraud(senderUpper, lower)
        if (fraudCheck != null) {
            SmsEngineLogger.w(TAG, "FRAUD detected: $fraudCheck sender=$sender")
            return ClassificationResult(
                status = ClassificationStatus.FRAUD,
                fraudReason = fraudCheck
            )
        }

        // ── Step 2: TransactionFilter hard-block check ────────────────────
        // Reuse existing filter for IGNORE decision
        val filterPass = TransactionFilter.isTransactionSMS(body, sender)
        if (!filterPass) {
            val reason = getIgnoreReason(lower)
            SmsEngineLogger.d(TAG, "IGNORE: $reason sender=$sender")
            return ignore(reason)
        }

        // ── Step 3: Detect transaction type ───────────────────────────────
        val isDebit  = DEBIT_VERBS.any  { lower.contains(it) }
        val isCredit = CREDIT_VERBS.any { lower.contains(it) }

        if (!isDebit && !isCredit) {
            SmsEngineLogger.d(TAG, "IGNORE: no_settlement_verb sender=$sender")
            return ignore("no_settlement_verb")
        }

        // Prompt Rule: "If both DEBIT and CREDIT verbs present → DEBIT wins"
        val txnType = when {
            isDebit  -> TransactionType.DEBIT
            isCredit -> TransactionType.CREDIT
            else     -> TransactionType.UNKNOWN
        }

        // ── Step 4: Extract structured data ───────────────────────────────
        val amount     = extractAmount(lower)
        val accountMask = extractAccountMask(body)
        val rail       = detectRail(lower)
        val refNo      = extractReferenceNo(body)
        val merchant   = extractMerchant(lower, txnType)
        val category   = detectCategory(lower, merchant, refNo, txnType)

        SmsEngineLogger.i(TAG,
            "ACCEPT type=$txnType amount=${amount}p rail=$rail " +
            "account=$accountMask merchant=$merchant ref=$refNo sender=$sender"
        )

        return ClassificationResult(
            status       = ClassificationStatus.ACCEPT,
            type         = txnType,
            amountPaise  = amount,
            currency     = "INR",
            accountMask  = accountMask,
            merchantName = merchant,
            rail         = rail,
            referenceNo  = refNo,
            categoryHint = category
        )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private fun ignore(reason: String) = ClassificationResult(
        status = ClassificationStatus.IGNORE,
        ignoreReason = reason
    )

    /** Returns fraud reason string or null if not fraud */
    private fun checkFraud(senderUpper: String, lower: String): String? {
        // 10-digit number sender claiming to be a bank
        val is10DigitSender = senderUpper.matches(Regex("""\d{10}"""))
        val claimsBank = listOf("bank", "hdfc", "sbi", "icici", "axis", "paytm", "upi")
            .any { lower.contains(it) }
        if (is10DigitSender && claimsBank) {
            return "10_digit_sender_claiming_bank"
        }

        // Phishing / social engineering signals
        val fraudHit = FRAUD_SIGNALS.firstOrNull { lower.contains(it) }
        if (fraudHit != null) return "phishing_signal: $fraudHit"

        return null
    }

    /**
     * Provides a human-readable ignore reason based on content.
     * Mirrors the ignore_criteria from both prompts.
     */
    private fun getIgnoreReason(lower: String): String = when {
        lower.containsAny("otp", "verification code", "ipin", "mpin") -> "authentication_code"
        lower.containsAny("available bal", "avl bal", "as on yesterday", "minimum limit") -> "balance_status_update"
        lower.containsAny("bill alert", "is due on", "emi reminder", "payment due") -> "payment_reminder"
        lower.containsAny("offer", "cashback", "discount", "sale", "promo") -> "marketing_promotional"
        lower.containsAny("loan offer", "loan against property", "pre-approved") -> "loan_marketing"
        lower.containsAny("ckyc", "kyc", "subscription", "activated") -> "admin_service"
        lower.containsAny("is declined", "payment failed", "transaction failed") -> "declined_transaction"
        lower.containsAny("payment received for your", "card bill payment") -> "card_payment_confirmation"
        lower.containsAny("insurance", "mutual fund", "invest") -> "investment_product"
        else -> "filtered_by_classifier"
    }

    // ─── Amount Extraction ────────────────────────────────────────────────
    private fun extractAmount(lower: String): Long {
        // Priority 1: ₹ / Rs. / INR followed by number
        val patterns = listOf(
            Regex("""(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)""", RegexOption.IGNORE_CASE),
            Regex("""([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rupees?)""", RegexOption.IGNORE_CASE)
        )
        for (pattern in patterns) {
            val match = pattern.findAll(lower)
                .map { it.groupValues[1].replace(",", "").toBigDecimalOrNull() }
                .filterNotNull()
                .filter { it > BigDecimal.ZERO }
                .firstOrNull()
            if (match != null) {
                return match.multiply(BigDecimal(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .toLong()
            }
        }
        return 0L
    }

    // ─── Account Mask Extraction ──────────────────────────────────────────
    private fun extractAccountMask(body: String): String? {
        for (pattern in ACCOUNT_PATTERNS) {
            val match = pattern.find(body)
            if (match != null) {
                return match.groupValues[1].takeLast(4)
            }
        }
        return null
    }

    // ─── Payment Rail Detection ───────────────────────────────────────────
    private fun detectRail(lower: String): PaymentRail = when {
        ATM_SIGNALS.any    { lower.contains(it) } -> PaymentRail.ATM
        RTGS_SIGNALS.any   { lower.contains(it) } -> PaymentRail.RTGS
        NEFT_SIGNALS.any   { lower.contains(it) } -> PaymentRail.NEFT
        IMPS_SIGNALS.any   { lower.contains(it) } -> PaymentRail.IMPS
        UPI_SIGNALS.any    { lower.contains(it) } -> PaymentRail.UPI
        CARD_SIGNALS.any   { lower.contains(it) } -> PaymentRail.CARD
        WALLET_SIGNALS.any { lower.contains(it) } -> PaymentRail.WALLET
        lower.containsAny("neft", "imps", "rtgs", "transfer") -> PaymentRail.BANK_TRANSFER
        else -> PaymentRail.UNKNOWN
    }

    // ─── Reference Number Extraction ─────────────────────────────────────
    private fun extractReferenceNo(body: String): String? {
        for (pattern in REF_PATTERNS) {
            val match = pattern.find(body)
            if (match != null && match.groupValues[1].length >= 6) {
                return match.groupValues[1]
            }
        }
        return null
    }

    // ─── Merchant Name Extraction ─────────────────────────────────────────
    private fun extractMerchant(lower: String, type: TransactionType): String? {
        // Try prefix-based extraction
        for (prefix in MERCHANT_PREFIXES) {
            val idx = lower.indexOf(prefix)
            if (idx >= 0) {
                val rest = lower.substring(idx + prefix.length).trim()
                // Take up to next keyword or 25 chars
                val end = rest.indexOfFirst { it in listOf('\n', '(', ',', '.') }
                    .takeIf { it > 0 } ?: minOf(25, rest.length)
                val candidate = rest.substring(0, end).trim()
                if (candidate.length >= 2 && !candidate.all { it.isDigit() }) {
                    return candidate.split(" ")
                        .take(3)
                        .joinToString(" ")
                        .replaceFirstChar { it.uppercase() }
                }
            }
        }
        return null
    }

    // ─── Category Detection ───────────────────────────────────────────────
    private fun detectCategory(
        lower: String,
        merchant: String?,
        refNo: String?,
        type: TransactionType
    ): String {
        val searchText = lower + " " + (merchant?.lowercase() ?: "")

        // Special cases first
        if (searchText.containsAny("refund", "reversed", "reversal")) return "Refund"
        if (searchText.containsAny("card bill", "credit card bill")) return "CardPayment"
        if (searchText.containsAny("self", "own account")) return "Transfer"

        // Category match
        for ((category, keywords) in CATEGORIES) {
            if (keywords.any { searchText.contains(it) }) return category
        }

        return "Others"
    }

    private fun String.containsAny(vararg keys: String): Boolean =
        keys.any { this.contains(it) }
}
