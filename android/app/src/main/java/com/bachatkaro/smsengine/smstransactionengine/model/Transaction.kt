package com.bachatkaro.smsengine.smstransactionengine.model

data class Transaction(
    val id: Long = 0L,
    val smsHash: String = "",
    val sender: String = "",
    val rawBody: String = "",
    val type: TransactionType = TransactionType.UNKNOWN,
    val amount: Long = 0L,
    val currency: String = "INR",
    val accountRef: String = "",
    val reference: String = "",
    val merchantName: String = "",
    val category: String = "Others",
    val paymentHandle: String = "",
    val location: String = "",
    val balance: Long = -1L,
    val timestamp: Long = System.currentTimeMillis(),
    val parsedAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false,
    val syncStatus: String = "pending",
    val updatedAt: Long = System.currentTimeMillis(),
    val userId: String? = null,
    val canonicalKey: String? = null,
    val idempotencyKey: String? = null,
    val confidenceScore: Int = 100,
    val isSplitGroup: Boolean = false,
    val isDeleted: Boolean = false,
    val isPossibleDuplicate: Boolean = false
) {
    fun formattedAmount(): String {
        val s = amount.toString().padStart(3, '0')
        val major = s.substring(0, s.length - 2)
        val minor = s.substring(s.length - 2)
        val symbol = when (currency) {
            "INR" -> "Rs "
            "USD" -> "USD "
            "EUR" -> "EUR "
            "GBP" -> "GBP "
            else -> "$currency "
        }
        return "$symbol$major.$minor"
    }

    fun formattedBalance(): String {
        if (balance < 0) return "N/A"
        val s = balance.toString().padStart(3, '0')
        val major = s.substring(0, s.length - 2)
        val minor = s.substring(s.length - 2)
        val symbol = when (currency) {
            "INR" -> "Rs "
            "USD" -> "USD "
            "EUR" -> "EUR "
            "GBP" -> "GBP "
            else -> "$currency "
        }
        return "$symbol$major.$minor"
    }
}

enum class TransactionType {
    DEBIT,
    CREDIT,
    UNKNOWN
}
