package com.bachatkaro.smsengine.smstransactionengine.util

/**
 * SmsNormalizationHelper
 * ──────────────────────
 * Centralizes normalization rules for Indian Bank SMS abbreviations.
 * Ensures consistent interpretation of Dr/Cr, AvlBal, etc. across Filter and Parser.
 */
object SmsNormalizationHelper {

    /**
     * Normalize SMS body by expanding abbreviations and standardizing whitespace.
     */
    fun normalize(text: String): String {
        return text.lowercase()
            .replace("\n", " ")
            .replace("\r", " ")
            .replace(Regex("""\bdr\.?\b"""), "debited")
            .replace(Regex("""\bcr\.?\b"""), "credited")
            .replace(Regex("""\ba/c\b"""), "account")
            .replace(Regex("""\bavlbal\b"""), "balance")
            .replace(Regex("""\bavl\s+bal\b"""), "balance")
            .replace(Regex("""\bbal:\b"""), "balance")
            // Date Normalization
            .replace("today", "") // Usually redundant in SMS, better to strip for cleaner parsing
            .replace("yesterday", "")
            // Currency standardizing for regex simplicity
            .replace("₹", "rs ")
            .replace("inr", "rs ")
            .replace(Regex("""\s+"""), " ")
            .trim()
    }
}
