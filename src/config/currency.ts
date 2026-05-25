/**
 * Currency Configuration
 * 
 * Centralized configuration for currency formatting and localization.
 * This allows the app to be easily adapted for different countries/currencies.
 * 
 * Current default: India (INR)
 */

export interface CurrencyConfig {
  /** ISO country code (e.g., 'IN', 'US') */
  countryCode: string;
  /** ISO currency code (e.g., 'INR', 'USD') */
  currencyCode: string;
  /** Locale for number formatting (e.g., 'en-IN', 'en-US') */
  locale: string;
  /** Currency symbol (e.g., '₹', '$') */
  symbol: string;
  /** Number of decimal places for the currency */
  decimalDigits: number;
}

export const DEFAULT_CURRENCY: CurrencyConfig = {
  countryCode: 'IN',
  currencyCode: 'INR',
  locale: 'en-IN',
  symbol: '₹',
  decimalDigits: 2,
};

/**
 * Format a number as currency according to the provided configuration.
 * @param amount - Numeric amount to format
 * @param config - Currency configuration (defaults to DEFAULT_CURRENCY)
 * @returns Formatted currency string (e.g., "₹12,34,567.89")
 */
export function formatCurrency(
  amount: number,
  config: CurrencyConfig = DEFAULT_CURRENCY
): string {
  // 🛡️ FINTECH SAFE SCALING
  // DB = paisa (integer), UI = rupees (amount / 100)
  // MANDATE: Always divide by 100. No heuristics allowed.
  const value = Number(amount) / 100;

  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'decimal',
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
  });
  return `${config.symbol}${formatter.format(value)}`;
}

/**
 * Get the default currency symbol (for quick access without full formatting)
 */
export function getCurrencySymbol(): string {
  return DEFAULT_CURRENCY.symbol;
}

/**
 * Get the default currency code.
 */
export function getCurrencyCode(): string {
  return DEFAULT_CURRENCY.currencyCode;
}
