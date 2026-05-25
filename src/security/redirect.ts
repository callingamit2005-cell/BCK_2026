const INTERNAL_PATH_REGEX = /^\/(?!\/)[^\s]*$/;

/**
 * Allows only internal app routes like "/dashboard?x=1".
 * Blocks absolute URLs, protocol-relative URLs, and malformed values.
 */
export const sanitizeInternalRedirect = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || !INTERNAL_PATH_REGEX.test(trimmed)) {
    return null;
  }

  // Reject values that can be interpreted as external protocols.
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("/http:") || lower.startsWith("/https:") || lower.startsWith("/javascript:")) {
    return null;
  }

  return trimmed;
};

export const setRedirectAfterLogin = (value: string): void => {
  const safe = sanitizeInternalRedirect(value);
  if (!safe) return;
  sessionStorage.setItem("redirectAfterLogin", safe);
};

export const getRedirectAfterLogin = (): string | null => {
  const raw = sessionStorage.getItem("redirectAfterLogin");
  return sanitizeInternalRedirect(raw);
};

export const clearRedirectAfterLogin = (): void => {
  sessionStorage.removeItem("redirectAfterLogin");
};
