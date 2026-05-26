
/**
 * useSmartParser.ts - BachatKaro Smart Parsing Hook
 * Integrates AI parsing with a robust multilingual fallback engine.
 */

import { useCallback, useRef, useEffect } from "react";
import { parseMultilingualInput } from "@/utils/smartParserEngine";

// ===== Types =====
export interface ParsedResult {
  amount?: number;
  title?: string;
  paidBy?: string;
  category?: string | null;
  paymentMode?: string | null;
  split?: "equal" | "unequal";
}

export type ParseResult =
  | { success: true; data: ParsedResult; fromCache?: boolean }
  | { success: false; fallback: ParsedResult; error: unknown };

// ===== Configuration =====
const DEFAULT_API_URL = "https://silent-thunder-0d25.orv-customer.workers.dev/";
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

// ===== Type guard =====
function isValidParsedResult(data: any): data is ParsedResult {
  return (
    typeof data === "object" &&
    data !== null &&
    (data.amount === undefined || typeof data.amount === "number") &&
    (data.title === undefined || typeof data.title === "string") &&
    (data.paidBy === undefined || typeof data.paidBy === "string") &&
    (data.category === undefined ||
      data.category === null ||
      typeof data.category === "string") &&
    (data.paymentMode === undefined ||
      data.paymentMode === null ||
      typeof data.paymentMode === "string") &&
    (data.split === undefined ||
      data.split === "equal" ||
      data.split === "unequal")
  );
}

/**
 * 🛡️ [UNIFIED_FALLBACK]
 * Uses the deterministic multilingual engine if AI fails.
 */
function fallbackParse(text: string): ParsedResult {
  const result = parseMultilingualInput(text);
  
  return {
    amount: result.amount || undefined,
    title: result.description,
    category: result.category,
    paymentMode: result.paymentMode,
    split: "equal",
  };
}

/**
 * useSmartParser
 * 
 * A React hook that sends a transcript to an AI endpoint for parsing,
 * with automatic retries and a high-accuracy multilingual fallback parser.
 */
export const useSmartParser = (apiUrl: string = DEFAULT_API_URL) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const parseWithAI = useCallback(
    async (text: string): Promise<ParseResult> => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const attempt = async (signal: AbortSignal): Promise<ParsedResult> => {
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, DEFAULT_TIMEOUT_MS);

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
            signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const json = await response.json();

          if (!isValidParsedResult(json)) {
            throw new Error("Invalid response shape from API");
          }

          return json;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };

      for (let attemptCount = 0; attemptCount <= MAX_RETRIES; attemptCount++) {
        try {
          if (attemptCount > 0) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          }

          const data = await attempt(controller.signal);
          return { success: true, data };
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            throw err;
          }

          if (attemptCount === MAX_RETRIES) {
            console.error("AI parser failed after retries, using fallback", err);
            const fallback = fallbackParse(text);
            return {
              success: false,
              fallback,
              error: err,
            };
          }
        }
      }

      throw new Error("Unexpected end of retry loop");
    },
    [apiUrl]
  );

  return { parseWithAI };
};
