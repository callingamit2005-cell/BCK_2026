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
  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (error) {
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
   ADD EXPENSE
========================================================= */
export async function addGroupExpense(expense: GroupExpense) {
  const { data, error } = await supabase
    .from("group_expenses")
    .insert({
      group_id: expense.group_id,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      paid_by: expense.paid_by,
      user_id: expense.user_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Add expense error:", error.message);
    return null;
  }

  return data as GroupExpense;
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
