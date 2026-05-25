package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import java.security.MessageDigest

object SmsParser {

    private const val TAG = "SmsParser"

    private val ACCOUNT_PATTERNS = listOf(
        Regex("""(?i)(?:a/?c|acct?|account|card)[^\d]{0,12}(?:xx+|ending|no\.?|\*{2,})\s*(\d{4,6})"""),
        Regex("""(?i)(?:x{2,}|\*{2,})(\d{4,6})\b"""),
        Regex("""(?i)\bending\s+(?:with\s+|in\s+)?(\d{4,6})\b""")
    )

    private val REF_PATTERNS = listOf(
        Regex("""(?i)(?:upi\s*ref(?:erence)?(?:\s*no\.?)?|ref(?:erence)?\s*no\.?|ref\s*id|txn\s*(?:id|no\.?|ref)|transaction\s*id|trxn\s*id|imps\s*ref|neft\s*ref|rrn)[:\s#-]+([A-Za-z0-9\-]{4,40})"""),
        Regex("""(?i)(?:cheque|chq)\s*(?:no\.?|number)[:\s]+([A-Za-z0-9]{4,20})"""),
        Regex("""(?i)\border\s*(?:id|no\.?)[:\s]+([A-Za-z0-9\-]{4,25})""")
    )

    private val UPI_HANDLE_REGEX = Regex("""(?i)\b([a-z0-9][a-z0-9.\-_]{1,63}@[a-z]{2,63})\b""")

    private val MERCHANT_PATTERNS = listOf(
        Regex("""(?i)\bat\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40}?)(?:\s+on\b|\.|,|\s*$)"""),
        Regex("""(?i)\bto\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40}?)(?:\s+(?:via|using|on)\b|\.|,|\s*$)"""),
        Regex("""(?i)\bfrom\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40}?)(?:\s+(?:via|using|on|to)\b|\.|,|\s*$)"""),
        Regex("""(?i)\btransfer\s+to\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40}?)(?:\s+(?:via|using|on)\b|\.|,|\s*$)"""),
        Regex("""(?i)\bmerchant[:\s]+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40})(?:\.|,|\s*$)"""),
        Regex("""(?i)\binfo[:\s]+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40})(?:\.|,|\s*$)"""),
        Regex("""(?i)\bremarks\s*[:\-]?\s*([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40})(?:\.|,|\s*$)""")
    )

    private val LOCATION_PATTERNS = listOf(
        Regex("""(?i)\bat\s+([A-Z0-9][A-Za-z0-9 .&'\-/]{2,40}?)(?:\s+on\b|\.|,|\s*$)"""),
        Regex("""(?i)\bin\s+([A-Z][A-Za-z .'\-/]{2,30})(?:\.|,|\s*$)""")
    )

    private val BALANCE_PATTERNS = listOf(
        Regex("""(?i)(?:avl?\.?\s*bal(?:ance)?|available\s*balance|wallet\s*bal(?:ance)?)\s*[:\-]?\s*(?:rs\.?\s*|inr\s*|usd\s*|eur\s*|gbp\s*|₹\s*|\$\s*|€\s*|£\s*)?([\d,]+(?:\.\d{1,2})?)"""),
        Regex("""(?i)\bbal(?:ance)?\s*[:\-]?\s*(?:rs\.?\s*|inr\s*|usd\s*|eur\s*|gbp\s*|₹\s*|\$\s*|€\s*|£\s*)?([\d,]+(?:\.\d{1,2})?)"""),
        Regex("""(?i)(?:closing|current)\s*bal(?:ance)?\s*[:\-]?\s*(?:rs\.?\s*|inr\s*|usd\s*|eur\s*|gbp\s*|₹\s*|\$\s*|€\s*|£\s*)?([\d,]+(?:\.\d{1,2})?)""")
    )

    private val MERCHANT_STOPWORDS = setOf(
        "your", "the", "a", "an", "this", "that", "our",
        "rs", "inr", "usd", "eur", "gbp", "upi", "imps", "neft", "rtgs",
        "bank", "account", "customer", "wallet"
    )

    fun parseDetails(
        sender: String,
        body: String,
        timestamp: Long,
        amountPaise: Long,
        currency: String,
        type: TransactionType,
        category: String = "Others"
    ): Transaction? {
        SmsEngineLogger.d(TAG, "parseDetails sender='$sender' type=$type amount=${amountPaise}p category=$category")
        return try {
            val bankName = SmsExtractor.detectBankName(sender)
            doParseDetails(sender, body, timestamp, amountPaise, currency, type, category, bankName)
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "parseDetails threw: ${ex.message}", ex)
            null
        }
    }

    private fun doParseDetails(
        sender: String,
        body: String,
        timestamp: Long,
        amountPaise: Long,
        currency: String,
        type: TransactionType,
        category: String,
        bankName: String
    ): Transaction {
        val accountRef = extractFirst(ACCOUNT_PATTERNS, body) ?: ""
        val reference = extractFirst(REF_PATTERNS, body) ?: ""
        val paymentHandle = extractPaymentHandle(body)
        var merchant = extractMerchant(body, paymentHandle)
        var finalCategory = category
        
        // Use bankName as fallback if no merchant detected
        if (merchant.isBlank()) {
            merchant = bankName
        }

        // Advanced Self-Transfer Detection
        val isSameBank = merchant.equals(bankName, ignoreCase = true) && type == TransactionType.DEBIT
        val allAccounts = ACCOUNT_PATTERNS.flatMap { it.findAll(body).map { m -> m.groupValues[1] } }.filter { it.length >= 4 }.distinct()
        val isSameAccountTransfer = allAccounts.size == 1 && body.lowercase().run { contains("to a/c") && contains("from a/c") }
        
        if (isSameBank || isSameAccountTransfer || body.lowercase().contains("to own account")) {
            finalCategory = "Self-Transfer"
            merchant = "Self ($bankName)"
        }

        // Transaction grouping for split entries (Wallet Load / Deduction)
        val isWalletLoad = type == TransactionType.DEBIT && (body.lowercase().contains("added to paytm") || body.lowercase().contains("wallet") || paymentHandle.lowercase().contains("wallet"))
        if (isWalletLoad) {
            finalCategory = "Wallet-Transfer"
        }

        // Calculate 0-100 Confidence Score
        var score = 100
        if (merchant.isBlank() || merchant == bankName) score -= 20
        if (reference.isBlank()) score -= 15
        if (accountRef.isBlank()) score -= 15
        if (paymentHandle.isBlank() && !body.lowercase().contains("card")) score -= 10
        score = score.coerceIn(0, 100)

        val location = extractLocation(body)
        val balance = extractBalance(body)
        val hash = smsHash(
            sender = sender,
            amount = amountPaise,
            timestamp = timestamp,
            body = body,
            type = type
        )

        val tx = Transaction(
            smsHash = hash,
            sender = sender,
            rawBody = body,
            type = type,
            amount = amountPaise,
            currency = currency,
            accountRef = accountRef,
            reference = reference,
            merchantName = merchant,
            category = finalCategory,
            paymentHandle = paymentHandle,
            location = location,
            balance = balance,
            timestamp = timestamp,
            parsedAt = System.currentTimeMillis(),
            confidenceScore = score,
            isSplitGroup = isWalletLoad
        )

        SmsEngineLogger.i(
            TAG,
            "parseDetails OK | type=$type | amt=${tx.formattedAmount()} | bank='$bankName' | merchant='$merchant' | score=$score | split=$isWalletLoad | hash=${hash.take(12)}"
        )
        return tx
    }

    private fun extractPaymentHandle(body: String): String {
        return UPI_HANDLE_REGEX.find(body)?.groupValues?.getOrNull(1)?.trim().orEmpty()
    }

    private fun extractMerchant(body: String, paymentHandle: String): String {
        for (pattern in MERCHANT_PATTERNS) {
            val candidate = pattern.find(body)?.groupValues?.getOrNull(1)?.trim() ?: continue
            if (candidate.length < 3) continue
            if (candidate.equals(paymentHandle, ignoreCase = true)) continue
            if (candidate.all { it.isDigit() }) continue
            if (candidate.lowercase() in MERCHANT_STOPWORDS) continue
            return candidate
        }
        return ""
    }

    private fun extractLocation(body: String): String {
        for (pattern in LOCATION_PATTERNS) {
            val candidate = pattern.find(body)?.groupValues?.getOrNull(1)?.trim() ?: continue
            if (candidate.length >= 3 && !candidate.all { it.isDigit() }) return candidate
        }
        return ""
    }

    private fun extractBalance(body: String): Long {
        val raw = extractFirst(BALANCE_PATTERNS, body) ?: return -1L
        val amount = raw.replace(",", "").trim().toBigDecimalOrNull() ?: return -1L
        return try {
            amount.movePointRight(2).longValueExact()
        } catch (_: Exception) {
            -1L
        }
    }

    private fun extractFirst(patterns: List<Regex>, body: String): String? {
        for (pattern in patterns) {
            val value = pattern.find(body)?.groupValues?.getOrNull(1)?.trim()
            if (!value.isNullOrBlank()) return value
        }
        return null
    }

    fun smsHash(
        sender: String,
        amount: Long,
        timestamp: Long,
        body: String,
        type: TransactionType
    ): String {
        // 🛡️ [IMMUTABLE TRANSACTION FINGERPRINT]
        // 🚀 CRITICAL FIX: Normalize timestamp to seconds to eliminate jitter
        // between Realtime Broadcast (Arrival) and Historical Scan (Storage).
        val secondLevelTs = (timestamp / 1000) * 1000
        
        // Normalize body: lowercase and remove multiple spaces/newlines
        val normalizedBody = body.lowercase().replace(Regex("\\s+"), " ").trim()
        val cleanSender = sender.trim().lowercase()
        
        // Use normalized timestamp (seconds)
        val hashInput = "$cleanSender|$amount|$secondLevelTs|$type|$normalizedBody"
        
        return sha256(hashInput)
    }

    fun sha256(text: String): String {
        return try {
            val bytes = MessageDigest.getInstance("SHA-256")
                .digest(text.toByteArray(Charsets.UTF_8))
            bytes.joinToString("") { "%02x".format(it) }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "SHA-256 unavailable - using UUID fallback", ex)
            java.util.UUID.randomUUID().toString()
        }
    }
}
