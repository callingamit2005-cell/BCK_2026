
/**
 * Universal Safe JSON Parser
 * Prevents app crashes on corrupted database fields or malformed sync payloads.
 */
export function safeJsonParse<T>(input: any, fallback: T): T {
  try {
    if (!input || typeof input !== "string") {
      // If it's already an object, just return it (useful for SQLite outputs)
      if (typeof input === 'object' && input !== null) return input as unknown as T;
      return fallback;
    }
    const parsed = JSON.parse(input);
    return (parsed && typeof parsed === "object") ? (parsed as T) : fallback;
  } catch (e) {
    // Silently fallback without noisy console errors
    return fallback;
  }
}
