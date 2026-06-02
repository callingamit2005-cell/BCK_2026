
import { supabase } from '@/integrations/supabase/client';
import { saveAndSync, seedLocalCacheRow } from '@/integrations/sqliteService';

/**
 * AutoGroupMapper - Direct Transaction-to-Group Mapping
 * Automatically maps any incoming SMS transaction to the user's default group.
 */

/**
 * Fetches the user's first available group to act as the default.
 */
async function getDefaultGroup(userId: string) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return (data as any).groups;
  } catch (err) {
    console.error("getDefaultGroup failed:", err);
    return null;
  }
}

/**
 * Fetches the member ID for the user within a specific group.
 */
async function getMemberId(groupId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    return data?.id || null;
  } catch (err) {
    return null;
  }
}

export async function autoMapTransactionToGroup(transaction: any, silent: boolean = false) {
  try {
    if (!transaction || !transaction.user_id || !transaction.amount) {
      console.error("❌ [AutoGroupMapper] Missing required fields in transaction object");
      return;
    }

    // 1. Fetch Default Group and verify membership
    const group = await getDefaultGroup(transaction.user_id);
    if (!group) {
      console.warn("⚠️ [AutoGroupMapper] No group found for user, mapping skipped.");
      return;
    }
    console.log("📂 [AutoGroupMapper] Target Group Found:", { id: group.id, created_at: group.created_at });

    // 2. Date filter: only map transactions that occurred ON or AFTER group creation.
    const txDate = new Date(transaction.date);
    const groupCreatedAt = new Date(group.created_at);
    
    if (txDate.getTime() < groupCreatedAt.getTime()) {
      console.log("ℹ️ [AutoGroupMapper] SKIP - Transaction date precedes group creation:", {
        txDate: txDate.toISOString(),
        groupCreated: groupCreatedAt.toISOString()
      });
      return;
    }
    console.log("✅ [AutoGroupMapper] Date filter passed.");

    // 3. Prevent Duplicates (Logic Lock: Exact amount + user + date)
    const refTag = transaction.sms_hash 
      ? `[AUTO_SYNC:${transaction.sms_hash}]` 
      : `[MANUAL_SYNC:${transaction.id}]`;
    
    const { data: existingByHash, error: hashErr } = await supabase
      .from('group_expenses')
      .select('id')
      .eq('group_id', group.id)
      .ilike('notes', `%${refTag}%`)
      .maybeSingle();

    if (hashErr) console.error("❌ [AutoGroupMapper] Hash check error:", hashErr);

    if (existingByHash) {
      console.log("ℹ️ [AutoGroupMapper] SKIP - Transaction hash already mapped:", refTag);
      return;
    }

    // 4. Resolve Member ID
    const memberId = await getMemberId(group.id, transaction.user_id);
    if (!memberId) {
      console.error("❌ [AutoGroupMapper] User is not a member of their own group? Skipping.");
      return;
    }

    // 🚀 [PLATFORM_PARITY_FIX]
    const { getSafeUUID } = await import('@/integrations/sqlite');
    
    // 5. Prepare Payload
    const expenseId = transaction.id || getSafeUUID();
    const idempotencyKey = transaction.sms_hash ? `auto_${transaction.sms_hash}` : `auto_${expenseId}`;
    const amount = Number(transaction.amount);

    const rpcPayload = {
      p_id: expenseId,
      p_idempotency_key: idempotencyKey,
      p_group_id: group.id,
      p_user_id: transaction.user_id,
      p_title: transaction.description || transaction.payee || "SMS Transaction",
      p_amount: amount,
      p_paid_by_member_id: memberId,
      p_split_type: "equal",
      p_category: transaction.category || "Others",
      p_notes: `${refTag} (Auto-Linked)`,
      p_date: transaction.date
    };

    // 🛡️ [INSTANT_PROPAGATION] Optimistic Local SQLite Insert
    // This allows the Group Ledger to update instantly even while offline.
    console.log("🏠 [AutoGroupMapper] Performing Optimistic Local Insert...");
    await seedLocalCacheRow("group_expenses", {
      id: expenseId,
      group_id: group.id,
      title: rpcPayload.p_title,
      amount: amount,
      paid_by_member_id: memberId,
      paid_by: transaction.user_id, // fallback for schema
      user_id: transaction.user_id,
      notes: rpcPayload.p_notes,
      split_type: "equal",
      idempotency_key: idempotencyKey,
      category: rpcPayload.p_category,
      created_at: transaction.date,
      sync_status: 'pending'
    }, 'pending');

    // 6. Enqueue Atomic RPC via Unified SDK
    console.log("📡 [AutoGroupMapper] Enqueueing RPC: insert_group_expense_with_split");
    await saveAndSync("insert_group_expense_with_split", rpcPayload, "RPC", silent);

    console.log("✨ [AutoGroupMapper] MAPPING ENQUEUED SUCCESSFULLY");

  } catch (err) {
    console.error("💀 [AutoGroupMapper] CRITICAL CRASH:", err);
  }
}
