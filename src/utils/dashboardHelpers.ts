import { UnifiedLedgerEntry } from '@/features/transactions/ledger';

export type SalaryRecord = {
  id?: string;
  amount?: number | string | null;
  monthly_salary?: number | string | null;
  created_at?: string | null;
  month_year?: string | null;
};

export type DashboardTransaction = {
  id: string;
  smsHash?: string;
  amount: number;
  category: string;
  payment_mode: string;
  date: string;
  note: string;
  sender?: string;
  type: 'income' | 'expense';
  source?: string;
  origin?: string;
  direction?: 'debit' | 'credit';
  idempotencyKey?: string;
  updatedAt?: string;
};

export const toDashboardTransaction = (entry: UnifiedLedgerEntry): DashboardTransaction => ({
  id: entry.id,
  smsHash: entry.smsHash || undefined,
  amount: entry.amount,
  category: entry.category,
  payment_mode: entry.paymentMode,
  date: entry.date,
  note: entry.note,
  sender: entry.payee,
  type: entry.type,
  source: entry.source,
  origin: entry.origin,
  direction: entry.direction,
  idempotencyKey: entry.idempotencyKey || undefined,
  updatedAt: entry.updatedAt || undefined,
});

export const getSalaryAmount = (salary: SalaryRecord | null | undefined) => {
  if (!salary) return 0;
  return Number(salary.amount ?? salary.monthly_salary ?? 0) || 0;
};
