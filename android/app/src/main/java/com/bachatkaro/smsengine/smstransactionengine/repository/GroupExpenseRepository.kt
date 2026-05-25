package com.bachatkaro.smsengine.smstransactionengine.repository

import android.util.Log
import com.bachatkaro.smsengine.smstransactionengine.sync.SupabaseService
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * GroupExpenseRepository
 * ──────────────────────
 * Orchestrates group expense operations with date filtering and RPC logic.
 */
class GroupExpenseRepository(private val supabaseService: SupabaseService) {

    /**
     * Inserts a group expense via RPC, with member lookup and date filtering.
     * @return Boolean Success status
     */
    suspend fun insertGroupExpenseRPC(
        groupId: String,
        userId: String,
        title: String,
        amount: Long,
        splitType: String,
        category: String,
        notes: String?,
        transactionCreatedAt: Long, // Date from the SMS transaction
        accessToken: String
    ): Boolean {
        try {
            // 1. Fetch group metadata (Created At)
            val groupCreatedAtStr = supabaseService.getGroupCreatedAt(groupId, accessToken)
            if (groupCreatedAtStr == null) {
                Log.e("GroupExpenseRepository", "Sync blocked: Group metadata missing")
                return false
            }

            // 2. APPLY DATE FILTER (STEP 5)
            // Ensure only transactions AFTER group creation are inserted
            val groupCreatedAtMs = parseIsoTimestamp(groupCreatedAtStr)
            if (transactionCreatedAt < groupCreatedAtMs) {
                Log.i("GroupExpenseRepository", "Sync skipped: Transaction predates group creation")
                return true // Return true to mark as "handled" in sync engine
            }

            // 3. MEMBER ID LOGIC (STEP 4)
            val paidByMemberId = supabaseService.getMemberId(groupId, userId, accessToken)
            if (paidByMemberId == null) {
                Log.e("GroupExpenseRepository", "Sync failed: Current user is not a member of this group")
                return false
            }

            // 4. ATOMIC RPC CALL (STEP 2)
            return supabaseService.insertGroupExpenseRPC(
                groupId = groupId,
                userId = userId,
                title = title,
                amount = amount,
                paidByMemberId = paidByMemberId,
                splitType = splitType,
                category = category,
                notes = notes,
                accessToken = accessToken
            )
        } catch (e: Exception) {
            Log.e("GroupExpenseRepository", "Sync crash: ${e.message}", e)
            return false
        }
    }

    private fun parseIsoTimestamp(iso: String): Long {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            format.timeZone = TimeZone.getTimeZone("UTC")
            format.parse(iso)?.time ?: Long.MAX_VALUE
        } catch (e: Exception) {
            Long.MAX_VALUE
        }
    }
}
