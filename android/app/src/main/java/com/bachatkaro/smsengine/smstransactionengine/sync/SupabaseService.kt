package com.bachatkaro.smsengine.smstransactionengine.sync

import android.util.Log
import com.bachatkaro.app.BuildConfig
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * SupabaseService
 * ────────────────
 * Native implementation for Supabase RPC and REST calls.
 */
class SupabaseService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val supabaseUrl = BuildConfig.SUPABASE_URL
    private val anonKey = BuildConfig.SUPABASE_KEY

    /**
     * Call the insert_group_expense_with_split RPC.
     */
    suspend fun insertGroupExpenseRPC(
        groupId: String,
        userId: String,
        title: String,
        amount: Long,
        paidByMemberId: String,
        splitType: String,
        category: String,
        notes: String?,
        accessToken: String
    ): Boolean {
        return try {
            val payload = JSONObject().apply {
                put("p_group_id", groupId)
                put("p_user_id", userId)
                put("p_title", title)
                put("p_amount", amount)
                put("p_paid_by_member_id", paidByMemberId)
                put("p_split_type", splitType)
                put("p_category", category)
                put("p_notes", notes)
            }

            val url = "$supabaseUrl/rest/v1/rpc/insert_group_expense_with_split"
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $accessToken")
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody("application/json".toMediaTypeOrNull()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val error = response.body?.string() ?: "Unknown error"
                    Log.e("SupabaseService", "RPC Failed: $error")
                    return false
                }
                true
            }
        } catch (e: Exception) {
            Log.e("SupabaseService", "RPC Crash: ${e.message}", e)
            false
        }
    }

    /**
     * Fetch member ID for a user in a group.
     */
    suspend fun getMemberId(groupId: String, userId: String, accessToken: String): String? {
        return try {
            val url = "$supabaseUrl/rest/v1/group_members?select=id&group_id=eq.$groupId&user_id=eq.$userId"
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $accessToken")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return null
                val body = response.body?.string() ?: "[]"
                val json = JSONArray(body)
                if (json.length() > 0) {
                    json.getJSONObject(0).getString("id")
                } else null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Fetch group creation date.
     */
    suspend fun getGroupCreatedAt(groupId: String, accessToken: String): String? {
        return try {
            val url = "$supabaseUrl/rest/v1/groups?select=created_at&id=eq.$groupId"
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $accessToken")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return null
                val body = response.body?.string() ?: "[]"
                val json = JSONArray(body)
                if (json.length() > 0) {
                    json.getJSONObject(0).getString("created_at")
                } else null
            }
        } catch (e: Exception) {
            null
        }
    }
}
