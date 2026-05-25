export type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares';

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface GroupExpenseRow {
  id: string;
  group_id: string;
  title: string;
  category: string;
  amount: number;
  paid_by: string;
  paid_by_member_id?: string;
  user_id: string;
  split_type: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseSplitRow {
  id: string;
  expense_id: string;
  group_id: string;
  member_id: string;
  share_amount: number;
  user_id: string;
  created_at?: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  paid: number;
  owes: number;
  net: number;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

export interface SplitResult {
  memberId: string;
  name: string;
  shareAmount: number;
}
