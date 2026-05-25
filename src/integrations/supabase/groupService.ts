/**
 * =========================================================
 * GROUP SERVICE (ENTERPRISE READY)
 * Handles:
 * ✔ Group creation
 * ✔ Member management
 * ✔ Expense creation
 * ✔ Expense listing
 * ✔ Group totals
 * =========================================================
 */

import { supabase } from "@/integrations/supabase/client";

/* =========================================================
   TYPES
========================================================= */

export interface Group {
  id: string;
  name: string;
  user_id: string;
  member_count: number;
  created_at?: string;
}

export interface GroupMember {
  id?: string;
  group_id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface GroupExpense {
  id?: string;
  group_id: string;
  title: string;
  category: string;
  amount: number;
  paid_by: string;
  user_id: string;
  notes?: string | null;
  created_at?: string;
}

/* =========================================================
   CREATE GROUP
========================================================= */
export async function createGroup(name: string, userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Create group error:", error.message);
    return null;
  }

  // auto add owner
  await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: userId,
    name: "You",
  });

  return data as Group;
}

/* =========================================================
   GET USER GROUPS
========================================================= */
export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, groups(*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Get groups error:", error.message);
    return [];
  }

  return data.map((g: any) => g.groups) as Group[];
}

/* =========================================================
   ADD MEMBER
========================================================= */
export async function addMemberToGroup(
  groupId: string,
  userId: string,
  name: string
) {
  const cleanName = name.trim();
  if (!cleanName) return null;

  const { data, error } = await supabase
    .from("group_members")
    .upsert({
      group_id: groupId,
      user_id: userId,
      name: cleanName,
    }, { onConflict: 'group_id,name' })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.warn("Member already exists in this group");
      return null;
    }
    console.error("Add member error:", error.message);
    return null;
  }

  return data as GroupMember;
}

/* =========================================================
   GET GROUP MEMBERS
========================================================= */
export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);

  if (error) {
    console.error("Members fetch error:", error.message);
    return [];
  }

  return data as GroupMember[];
}

/* =========================================================
   ADD EXPENSE (RPC VERSION)
========================================================= */
export async function addGroupExpense(expense: any) {
  // Convert custom_splits map to p_splits array if it's not already
  let finalSplits = expense.p_splits || expense.splits;
  
  if (!finalSplits && expense.custom_splits) {
    // Convert { "member_id": amount } to [{ "user_id": "...", "share_amount": amount }]
    // Note: This requires mapping member_id to user_id.
    // However, the RPC now handles the array format.
    // For simplicity, if custom_splits is passed, we try to convert it.
    finalSplits = Object.entries(expense.custom_splits).map(([memberId, amount]) => ({
      member_id: memberId,
      share_amount: amount
    }));
  }

  const { data, error } = await supabase.rpc("insert_group_expense_with_split", {
    p_group_id: expense.group_id,
    p_user_id: expense.user_id,
    p_title: expense.title,
    p_amount: expense.amount,
    p_paid_by_member_id: expense.paid_by_member_id || expense.paid_by,
    p_split_type: expense.split_type || "equal",
    p_category: expense.category || "Others",
    p_notes: expense.notes || null,
    p_splits: finalSplits || null,
    p_idempotency_key: expense.idempotency_key || expense.p_idempotency_key || null,
    p_id: expense.id || expense.p_id || null,
  });

  if (error) {
    console.error("Add expense RPC error:", error.message);
    return null;
  }

  return data;
}

/* =========================================================
   GET GROUP EXPENSES
========================================================= */
export async function getGroupExpenses(groupId: string) {
  const { data, error } = await supabase
    .from("group_expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch expenses error:", error.message);
    return [];
  }

  return data as GroupExpense[];
}

/* =========================================================
   DELETE EXPENSE
========================================================= */
export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from("group_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    console.error("Delete expense error:", error.message);
    return false;
  }

  return true;
}

/* =========================================================
   GROUP TOTAL CALCULATION
========================================================= */
export async function getGroupTotal(groupId: string) {
  const { data, error } = await supabase
    .from("group_expenses")
    .select("amount")
    .eq("group_id", groupId);

  if (error || !data) return 0;

  return data.reduce((sum, row) => sum + Number(row.amount), 0);
}
