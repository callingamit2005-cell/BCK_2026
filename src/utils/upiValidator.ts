/**
 * UPI Validator Utility for BachatKaro
 * Enforces enterprise-grade UPI VPA standards.
 */

/**
 * 🛡️ UPI VPA REGEX
 * Matches standard Virtual Payment Address formats.
 * Format: [identifier]@[handle]
 * Example: rahul@ybl, amit@oksbi, user@paytm
 */
export const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Validates a UPI ID string.
 * Rejects emails, malformed VPAs, and whitespace.
 */
export const isValidUPI = (upiId: string | null | undefined): boolean => {
  if (!upiId) return false;
  const normalized = upiId.trim().toLowerCase();
  
  // 1. Basic format check
  if (!UPI_VPA_REGEX.test(normalized)) return false;

  // 2. Reject common email providers (safety layer)
  const emailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  const handle = normalized.split('@')[1];
  if (emailProviders.includes(handle)) return false;

  return true;
};

/**
 * Normalizes a UPI ID for consistent storage.
 */
export const normalizeUPI = (upiId: string): string => {
  return upiId.trim().toLowerCase();
};
