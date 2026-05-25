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
 * @param amount - The numeric amount to format.
 * @param options - Additional formatting options.
 * @param options.signDisplay - When to display the sign for the amount (e.g., 'auto', 'always', 'never').
 *                              Defaults to 'auto'.
 * @param options.currencyDisplay - How to display the currency (e.g., 'symbol', 'code', 'name').
 *                                  Defaults to 'symbol'.
 * @returns Formatted currency string.
 *
 * @example
 * formatCurrency(1234.56) // "₹1,234.56" (with default config)
 * formatCurrency(-500, { signDisplay: 'always' }) // "-₹500.00"
 */
export const formatCurrency = (
  amount: number,
  options: {
    signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
    currencyDisplay?: 'symbol' | 'code' | 'name';
  } = {}
): string => {
  const { signDisplay = 'auto', currencyDisplay = 'symbol' } = options;

  const formatter = new Intl.NumberFormat(currentConfig.locale, {
    style: 'currency',
    currency: currentConfig.currency,
    currencyDisplay,
    signDisplay,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
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
  setCurrencyConfig,
  getCurrencyConfig,
  getCurrencySymbol,
};