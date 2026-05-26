
/**
 * smartParserEngine.ts - BachatKaro Multilingual Parsing Core
 * Supported: English, Hindi, Hinglish
 * Features: Deterministic Amount Extraction, Confidence Scoring, Robust Fallbacks
 */

import { convertToPaisa } from "./currencyFormatter";

export interface ParsedTransaction {
  amount: number | null;
  type: 'expense' | 'income';
  description: string;
  category: string;
  paymentMode: string;
  confidence: number; // 0 to 1
}

const CATEGORY_LEXICON: Record<string, string[]> = {
  Food: [
    "zomato", "swiggy", "food", "khana", "restaurant", "lunch", "dinner", "breakfast", 
    "snack", "chai", "coffee", "milk", "grocery", "ration", "phal", "sabzi", "mutton", 
    "chicken", "egg", "doodh", "biscuit", "namkeen", "pizza", "burger", "starbucks",
    "nashta", "paneer", "biryani", "roti", "dal"
  ],
  Travel: [
    "uber", "ola", "petrol", "fuel", "taxi", "cab", "bus", "train", "flight", "ticket", 
    "auto", "metro", "diesel", "puncture", "parking", "toll", "rapido", "yatra", "safar"
  ],
  Shopping: [
    "amazon", "flipkart", "shopping", "myntra", "clothes", "kapde", "mall", "shoe", 
    "ajio", "meesho", "nykaa", "makeup", "gift", "toys", "kharidi"
  ],
  Bills: [
    "airtel", "jio", "vi", "recharge", "bill", "bijli", "water", "gas", "rent", "emi", 
    "wifi", "internet", "electricity", "maintenance", "kiraya", "bhada", "phone bill"
  ],
  Healthcare: [
    "medicine", "doctor", "hospital", "pharmacy", "pill", "medical", "health", "davai",
    "clinic", "checkup", "blood test", "dentist", "ilaaj"
  ],
  Entertainment: [
    "movie", "cinema", "netflix", "amazon prime", "hotstar", "chill", "game", "pvr", 
    "inox", "club", "party", "outing", "masti", "ghumna"
  ],
  Others: ["other", "misc", "kharcha", "etc"]
};

const PAYMENT_LEXICON: Record<string, string[]> = {
  UPI: ["upi", "gpay", "phonepe", "paytm", "bhim", "scan", "online", "phone pe", "google pay"],
  Cash: ["cash", "nagad", "rokar", "haath se"],
  Card: ["card", "credit", "debit", "swipe", "visa", "mastercard", "rupay", "atm"],
};

const INCOME_KEYWORDS = [
  "received", "credited", "added", "refunded", "deposit", "kamayi", "paisa aaya", 
  "salary", "tankhwa", "mil gaya", "prapt", "inflow"
];

const STOP_WORDS = [
  "pe", "ko", "se", "spent", "paid", "to", "for", "on", "aaj", "kal", "diye", "liye", 
  "rupees", "rupee", "rs", "inr", "paisa", "paise", "lakh", "lac", "crore", "cr"
];

/**
 * 🛡️ [AMOUNT_ENGINE]
 * Extracts numeric value considering Indian numbering units (Lakh, Cr).
 */
export const extractAmount = (text: string): { amount: number | null, confidence: number, rawMatch?: string } => {
  const lower = text.toLowerCase().replace(/,/g, "");
  
  // 1. Lakh/Cr Pattern
  let multiplier = 1;
  let unitMatch = "";
  if (lower.includes("lakh") || lower.includes("lac")) { multiplier = 100000; unitMatch = lower.includes("lakh") ? "lakh" : "lac"; }
  else if (lower.includes("crore") || lower.includes("cr")) { multiplier = 10000000; unitMatch = lower.includes("crore") ? "crore" : "cr"; }

  if (multiplier > 1) {
    const match = lower.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitMatch}`));
    if (match) return { amount: parseFloat(match[1]) * multiplier, confidence: 0.95, rawMatch: match[0] };
  }

  // 2. Currency Symbol Pattern
  const symbolMatch = lower.match(/(?:inr|rs|₹|rupees?)\.?\s*([\d]+(?:\.\d{1,2})?)/i);
  if (symbolMatch) return { amount: parseFloat(symbolMatch[1]), confidence: 0.9, rawMatch: symbolMatch[0] };

  // 3. Raw Number Pattern
  const numbers = lower.match(/\b([\d]+(?:\.\d{1,2})?)\b/g);
  if (numbers && numbers.length > 0) {
    return { amount: parseFloat(numbers[0]), confidence: 0.7, rawMatch: numbers[0] };
  }

  return { amount: null, confidence: 0 };
};

/**
 * 🛡️ [CATEGORY_ENGINE]
 * Maps keywords to standard categories with scoring.
 */
export const detectCategory = (text: string): { category: string, confidence: number } => {
  const lower = text.toLowerCase();
  let bestMatch = { category: "Others", confidence: 0 };

  for (const [cat, keywords] of Object.entries(CATEGORY_LEXICON)) {
    for (const kw of keywords) {
      // Use word boundaries for short keywords to avoid false positives like "phone" in "PhonePe"
      const regex = kw.length < 5 ? new RegExp(`\\b${kw}\\b`, 'i') : new RegExp(kw, 'i');
      if (regex.test(lower)) {
        const score = kw.length / text.length + 0.5;
        if (score > bestMatch.confidence) {
          bestMatch = { category: cat, confidence: Math.min(score, 0.9) };
        }
      }
    }
  }

  return bestMatch;
};

/**
 * 🛡️ [PAYMENT_ENGINE]
 */
export const detectPaymentMode = (text: string): { mode: string, confidence: number } => {
  const lower = text.toLowerCase();
  for (const [mode, keywords] of Object.entries(PAYMENT_LEXICON)) {
    if (keywords.some(kw => lower.includes(kw))) return { mode, confidence: 0.9 };
  }
  return { mode: "UPI", confidence: 0.4 }; // Default fallback
};

/**
 * 🛡️ [DETERMINISTIC_PARSER]
 * Master entry point for parsing natural language transaction text.
 */
export const parseMultilingualInput = (text: string): ParsedTransaction => {
  if (!text) {
    return { amount: null, type: 'expense', description: '', category: 'Others', paymentMode: 'UPI', confidence: 0 };
  }

  const { amount, confidence: amtConf, rawMatch } = extractAmount(text);
  const { category, confidence: catConf } = detectCategory(text);
  const { mode, confidence: payConf } = detectPaymentMode(text);
  
  const isCredit = INCOME_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
  const type = isCredit ? 'income' : 'expense';

  // Extract clean description (strip amount, keywords, stop words)
  let description = text;
  if (rawMatch) description = description.replace(rawMatch, '');
  
  // Strip units and currency names explicitly
  const unitStopWords = ["lakh", "lac", "crore", "cr", "rupees", "rupee", "rs", "inr"];
  unitStopWords.forEach(w => description = description.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''));

  INCOME_KEYWORDS.forEach(kw => description = description.replace(new RegExp(kw, 'gi'), ''));
  STOP_WORDS.forEach(kw => description = description.replace(new RegExp(`\\b${kw}\\b`, 'gi'), ''));
  PAYMENT_LEXICON.UPI.concat(PAYMENT_LEXICON.Cash).concat(PAYMENT_LEXICON.Card).forEach(kw => {
    description = description.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
  });

  description = description.replace(/[₹$,.]/g, '').replace(/\s+/g, ' ').trim();

  // Final overall confidence calculation
  const totalConfidence = (amtConf * 0.6) + (catConf * 0.2) + (payConf * 0.2);

  return {
    amount,
    type,
    description: description || (type === 'income' ? "Income Entry" : "Expense Entry"),
    category,
    paymentMode: mode,
    confidence: totalConfidence
  };
};
