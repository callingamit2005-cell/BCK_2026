package com.bachatkaro.smsengine.smstransactionengine.sync

import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * SupabaseSyncClient
 * ──────────────────
 * Production-grade HTTP client for Supabase REST API.
 * Handles Auth, Upsert (idempotency), and History Retrieval.
 */
class SupabaseSyncClient(
    private val supabaseUrl: String,
    private val anonKey: String
) {

    data class RefreshedSession(
        val accessToken: String,
        val refreshToken: String,
        val expiresAtEpochSeconds: Long
    )

    fun refreshSession(refreshToken: String): RefreshedSession {
        val connection = openConnection(
            path = "/auth/v1/token?grant_type=refresh_token",
            method = "POST",
            authenticated = false
        )
        val payload = JSONObject().put("refresh_token", refreshToken).toString()
        connection.doOutput = true
        OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { it.write(payload) }
        val body = readResponseBody(connection)
        ensureSuccess(connection, body)
        val json = JSONObject(body)
        return RefreshedSession(
            accessToken = json.getString("access_token"),
            refreshToken = json.optString("refresh_token", refreshToken),
            expiresAtEpochSeconds = json.optLong("expires_at")
        )
    }

    /**
     * Idempotent UPSERT using user_id + sms_hash as conflict target.
     */
    fun upsertTransaction(accessToken: String, userId: String, transaction: Transaction) {
        val payload = JSONObject()
            .put("user_id", userId)
            .put("amount", transaction.amount)
            .put("type", mapType(transaction))
            .put("category", "Others")
            .put("description", buildDescription(transaction))
            .put("date", toIsoTimestamp(transaction.timestamp))
            .put("sms_hash", transaction.smsHash)
            .put("updated_at", toIsoTimestamp(System.currentTimeMillis()))

        val connection = openConnection(
            path = "/rest/v1/transactions",
            method = "POST",
            accessToken = accessToken
        )
        // Prefer: resolution=merge-duplicates triggers upsert logic based on UNIQUE constraint
        connection.setRequestProperty("Prefer", "resolution=merge-duplicates")
        connection.doOutput = true
        OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { it.write(payload.toString()) }
        val body = readResponseBody(connection)
        ensureSuccess(connection, body)
    }

    /**
     * Fetch all transactions for a user (for Restore flow).
     * HIGHLIGHT: Limited to last 6 months for efficient sync
     */
    fun fetchHistory(accessToken: String, userId: String): List<Transaction> {
        // Calculate 180 days ago (6 months)
        val sixMonthsAgoMs = System.currentTimeMillis() - (180L * 24 * 60 * 60 * 1000)
        val sixMonthsAgoIso = toIsoTimestamp(sixMonthsAgoMs)

        val query = listOf(
            "user_id=eq.${encode(userId)}",
            "date=gte.$sixMonthsAgoIso",
            "order=date.desc"
        ).joinToString("&")

        val connection = openConnection(
            path = "/rest/v1/transactions?$query",
            method = "GET",
            accessToken = accessToken
        )
        val body = readResponseBody(connection)
        ensureSuccess(connection, body)
        
        val arr = JSONArray(body)
        val list = mutableListOf<Transaction>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            list.add(mapJsonToTransaction(obj))
        }
        return list
    }

    private fun mapJsonToTransaction(obj: JSONObject): Transaction {
        val typeStr = obj.optString("type", "expense")
        val amount = obj.optLong("amount", 0L)
        val category = obj.optString("category", "Others")
        val dateStr = obj.optString("date", "")
        val description = obj.optString("description", "Restored")
        
        // Better sender extraction: "Amazon (via HDFC)" -> "Amazon"
        val sender = description.split(" (via")[0].trim()
        
        return Transaction(
            smsHash = obj.optString("sms_hash", ""),
            amount = amount,
            type = if (typeStr == "income") TransactionType.CREDIT else TransactionType.DEBIT,
            sender = if (sender.isEmpty()) "Restored" else sender,
            merchantName = description,
            category = category,
            timestamp = parseIsoTimestamp(dateStr),
            syncStatus = "completed",
            userId = obj.optString("user_id", ""),
            updatedAt = parseIsoTimestamp(obj.optString("updated_at", dateStr))
        )
    }

    private fun buildDescription(transaction: Transaction): String {
        val source = when {
            transaction.merchantName.isNotBlank() -> transaction.merchantName
            transaction.reference.isNotBlank() -> transaction.reference
            else -> transaction.sender
        }.trim()
        return if (source.isBlank()) "SMS Transaction" else source
    }

    private fun mapType(transaction: Transaction): String =
        when (transaction.type.name) {
            "DEBIT" -> "expense"
            "CREDIT" -> "income"
            else -> "expense"
        }

    private fun toIsoTimestamp(timestamp: Long): String {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        format.timeZone = TimeZone.getTimeZone("UTC")
        return format.format(Date(timestamp))
    }

    private fun parseIsoTimestamp(iso: String): Long {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            format.timeZone = TimeZone.getTimeZone("UTC")
            format.parse(iso)?.time ?: System.currentTimeMillis()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }

    private fun openConnection(
        path: String,
        method: String,
        authenticated: Boolean = true,
        accessToken: String? = null
    ): HttpURLConnection {
        val connection = URL("$supabaseUrl$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 15_000
        connection.readTimeout = 20_000
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("apikey", anonKey)
        if (authenticated && accessToken != null) {
            connection.setRequestProperty("Authorization", "Bearer $accessToken")
        }
        return connection
    }

    private fun readResponseBody(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        if (stream == null) return ""
        return BufferedReader(InputStreamReader(stream, StandardCharsets.UTF_8)).use { it.readText() }
    }

    private fun ensureSuccess(connection: HttpURLConnection, body: String) {
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException("Supabase HTTP ${connection.responseCode}: $body")
        }
    }

    private fun encode(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
}
