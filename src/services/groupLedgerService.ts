/**
 * 🔒 PROTECTED FINTECH LEDGER SERVICE
 * Implementation: Offline-First Activity Ledger CRUD
 * Identity Architecture: member_id based
 * 
 * Safety Rules:
 * - Atomic deletions of expenses and their splits.
 * - Soft-delete support for offline reconciliation.
 * - Idempotent sync queue enqueuing.
 */

import { supabase } from '@/integrations/supabase/client';
import { getDB, enqueueSync } from '@/integrations/sqlite';
import { Capacitor } from '@capacitor/core';
import { dispatchSyncUpdate } from '@/integrations/sqliteService';

/**
 * 🛡️ [PHASE_0A] Single Transaction Deletion
 * Purpose: Ensures both group_expenses and associated expense_splits are removed.
 */
export const deleteGroupExpense = async (expenseId: string, groupId: string) => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  console.log(`🗑️ [LEDGER_CRUD] Deleting expense: ${expenseId}`);

  if (isAndroid) {
    const db = getDB();
    if (db) {
      // 1. Soft delete locally to hide from UI immediately
      await db.run('UPDATE group_expenses SET is_deleted = 1 WHERE id = ?', [expenseId]);
      await db.run('UPDATE expense_splits SET is_deleted = 1 WHERE expense_id = ?', [expenseId]);
      
      // 2. Enqueue RPC for atomic cloud sync
      await enqueueSync('delete_group_expense_atomic', 'RPC', { p_expense_id: expenseId });
      
      // 3. Notify UI of local mutation
      dispatchSyncUpdate();
      return true;
    }
  }

  // Cloud Direct: Use RPC to ensure atomic splits deletion and bypass strict RLS creator checks
  const { error } = await supabase.rpc('delete_group_expense_atomic', { p_expense_id: expenseId });
  if (error) throw error;

  return true;
};

/**
 * 🛡️ [PHASE_0A] Bulk Ledger Clearing
 * Purpose: Removes all transactions from a group.
 */
export const clearGroupLedger = async (groupId: string) => {
  const isAndroid = Capacitor.getPlatform() === 'android';

  console.log(`🗑️ [LEDGER_CRUD] Clearing ledger for group: ${groupId}`);

  if (isAndroid) {
    const db = getDB();
    if (db) {
      // Soft delete all in SQLite
      await db.run('UPDATE group_expenses SET is_deleted = 1 WHERE group_id = ?', [groupId]);
      await db.run('UPDATE expense_splits SET is_deleted = 1 WHERE group_id = ?', [groupId]);
      
      // Enqueue bulk clear RPC
      await enqueueSync('clear_group_ledger_atomic', 'RPC', { p_group_id: groupId });
      
      // Notify UI
      dispatchSyncUpdate();
      return true;
    }
  }

  // Cloud Direct: Use RPC to bypass RLS creator checks and ensure atomicity
  const { error } = await supabase.rpc('clear_group_ledger_atomic', { p_group_id: groupId });
  if (error) throw error;

  return true;
};

/**
 * 🛡️ [PHASE_0A] Edit Transaction Title
 * Purpose: Surgical update of bill names.
 */
export const updateGroupExpenseTitle = async (expenseId: string, newTitle: string) => {
  const isAndroid = Capacitor.getPlatform() === 'android';

  if (isAndroid) {
    const db = getDB();
    if (db) {
      // Update locally
      await db.run('UPDATE group_expenses SET title = ?, sync_status = "pending", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newTitle, expenseId]);
      
      // Fetch the full record to enqueue an UPSERT
      const res = await db.query('SELECT * FROM group_expenses WHERE id = ?', [expenseId]);
      if (res.values?.[0]) {
        const row = res.values[0];
        // 🛡️ SYNC CONSISTENCY: Strip SQLite-only columns before sending to cloud UPSERT
        const { sync_status, is_deleted, is_latest, version, updated_at, ...cloudPayload } = row;
        await enqueueSync('group_expenses', 'UPSERT', cloudPayload);
      }

      dispatchSyncUpdate();
      return true;
    }
  }

  const { error } = await supabase
    .from('group_expenses')
    .update({ title: newTitle })
    .eq('id', expenseId);

  if (error) throw error;
  return true;
};
