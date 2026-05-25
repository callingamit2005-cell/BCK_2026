export interface ParsedVoiceExpense {
  amount?: number;
  paymentMode?: "UPI" | "Cash" | "Net Banking" | "Card";
  category?: "Food" | "Shopping" | "Bills" | "Travel" | "Others";
  title?: string;
  note?: string;
  paidBy?: string;
  split?: "equal" | "unequal";
}

const PAYMENT_KEYWORDS: Array<{ key: ParsedVoiceExpense["paymentMode"]; tokens: string[] }> = [
  { key: "UPI", tokens: ["upi", "gpay", "phonepe", "paytm"] },
  { key: "Cash", tokens: ["cash", "nakad"] },
  { key: "Card", tokens: ["card", "credit", "debit", "visa", "mastercard"] },
  { key: "Net Banking", tokens: ["net banking", "netbanking", "neft", "rtgs", "imps"] },
];

const CATEGORY_KEYWORDS: Array<{ key: ParsedVoiceExpense["category"]; tokens: string[] }> = [
  { key: "Food", tokens: ["food", "dinner", "lunch", "breakfast", "meal", "restaurant", "groceries", "grocery"] },
  { key: "Travel", tokens: ["travel", "petrol", "fuel", "diesel", "uber", "ola", "cab", "taxi", "bus", "train"] },
  { key: "Bills", tokens: ["bill", "electricity", "water", "internet", "wifi", "recharge", "rent", "emi"] },
  { key: "Shopping", tokens: ["shopping", "amazon", "flipkart", "mall", "clothes"] },
  { key: "Others", tokens: ["other", "misc"] },
];

const SPLIT_KEYWORDS: Array<{ key: "equal" | "unequal"; tokens: string[] }> = [
  { key: "unequal", tokens: ["unequal", "custom", "different"] },
  { key: "equal", tokens: ["equal", "equally", "split"] },
];

const cleanWord = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").trim();

const detectAmount = (text: string): number | undefined => {
  const match = text.match(/\b\d+(\.\d+)?\b/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

const detectFromKeywords = <T extends string>(
  text: string,
  source: Array<{ key: T; tokens: string[] }>,
): T | undefined => {
  for (const entry of source) {
    if (entry.tokens.some((token) => text.includes(token))) {
      return entry.key;
    }
  }
  return undefined;
};

const detectPaidBy = (text: string): string | undefined => {
  const patterns = [
    /paid by\s+([a-zA-Z]+)/i,
    /by\s+([a-zA-Z]+)/i,
    /from\s+([a-zA-Z]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const raw = cleanWord(match[1]);
      if (!raw) return undefined;
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  }
  return undefined;
};

const deriveTitle = (
  originalText: string,
  amount?: number,
  paymentMode?: ParsedVoiceExpense["paymentMode"],
): string | undefined => {
  let text = originalText;
  if (amount) {
    text = text.replace(new RegExp(`\\b${amount}\\b`, "g"), " ");
  }

  if (paymentMode) {
    const keywords = PAYMENT_KEYWORDS.find((p) => p.key === paymentMode)?.tokens ?? [];
    for (const token of keywords) {
      text = text.replace(new RegExp(`\\b${token}\\b`, "gi"), " ");
    }
  }

  text = text.replace(/\s+/g, " ").trim();
  return text || undefined;
};

export const parseExpenseTranscript = (transcript: string): ParsedVoiceExpense => {
  const normalized = transcript.toLowerCase().trim();
  const amount = detectAmount(normalized);
  const paymentMode = detectFromKeywords(normalized, PAYMENT_KEYWORDS);
  const category = detectFromKeywords(normalized, CATEGORY_KEYWORDS);
  const split = detectFromKeywords(normalized, SPLIT_KEYWORDS);
  const paidBy = detectPaidBy(normalized);
  const title = deriveTitle(normalized, amount, paymentMode);

  return {
    amount,
    paymentMode,
    category,
    split,
    paidBy,
    title,
    note: transcript.trim(),
  };
};
