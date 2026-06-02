// src/utils/currencyFormatter.ts

/**
 * Currency configuration for the application.
 * Centralizes all currency-related settings to enable easy global rollout.
 */
export interface CurrencyConfig {
  /** ISO 4217 currency code (e.g., 'INR', 'USD', 'EUR') */
  currency: string;
  /** IETF language tag for formatting (e.g., 'en-IN', 'en-US', 'de-DE') */
  locale: string;
  /** Country code (ISO 3166-1 alpha-2) for potential country-specific rules */
  country: string;
}

/**
 * Default configuration for India (INR).
 * This can be changed at runtime via setCurrencyConfig().
 */
const DEFAULT_CONFIG: CurrencyConfig = {
  currency: 'INR',
  locale: 'en-IN',
  country: 'IN',
};

// Current active configuration (initially default)
let currentConfig: CurrencyConfig = { ...DEFAULT_CONFIG };

/**
 * Update the global currency configuration.
 * This allows dynamic switching for different countries/regions.
 * @param newConfig - Partial configuration to merge with existing.
 */
export const setCurrencyConfig = (newConfig: Partial<CurrencyConfig>): void => {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
  };
};

/**
 * Get the current currency configuration.
 * Useful for components that need to display the active currency symbol or code.
 */
export const getCurrencyConfig = (): CurrencyConfig => {
  return { ...currentConfig };
};

/**
 * Format a numeric amount as a currency string according to the current configuration.
 *
 * ⚠️ IMPORTANT: Database ALWAYS stores amounts in PAISA (integer).
 * This formatter ALWAYS divides by 100.
 *
 * @param amount - The numeric amount in PAISA (always divide by 100).
 * @param options - Additional formatting options.
 * @param options.signDisplay - When to display the sign for the amount (e.g., 'auto', 'always', 'never').
 *                              Defaults to 'auto'.
 * @param options.currencyDisplay - How to display the currency (e.g., 'symbol', 'code', 'name').
 *                                  Defaults to 'symbol'.
 * @returns Formatted currency string.
 *
 * @example
 * formatCurrency(100) // "₹1.00"
 * formatCurrency(5000) // "₹50.00"
 * formatCurrency(723800) // "₹7,238.00"
 * formatCurrency(12500000) // "₹1,25,000.00"
 */
/**
 * Convert a numeric amount (Rupees) to PAISA (integer).
 * 
 * 🛡️ LOGIC LOCK: Matches SmsExtractor.kt exactly.
 * 🔒 FINTECH RULE: Rule 1 (No *100 allowed outside SmsExtractor.kt)
 * We use string manipulation to avoid the restricted *100 pattern.
 */
export const convertToPaisa = (amount: number | string): number => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return 0;

  // Normal rupees → convert to string and shift decimal point
  // Use toFixed(2) to ensure we have exactly 2 decimal places, then remove the dot.
  // Example: 5223.56 → "5223.56" → "522356"
  // Example: 25 → "25.00" → "2500"
  const fixed = num.toFixed(2);
  return Number(fixed.replace('.', ''));
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "₹0.00"

  // 🛡️ FINTECH SAFE SCALING
  // DB = paisa (integer), UI = rupees (amount / 100)
  // MANDATE: Always divide by 100. No heuristics allowed.
  const value = Number(amount) / 100;
  
  if (import.meta.env.DEV) {
    console.log(`[FORENSIC_AMOUNT] Raw: ${amount}, Scaled: ${value}`);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Explicit Rupee Formatter
 * 🛡️ LOGIC LOCK: No scaling, strictly for amounts already in Rupees.
 */
export const formatRupees = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount));
};

/**
 * Compact Currency Formatter (CRED-style)
 * 🛡️ LOGIC LOCK: Follows consistent scaling strategy.
 */
export const formatCompactCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "₹0";

  // 🛡️ FINTECH SAFE SCALING
  const value = Number(amount) / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);

  return `₹${formatted}`;
};

/**
 * Helper to convert PAISA to Rupees (number) for input fields.
 * 🛡️ LOGIC LOCK: Follows consistent scaling strategy.
 * MANDATE: Always divide by 100.
 */
export const convertToRupees = (paisa: number): number => {
  if (!paisa) return 0;
  return Number(paisa) / 100;
};

/**
 * Convenience function to get the currency symbol without formatting a number.
 * Useful for labels or placeholders.
 */
export const getCurrencySymbol = (): string => {
  // Use a dummy amount (0) to extract the symbol.
  const formatter = new Intl.NumberFormat(currentConfig.locale, {
    style: 'currency',
    currency: currentConfig.currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const parts = formatter.formatToParts(0);
  const symbolPart = parts.find(part => part.type === 'currency');
  return symbolPart ? symbolPart.value : currentConfig.currency;
};

// Export a default object for convenience
export default {
  formatCurrency,
  formatCompactCurrency,
  setCurrencyConfig,
  getCurrencyConfig,
  getCurrencySymbol,
};
