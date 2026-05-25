import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { convertToPaisa, convertToRupees } from "@/utils/currencyFormatter";
import { Capacitor } from '@capacitor/core';
import { getLocalTransactions, saveLocalTransaction, enqueueSync, getDB } from '@/integrations/sqlite';
import { safeDate, isValidDate, isCurrentMonth, isLastMonth, toLocalStart, toLocalEnd } from "@/utils/dateFilters";
import { getNativeTransactions } from "@/integrations/smsBridge";

export const NEW_USER_RETENTION_MONTHS = 2;
export const ESTABLISHED_USER_RETENTION_MONTHS = 6; // 🛡️ [BK-GOV-RETENTION] Strictly 180 days (6 months)
export const NEW_USER_GRACE_DAYS = 30;

export type LedgerOrigin =
  | "cloud-transaction"
  | "cloud-expense"
  | "native-transaction"
  | "manual-entry"
  | "salary";

export type LedgerSource = "sms" | "manual" | "voice" | "paste" | "salary";

export interface UnifiedLedgerEntry {
  id: string;
  amount: number;
  category: string;
  paymentMode: string;
  date: string;
  note: string;
  payee: string;
  direction: "debit" | "credit";
  type: "expense" | "income";
  source: LedgerSource;
  origin: LedgerOrigin;
  smsHash?: string | null;
  idempotencyKey?: string | null;
  canonicalKey?: string | null;
  updatedAt?: string | null;
  isDeleted?: boolean;
}

export interface LedgerWindow {
  start: Date;
  end: Date;
  monthsToKeep: number;
  isNewUserWindow: boolean;
}

/**
 * 🛡️ [SMART SMS FILTER HARDENING]
 * Strictly ignores: OTP, promotional, marketing, offers, recharge ads, reward points, spam, bank advertisements.
 * Only allows: real debit, real credit, UPI, IMPS, NEFT, salary, bill payment, ATM, cash withdrawal, bank charges.
 */
export const isValidSmsTransaction = (row: any): boolean => {
  if (!row) return false;

  const sourceRaw = row.entry_source || row.source;
  const hash = row.sms_hash || row.smsHash || "";
  const originRaw = row.origin;

  // --- NATIVE ENGINE TRUST PATH ---
  // 🛡️ [NATIVE_TRUST_SAFEGUARD]
  // 🚀 FIX: Correctly check for raw bridge rows without using String() on nulls.
  // Bridge rows have sms_hash/smsHash but no source/origin until mapped.
  const isNative = hash && (sourceRaw === 'sms' || originRaw === 'native-transaction' || (!sourceRaw && !originRaw));
  
  if (isNative) {
    if (import.meta.env.DEV) {
      console.log(`[FORENSIC_FIREWALL] TRUST: Native SMS detected. Hash: '${String(hash).substring(0, 8)}'`);
    }
    return true;
  }

  // --- MANUAL TRANSACTION BYPASS ---
  const sourceStr = String(sourceRaw || '').toLowerCase();
  const hashStr = String(hash || '');
  const isManualSource = sourceRaw && ['manual', 'voice', 'paste', 'salary', 'income', 'legacy-manual'].includes(sourceStr);
  const isManualHash = hashStr.startsWith('man:') || hashStr.startsWith('voice:') || hashStr.startsWith('inc:');

  if (isManualSource || isManualHash) {
    if (import.meta.env.DEV) {
      console.log(`[FORENSIC_FIREWALL] BYPASS: Manual entry detected. Source: '${sourceStr}', Hash: '${hashStr.substring(0, 8)}'`);
    }
    return true;
  }

  // --- RAW CLOUD SMS SPAM FILTER ---
  const textToScan = `${row.description || ''} ${row.note || ''} ${row.payee || ''} ${row.sender || ''} ${row.merchantName || ''}`.toLowerCase();
  
  const spamKeywords = [
    'otp', 'promotional', 'marketing', 'offer', 'recharge', 'reward', 'spam', 
    'advertisement', 'cashback', 'coupon', 'win', 'lucky', 'discount', 'free', 'verify'
  ];
  
  if (spamKeywords.some(keyword => textToScan.includes(keyword))) {
    return false;
  }

  const validKeywords = [
    'dr', 'cr', 'debited', 'credited', 'paid', 'sent', 'received', 
    'upi', 'imps', 'neft', 'atm', 'withdrawal', 'salary', 'bill', 
    'charge', 'fee', 'emi', 'loan', 'transfer', 'txn'
  ];
  
  if (validKeywords.some(k => textToScan.includes(k))) {
    return true;
  }

  return Number(row.amount || 0) > 0;
};

/**
 * Deterministic SHA-like hash for string data
 */
export const generateDataHash = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Canonical Identity Resolver
 * 🛡️ LOGIC LOCK: Ensures consistent 'Merchant > Sender > Fallback' hierarchy.
 * 🚀 FIX: Move sender to end of priority list. 
 */
export const derivePayeeName = (row: any): string => {
  return (
    row.merchantName || 
    row.merchant_name || 
    row.payee || 
    row.description || 
    row.sender || 
    "Unidentified Payee"
  ).trim();
};

export const normalizeLedgerSource = (raw?: string | null): LedgerSource => {
  switch ((raw || "").toLowerCase()) {
    case "voice":
      return "voice";
    case "paste":
      return "paste";
    case "manual":
      return "manual";
    case "salary":
      return "salary";
    default:
      return "sms";
  }
};

export const getLedgerWindow = (
  userCreatedAt?: string | null,
  now: Date = new Date(),
): LedgerWindow => {
  const createdAt = userCreatedAt ? new Date(userCreatedAt) : null;
  const hasValidCreatedAt = createdAt && !Number.isNaN(createdAt.getTime());
  
  const monthsSinceCreation = hasValidCreatedAt
    ? (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
    : ESTABLISHED_USER_RETENTION_MONTHS;

  const monthsToKeep = Math.min(
    ESTABLISHED_USER_RETENTION_MONTHS,
    Math.max(NEW_USER_RETENTION_MONTHS, monthsSinceCreation + 2),
  );

  const endBuffer = new Date(now);
  endBuffer.setDate(endBuffer.getDate() + 1);

  return {
    start: startOfMonth(subMonths(now, monthsToKeep - 1)),
    end: endOfMonth(endBuffer),
    monthsToKeep,
    isNewUserWindow: monthsToKeep < ESTABLISHED_USER_RETENTION_MONTHS,
  };
};

export const isWithinLedgerWindow = (
  dateLike: string | Date | null | undefined,
  window: LedgerWindow,
): boolean => {
  const d = safeDate(dateLike);
  if (!d) return false;
  return d >= window.start && d <= window.end;
};

export const toUnifiedTransactionEntry = (row: any): UnifiedLedgerEntry => {
  const amount = Number(row.amount || 0);
  const type = String(row.type || "expense").toLowerCase() as "expense" | "income";
  const source = normalizeLedgerSource(row.entry_source || row.source);
  const payee = derivePayeeName(row);
  const smsHash = row.sms_hash || row.smsHash || null;

  return {
    id: String(row.id),
    amount,
    category: row.category || "General",
    paymentMode: row.payment_mode || row.paymentMode || "Direct",
    date: row.date || row.created_at,
    note: row.description || row.note || "",
    payee,
    direction: type === "income" ? "credit" : "debit",
    type,
    source,
    origin: row.origin || "cloud-transaction",
    smsHash,
    idempotencyKey: row.idempotency_key || row.idempotencyKey || smsHash || null,
    canonicalKey: row.canonical_key || row.canonicalKey || null,
    updatedAt: row.updated_at || row.updatedAt || row.created_at || null,
    isDeleted: Boolean(row.is_deleted),
  };
};

export const toUnifiedExpenseEntry = (row: any): UnifiedLedgerEntry => {
  const amount = Number(row.amount || 0);
  const payee = derivePayeeName(row);

  return {
    id: String(row.id),
    amount,
    category: row.category || "General",
    paymentMode: row.payment_mode || row.paymentMode || "App",
    date: row.expense_date || row.date || row.created_at,
    note: row.description || row.note || "",
    payee,
    direction: "debit",
    type: "expense",
    source: "manual",
    origin: "cloud-expense",
    updatedAt: row.updated_at || row.created_at || null,
  };
};

export const toUnifiedNativeEntry = (row: any): UnifiedLedgerEntry => {
  const type = String(row.type || "").toLowerCase() === "credit" ? "income" : "expense";
  const payee = derivePayeeName(row);
  const amount = Number(row.amount || 0);
  const date = row.date || (row.timestamp ? new Date(Number(row.timestamp)).toISOString() : new Date().toISOString());
  const smsHash = row.smsHash || row.sms_hash || null;
  const isDeleted = Boolean(row.is_deleted);

  return {
    id: String(row.id),
    amount,
    category: row.category || row.merchantCategory || "SMS Transaction",
    paymentMode: row.paymentMode || row.payment_mode || (type === "income" ? "Bank Credit" : "SMS Engine"),
    date,
    note: row.note || row.reference || row.description || "",
    payee,
    direction: type === "income" ? "credit" : "debit",
    type,
    source: "sms",
    origin: "native-transaction",
    smsHash,
    idempotencyKey: row.idempotencyKey || row.idempotency_key || smsHash || null,
    canonicalKey: row.canonicalKey || row.canonical_key || null,
    updatedAt: row.updatedAt || row.updated_at || row.created_at || null,
    isDeleted,
    };
};

export const toUnifiedSalaryEntry = (salaryAmount: number, date: string): UnifiedLedgerEntry => {
  const amount = Number(salaryAmount || 0);
  return {
    id: `salary:${date}`,
    amount,
    category: "Salary",
    paymentMode: "Income Engine",
    date,
    note: "Manual salary entry",
    payee: "Salary",
    direction: "credit",
    type: "income",
    source: "salary",
    origin: "salary",
    updatedAt: date,
  };
};

const entryPriority: Record<LedgerOrigin, number> = {
  "cloud-transaction": 4,
  "cloud-expense": 3,
  "native-transaction": 2,
  "manual-entry": 1,
  "salary": 5
};

export const mergeUnifiedLedgerEntries = (
  entries: UnifiedLedgerEntry[]
): UnifiedLedgerEntry[] => {
  if (entries.length === 0) return [];

  if (import.meta.env.DEV) {
    console.log(`[DEDUP_START] Processing ${entries.length} raw entries.`);
  }

  // 🛡️ [CONNECTED_COMPONENTS_GROUPING]
  // We use a Map to track groups of linked entries.
  // A link can be an ID, smsHash, idempotencyKey, or canonicalKey.
  const groups: UnifiedLedgerEntry[][] = [];
  const entryToGroupIndex = new Map<string, number>();

  const getCanonicalKey = (entry: UnifiedLedgerEntry): string | null => {
    const normAmount = Math.round(Number(entry.amount || 0));
    const dateObj = safeDate(entry.date);
    const ts = Math.floor((dateObj?.getTime() || 0) / 1000);
    // 🛡️ [PARITY_NORMALIZATION] Match SQL REPLACE(REPLACE(REPLACE(..., ' ', ''), '.', ''), '-', '') logic.
    const normPayee = (entry.payee || "").toLowerCase().replace(/\s/g, "").replace(/\./g, "").replace(/-/g, "");
    return (ts > 0 && normAmount > 0) ? `canon:${normAmount}:${ts}:${normPayee}:${entry.type}` : null;
  };

  for (const entry of entries) {
    if (entry.isDeleted) continue;

    const keys = [
      `id:${entry.id}`,
      entry.smsHash ? `hash:${entry.smsHash}` : null,
      entry.idempotencyKey ? `idem:${entry.idempotencyKey}` : null,
      entry.canonicalKey ? (entry.canonicalKey.startsWith('canon:') ? entry.canonicalKey : `canon:${entry.canonicalKey}`) : null,
      getCanonicalKey(entry)
    ].filter(Boolean) as string[];

    let targetGroupIndex = -1;

    // Find if any key already belongs to a group
    for (const key of keys) {
      if (entryToGroupIndex.has(key)) {
        targetGroupIndex = entryToGroupIndex.get(key)!;
        break;
      }
    }

    if (targetGroupIndex === -1) {
      // Create new group
      targetGroupIndex = groups.length;
      groups.push([entry]);
    } else {
      // Add to existing group
      groups[targetGroupIndex].push(entry);
    }

    // Map all keys of this entry to the group index
    for (const key of keys) {
      entryToGroupIndex.set(key, targetGroupIndex);
    }
  }

  // Final Survivor Selection
  const finalResult: UnifiedLedgerEntry[] = [];
  
  for (const group of groups) {
    if (group.length === 0) continue;

    // Sort within group to pick the best survivor
    // Priority: Cloud > Native > Manual
    // Tie-breaker: Latest updatedAt
    const survivor = group.sort((a, b) => {
      const priorityA = entryPriority[a.origin] || 0;
      const priorityB = entryPriority[b.origin] || 0;
      if (priorityB !== priorityA) return priorityB - priorityA;

      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;

      return String(b.id).localeCompare(String(a.id));
    })[0];

    if (group.length > 1 && import.meta.env.DEV) {
      console.warn(`[DEDUP_GROUP] Collapsed ${group.length} records. Survivor: ${survivor.id} (${survivor.origin})`);
      group.forEach(m => {
        if (m.id !== survivor.id) {
          console.log(`  - Rejected: ${m.id} (Amt: ${m.amount}, Origin: ${m.origin})`);
        }
      });
    }

    if (import.meta.env.DEV && survivor.amount < 100) {
       console.error(`[FINTECH_CORRUPTION_ALERT] Very small amount detected in dedup output: ${survivor.amount} (ID: ${survivor.id}, Source: ${survivor.source})`);
    }

    finalResult.push(survivor);
  }

  // Global sort for render stability
  const sorted = finalResult.sort((a, b) => {
    const getTs = (e: UnifiedLedgerEntry) => safeDate(e.date)?.getTime() || 0;
    const diff = getTs(b) - getTs(a);
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  });

  if (import.meta.env.DEV) {
    console.log(`[FORENSIC_MERGE_FINAL] Input: ${entries.length}, Output: ${sorted.length}`);
  }

  return sorted;
};

export const fetchUnifiedLedger = async (userId: string, window: LedgerWindow, limit: number = 500) => {
  let nativeRows: any[] = [];
  let localSqlRows: any[] = [];
  let localSqlExpRows: any[] = [];
  
  if (Capacitor.getPlatform() === 'android') {
    const res = await getNativeTransactions(userId, undefined, limit);
    nativeRows = res.transactions || [];
    
    const db = getDB();
    if (db) {
      try {
        const [txRes, expRes] = await Promise.allSettled([
          db.query(`SELECT * FROM transactions WHERE user_id = ? AND COALESCE(is_deleted, 0) = 0`, [userId]),
          db.query(`SELECT * FROM expenses WHERE user_id = ? AND COALESCE(is_deleted, 0) = 0`, [userId])
        ]);

        if (txRes.status === 'fulfilled') localSqlRows = txRes.value.values || [];
        if (expRes.status === 'fulfilled') localSqlExpRows = expRes.value.values || [];
      } catch (err) {
        console.warn("⚠️ [Ledger] SQLite query failed:", err);
      }
    }
  }

  let cloudTxRows: any[] = [];
  let cloudExpRows: any[] = [];
  
  if (navigator.onLine) {
    try {
      const [txResult, expResult] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).eq('is_deleted', false).gte('date', window.start.toISOString()).order('date', { ascending: false }).limit(limit),
        supabase.from('expenses').select('*').eq('user_id', userId).eq('is_deleted', false).order('expense_date', { ascending: false }).limit(limit),
      ]);
      
      if (!txResult.error) cloudTxRows = txResult.data || [];
      if (!expResult.error) cloudExpRows = expResult.data || [];
    } catch (err) {
      console.warn("⚠️ [Ledger] Cloud fetch failed, falling back to local only", err);
    }
  }

  const nativeEntries = nativeRows.filter(isValidSmsTransaction).map(toUnifiedNativeEntry).filter(entry => isWithinLedgerWindow(entry.date, window));
  const localSqlEntries = localSqlRows.filter(isValidSmsTransaction).map(toUnifiedTransactionEntry).filter(entry => isWithinLedgerWindow(entry.date, window));
  const localSqlLegacyEntries = localSqlExpRows.map((row: any) => toUnifiedExpenseEntry(row)).filter(entry => isWithinLedgerWindow(entry.date, window));
  const cloudTxEntries = cloudTxRows.filter(isValidSmsTransaction).map(toUnifiedTransactionEntry).filter(entry => isWithinLedgerWindow(entry.date, window));
  const cloudExpEntries = cloudExpRows.map((row: any) => toUnifiedExpenseEntry(row)).filter(entry => isWithinLedgerWindow(entry.date, window));

  const merged = mergeUnifiedLedgerEntries([
    ...nativeEntries, ...localSqlEntries, ...localSqlLegacyEntries, ...cloudTxEntries, ...cloudExpEntries
  ]);

  return merged;
};

export const purgeExpiredCloudLedgerData = async (userId: string, window: LedgerWindow) => {
  if (!userId || !window.start) return;
  try {
    const cutoffDate = window.start.toISOString();
    await supabase.from('transactions').delete().eq('user_id', userId).lt('date', cutoffDate);
    await supabase.from('expenses').delete().eq('user_id', userId).lt('expense_date', cutoffDate);
  } catch (err) {
    console.error("Purge expired data failed:", err);
  }
};

export const createLedgerTransaction = async (input: {
  userId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  payment_mode: string;
  type: "expense" | "income";
  source: LedgerSource;
}) => {
  const rawDate = input.date || new Date().toISOString();
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim()) ? toLocalStart(new Date(rawDate)).toISOString() : rawDate;

  // 🛡️ [PHASE_1_AMOUNT_HARDENING]
  // Manual and voice entry flow currently passes raw Rupees. 
  // We MUST convert to integer Paisa before any persistence or sync.
  const amountPaisa = convertToPaisa(input.amount);

  const payload = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    amount: amountPaisa, // Enforce Paisa
    category: input.category,
    date: timestamp,
    description: input.description,
    payment_mode: input.payment_mode,
    type: input.type,
    entry_source: input.source,
    sync_status: 'pending',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (Capacitor.getPlatform() === 'android') {
    const { saveLocalTransaction, enqueueSync } = await import('@/integrations/sqlite');
    await saveLocalTransaction(payload);
    await enqueueSync('transactions', 'INSERT', payload);
    window.dispatchEvent(new Event('newLocalTransaction'));
    return payload;
  }

  const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
  if (error) throw error;
  return data;
};

export const getLedgerRetentionMessage = (window: LedgerWindow): string => {
  const months = window.monthsToKeep;
  const isNewUser = window.isNewUserWindow;
  return isNewUser ? `Personal Ledger: Optimized for ${months} months (New User Grace Phase)` : `Personal Ledger: Advanced Archiving enabled (Last ${months} Months)`;
};
