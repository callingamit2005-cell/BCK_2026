/**
 * dateFilters.ts - Date Filtering Utilities for UI
 * Current month transaction filtering for dashboard views
 * 
 * Temperature: 0.1 (Production Safe)
 * - Frontend only (NO backend changes)
 * - Pure filter logic (NO data mutations)
 */

import { parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Deterministic Date Parser (Android + Web Parity)
 * Prevents platform-specific parsing inconsistencies in WebView.
 */
export const safeDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  
  try {
    // 🛡️ [SQLITE_DATE_RESILIENCE]
    // SQLite strings often use "YYYY-MM-DD HH:MM:SS" (space instead of T).
    // parseISO is strict; we must normalize.
    let normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
    
    // 🛡️ [TIMEZONE_PARITY_FIX]
    // If string has no 'Z' or offset (+/-), browsers treat T-formatted strings as LOCAL.
    // We MUST force UTC parity to ensure Native and Cloud records collide.
    if (typeof normalized === 'string' && !normalized.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
      normalized = normalized + 'Z';
    }

    const parsed = typeof normalized === 'string' ? parseISO(normalized) : new Date(normalized);
    
    if (isNaN(parsed.getTime())) {
      // Final fallback for non-ISO legacy strings
      const fallback = new Date(value);
      return isNaN(fallback.getTime()) ? null : fallback;
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

/**
 * Boundary Normalization for Local Time
 */
export const toLocalStart = (date: Date): Date => startOfDay(date);
export const toLocalEnd = (date: Date): Date => endOfDay(date); // 23:59:59.999 local time

/**
 * Check if a value is a valid date
 * @param value - Any value to check
 * @returns true if valid date, false otherwise
 */
export const isValidDate = (value: unknown): boolean => {
  if (!value) return false;
  const d = safeDate(value);
  return d !== null;
};

/**
 * Check if a date is in the current month
 */
export const isCurrentMonth = (date: string | Date): boolean => {
  const d = safeDate(date);
  if (!d) return false;
  
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

/**
 * Check if a date is in the last month
 */
export const isLastMonth = (date: Date | string, now: Date = new Date()): boolean => {
  const d = safeDate(date);
  if (!d) return false;
  
  const firstDayCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const firstDayLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  return d >= firstDayLastMonth && d < firstDayCurrentMonth;
};

/**
 * Filter transactions to show only current month
 * @param transactions - Array of transaction objects with date field
 * @returns Filtered array containing only current month transactions
 */
export const filterCurrentMonth = <T extends { date?: string | Date; created_at?: string | Date }>(
  transactions: T[]
): T[] => {
  return transactions.filter(tx => {
    const dateField = tx.date || tx.created_at;
    return dateField ? isCurrentMonth(dateField) : false;
  });
};

/**
 * Get current month range for display
 * @returns Object with start and end date strings
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    monthYear: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
};
