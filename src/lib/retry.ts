const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; delayMs?: number; factor?: number }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 300;
  const factor = options?.factor ?? 2;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const backoff = delayMs * Math.pow(factor, attempt);
      await wait(backoff);
      attempt += 1;
    }
  }

  throw lastError;
}
