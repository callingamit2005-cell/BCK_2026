import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeSmsTransaction {
  id: string | number;
  smsHash?: string | null;
  amount: number | string;
  type?: string | null;
  sender?: string | null;
  timestamp?: string | number | null;
  merchantName?: string | null;
  reference?: string | null;
  currency?: string | null;
  accountRef?: string | null;
  merchantCategory?: string | null;
  paymentHandle?: string | null;
  location?: string | null;
  balance?: string | null;
  parsedAt?: number | null;
  syncStatus?: string | null;
  updatedAt?: number | null;
  userId?: string | null;
}

export interface SmsBridgePlugin {
  getTransactions(options?: {
    userId?: string;
    fromDate?: number;
    toDate?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions?: NativeSmsTransaction[]; fromDate?: number; toDate?: number; count?: number; offset?: number; limit?: number }>;
  getPendingTransactions(options: { limit: number; userId: string }): Promise<{ transactions: NativeSmsTransaction[] }>;
  deleteTransaction(options: { id: number | string }): Promise<void>;
  deleteAllTransactions(): Promise<{ count: number }>;
  upsertTransaction(options: { transaction: NativeSmsTransaction }): Promise<{ id: number }>;
  upsertTransactions(options: { transactions: NativeSmsTransaction[] }): Promise<{ count: number }>;
  scanHistoricalSms(options?: { days?: number }): Promise<{ scanned: number }>;
  isAppInstalled(options: { packageName: string }): Promise<{ installed: boolean }>;
  checkSmsPermission(): Promise<{ status: string }>;
  requestSmsPermission(): Promise<{ status: string }>;
  checkNotificationPermission(): Promise<{ status: string }>;
  requestNotificationPermission(): Promise<{ status: string }>;
  openAppSettings(): Promise<void>;
  setSession(options: { userId: string; accessToken: string }): Promise<void>;
  updateSyncStatus(options: { id: number; status: string }): Promise<void>;
  updateSyncSession(options: {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }): Promise<void>;
  clearSyncSession(): Promise<void>;
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<{ remove: () => void }> & { remove: () => void };
}

// ✅ Centralized registration to prevent "registered multiple times" errors
const SmsBridge = registerPlugin<SmsBridgePlugin>('SmsBridge');

/**
 * PRODUCTION GUARD:
 * Safe wrapper for addListener that handles non-Android platforms silently.
 */
export const addSmsListener = async (eventName: string, callback: (data: any) => void) => {
  if (Capacitor.getPlatform() !== 'android') {
    return { remove: () => {} };
  }
  try {
    return await SmsBridge.addListener(eventName, callback);
  } catch (err) {
    console.warn("SmsBridge.addListener failed:", err);
    return { remove: () => {} };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for getTransactions.
 * Enforces dynamic sync window based on user status:
 * - New User (< 30 days): 2-month window (Previous + Current)
 * - Old User (>= 30 days): 6-month window (Last 5 + Current)
 */
export const getNativeTransactions = async (
  userId?: string,
  userFirstLoginDate?: string,
  limit: number = 500,
  offset: number = 0
) => {
  if (Capacitor.getPlatform() !== 'android') {
    return { transactions: [] };
  }
  try {
    const now = new Date();
    
    // Determine window size using calendar-month distance (matching ledger.ts)
    const userCreated = userFirstLoginDate ? new Date(userFirstLoginDate) : now;
    const monthsSinceCreation = (now.getFullYear() - userCreated.getFullYear()) * 12 +
        (now.getMonth() - userCreated.getMonth());
    
    const monthsToKeep = Math.min(6, Math.max(2, monthsSinceCreation + 2));
    const monthsToLookBack = monthsToKeep - 1;

    // End of current month (strict boundary)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const endOfCurrentMonth = startOfNextMonth.getTime() - 1;

    // Start of lookback period
    const startOfLookback = new Date(
      now.getFullYear(),
      now.getMonth() - monthsToLookBack,
      1,
      0, 0, 0, 0
    ).getTime();

    console.log(`[SmsBridge] Fetching transactions: ${monthsToLookBack + 1} month window`, {
      from: new Date(startOfLookback).toISOString(),
      to: new Date(endOfCurrentMonth).toISOString(),
      userId,
      limit,
      offset
    });

    return await SmsBridge.getTransactions({
      userId,
      fromDate: startOfLookback,
      toDate: endOfCurrentMonth,
      limit,
      offset,
    });
  } catch (err) {
    console.error("SmsBridge.getTransactions failed:", err);
    return { transactions: [] };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for getPendingTransactions.
 */
export const getPendingNativeTransactions = async (userId: string, limit: number = 50) => {
  if (Capacitor.getPlatform() !== 'android') {
    return { transactions: [] };
  }
  try {
    return await SmsBridge.getPendingTransactions({ userId, limit });
  } catch (err) {
    console.error("SmsBridge.getPendingTransactions failed:", err);
    return { transactions: [] };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for purging old native transactions.
 * Removes transactions older than the given cutoff timestamp.
 */
export const purgeExpiredNativeTransactions = async (userId: string, cutoff: number) => {
  if (Capacitor.getPlatform() !== 'android') return;
  if (!userId || !cutoff) return;
  
  try {
    // Fetch all transactions older than cutoff (from 0 to cutoff - 1)
    const res = await SmsBridge.getTransactions({
      userId,
      fromDate: 0,
      toDate: cutoff - 1,
      limit: 1000, // Batch limit to preserve memory
    });

    if (res.transactions && res.transactions.length > 0) {
      console.log(`[SmsBridge] Purging ${res.transactions.length} expired native transactions...`);
      // Use allSettled to ensure one failure doesn't block the rest
      await Promise.allSettled(
        res.transactions.map(tx => {
          if (tx.id) return SmsBridge.deleteTransaction({ id: tx.id });
          return Promise.resolve();
        })
      );
    }
  } catch (err) {
    console.error("SmsBridge.purgeExpiredNativeTransactions failed:", err);
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for deleteTransaction.
 */
export const deleteNativeTransaction = async (id: string | number) => {
  if (Capacitor.getPlatform() !== 'android') return;
  if (!id) {
    console.warn("deleteNativeTransaction: invalid id");
    return;
  }
  try {
    await SmsBridge.deleteTransaction({ id });
  } catch (err) {
    console.error("SmsBridge.deleteTransaction failed:", err);
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for deleteAllTransactions.
 */
export const clearNativeTransactions = async () => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await SmsBridge.deleteAllTransactions();
  } catch (err) {
    console.error("SmsBridge.deleteAllTransactions failed:", err);
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for upsertTransaction.
 * Only called when smsHash is present — native DB keyed on smsHash.
 */
export const upsertNativeTransaction = async (transaction: NativeSmsTransaction) => {
  if (Capacitor.getPlatform() !== 'android') return;
  if (!transaction.smsHash) {
    console.warn("upsertNativeTransaction: smsHash missing — skipping native upsert for id:", transaction.id);
    return;
  }
  try {
    await SmsBridge.upsertTransaction({ transaction });
  } catch (err) {
    console.error("SmsBridge.upsertTransaction failed:", err);
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for upsertTransactions (Batch).
 */
export const upsertNativeTransactions = async (transactions: NativeSmsTransaction[]) => {
  if (Capacitor.getPlatform() !== 'android') return { count: 0 };
  if (!transactions || transactions.length === 0) return { count: 0 };
  
  try {
    return await SmsBridge.upsertTransactions({ transactions });
  } catch (err) {
    console.error("SmsBridge.upsertTransactions failed:", err);
    return { count: 0 };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for isAppInstalled.
 */
export const checkIsAppInstalled = async (packageName: string): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'android') return false;
  try {
    const res = await SmsBridge.isAppInstalled({ packageName });
    return res.installed;
  } catch (err) {
    return false;
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for checkSmsPermission.
 */
export const checkSmsPermission = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return { status: 'denied' };
  }
  try {
    return await SmsBridge.checkSmsPermission();
  } catch (err) {
    console.error("SmsBridge.checkSmsPermission failed:", err);
    return { status: 'denied' };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for requestSmsPermission.
 */
export const requestSmsPermission = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return { status: 'denied' };
  }
  try {
    return await SmsBridge.requestSmsPermission();
  } catch (err) {
    console.error("SmsBridge.requestSmsPermission failed:", err);
    return { status: 'denied' };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for checkNotificationPermission.
 */
export const checkNotificationPermission = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return { status: 'granted' }; // Implicit on web for UI purposes
  }
  try {
    return await SmsBridge.checkNotificationPermission();
  } catch (err) {
    console.error("SmsBridge.checkNotificationPermission failed:", err);
    return { status: 'denied' };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for requestNotificationPermission.
 */
export const requestNotificationPermission = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return { status: 'granted' };
  }
  try {
    return await SmsBridge.requestNotificationPermission();
  } catch (err) {
    console.error("SmsBridge.requestNotificationPermission failed:", err);
    return { status: 'denied' };
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for openAppSettings.
 */
export const openAppSettings = async () => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await SmsBridge.openAppSettings();
  } catch (err) {
    console.error("SmsBridge.openAppSettings failed:", err);
  }
};

/**
 * PRODUCTION GUARD:
 * Safe wrapper for scanHistoricalSms.
 */
export const scanHistoricalSms = async (days: number = 60) => {
  if (Capacitor.getPlatform() !== 'android') {
    return { scanned: 0 };
  }
  try {
    return await SmsBridge.scanHistoricalSms({ days });
  } catch (err) {
    console.error("SmsBridge.scanHistoricalSms failed:", err);
    return { scanned: 0 };
  }
};

export default SmsBridge;
