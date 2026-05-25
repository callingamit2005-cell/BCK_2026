/**
 * Voice Expense Flow Explanation:
 * ================================
 * This hook sends the transcript to a Cloudflare Worker AI endpoint.
 * 
 * - On success: returns `{ success: true, data: ParsedResult }` with all fields.
 * - On failure after retries: returns `{ success: false, fallback: ParsedResult }`
 *   with fallback values extracted using simple regex/keyword matching.
 * 
 * The fallback attempts to fill amount, title, category, paymentMode, split, and paidBy
 * (though paidBy is rarely available without AI). This ensures the form can still be
 * partially filled even if the AI service is down.
 */

import { useCallback, useRef, useEffect } from "react";

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
const DEFAULT_API_URL =
  "https://silent-thunder-0d25.orv-customer.workers.dev/";
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

// ===== Keyword mappings for fallback parsing =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["food", "dinner", "lunch", "breakfast", "restaurant", "pizza", "burger", "coffee"],
  Travel: ["travel", "taxi", "bus", "train", "flight", "uber", "ola", "petrol", "fuel"],
  Shopping: ["shopping", "mall", "cloth", "shoe", "amazon", "flipkart"],
  Bills: ["bill", "electricity", "water", "internet", "mobile", "recharge"],
  Entertainment: ["movie", "netflix", "concert", "game"],
  Healthcare: ["doctor", "medicine", "hospital", "clinic"],
  Others: ["other", "misc"],
};

const PAYMENT_KEYWORDS: Record<string, string[]> = {
  Cash: ["cash"],
  UPI: ["upi", "gpay", "phonepe", "paytm"],
  Card: ["card", "credit", "debit", "visa", "mastercard"],
  "Net Banking": ["netbanking", "neft", "rtgs"],
};

const SPLIT_KEYWORDS: Record<string, "equal" | "unequal"> = {
  equal: ["equal", "equally", "split"],
  unequal: ["unequal", "custom", "different"],
};

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

// ===== Enhanced fallback parser =====
function fallbackParse(text: string): ParsedResult {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/\d+/);
  const amount = amountMatch ? Number(amountMatch[0]) : undefined;

  // Determine category
  let category: string | null = null;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Determine payment mode
  let paymentMode: string | null = null;
  for (const [mode, keywords] of Object.entries(PAYMENT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      paymentMode = mode;
      break;
    }
  }

  // Determine split type
  let split: "equal" | "unequal" | undefined = undefined;
  for (const [type, keywords] of Object.entries(SPLIT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      split = type as "equal" | "unequal";
      break;
    }
  }

  // Attempt to extract paidBy: look for common name patterns (simple heuristic)
  // This is very basic; often the AI is needed for accurate extraction.
  const paidByMatch = lower.match(/(?:paid by|from|by)\s+([a-z]+)/i);
  const paidBy = paidByMatch ? paidByMatch[1] : undefined;

  return {
    amount,
    title: text.trim(),
    paidBy,
    category,
    paymentMode,
    split: split || "equal", // default to equal if not found
  };
}

// ===== Hook =====
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
            // Request aborted – likely unmount, rethrow to stop processing
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