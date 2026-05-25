// src/config/appConfig.ts

/**
 * Application-level configuration.
 * This file centralizes all settings that might need to change for different
 * deployments or environments, supporting global readiness.
 */

export interface AppConfig {
  /** Default country code (ISO 3166-1 alpha-2) – currently India */
  defaultCountry: string;
  /** Default currency code (ISO 4217) – currently Indian Rupee */
  defaultCurrency: string;
  /** Default locale for formatting (IETF language tag) – currently English (India) */
  defaultLocale: string;
  /** Application name */
  appName: string;
  /** Application version */
  version: string;
}

/**
 * Default configuration for India.
 * This is the starting point for global expansion.
 */
export const DEFAULT_CONFIG: AppConfig = {
  defaultCountry: 'IN',
  defaultCurrency: 'INR',
  defaultLocale: 'en-IN',
  appName: 'EMI Manager',
  version: '1.0.0',
};

// Current active configuration (initially default)
let activeConfig: AppConfig = { ...DEFAULT_CONFIG };

/**
 * Get the current active configuration.
 * Use this throughout the app to access config values.
 */
export const getConfig = (): AppConfig => {
  return { ...activeConfig };
};

/**
 * Update the configuration dynamically.
 * This allows switching country/currency at runtime (e.g., for different regions).
 * @param newConfig - Partial configuration to merge with existing.
 */
export const setConfig = (newConfig: Partial<AppConfig>): void => {
  activeConfig = {
    ...activeConfig,
    ...newConfig,
  };
};

// Convenience exports for commonly used values
export const defaultCountry = DEFAULT_CONFIG.defaultCountry;
export const defaultCurrency = DEFAULT_CONFIG.defaultCurrency;
export const defaultLocale = DEFAULT_CONFIG.defaultLocale;
export const appName = DEFAULT_CONFIG.appName;
export const version = DEFAULT_CONFIG.version;

export default DEFAULT_CONFIG;