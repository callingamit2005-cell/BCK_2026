// src/utils/voiceParser.ts

/**
 * Voice Parser Utility
 * 
 * Parses natural language voice transcripts into structured expense data.
 * Supports English and Hindi out of the box, with extensible architecture for adding more languages.
 * 
 * To add a new language (e.g., Tamil, Telugu, Bengali, etc.):
 * 1. Extend CATEGORY_MAP with language-specific keywords.
 * 2. Add language-specific stopwords to STOPWORDS (as a new Set).
 * 3. Extend COMMON_NAMES with region-specific names.
 * 4. Update the parsing functions to consider the language parameter.
 * 
 * For now, the parser uses a combined set of English and Hindi keywords.
 */

export interface ParsedExpense {
  amount?: number;
  title?: string;
  paidBy?: string;
  paymentMode?: string;
  category?: string;
  split?: 'equal' | 'unequal';
}

// ==================== CONSTANTS ====================

const PAYMENT_MODES = ["UPI", "Cash", "Net Banking", "Card"] as const;

/**
 * Keyword → Category mapping.
 * Supports English and Hindi (Devanagari) keywords.
 * For new languages, add entries with appropriate script.
 */
const CATEGORY_MAP: Record<string, string> = {
  // English & Hinglish
  food: "Food", dinner: "Food", lunch: "Food", breakfast: "Food", restaurant: "Food",
  cafe: "Food", pizza: "Food", burger: "Food", milk: "Food", tomato: "Food",
  khana: "Food", kirana: "Shopping", grocery: "Shopping", shopping: "Shopping",
  clothes: "Shopping", amazon: "Shopping", flipkart: "Shopping",
  travel: "Travel", petrol: "Travel", diesel: "Travel", auto: "Travel", uber: "Travel",
  ola: "Travel", bike: "Travel", bus: "Travel", taxi: "Travel", cab: "Travel",
  train: "Travel", flight: "Travel", safar: "Travel",
  bills: "Bills", recharge: "Bills", rent: "Bills", electricity: "Bills",
  water: "Bills", gas: "Bills", wifi: "Bills", internet: "Bills", mobile: "Bills",
  phone: "Bills", bill: "Bills",

  // Hindi (Devanagari)
  "खाना": "Food", "भोजन": "Food", "रोटी": "Food", "सब्जी": "Food", "दूध": "Food",
  "चाय": "Food", "नाश्ता": "Food", "फल": "Food", "साग": "Food", "दाल": "Food",
  "चावल": "Food", "आलू": "Food", "प्याज": "Food",
  "किराना": "Shopping", "खरीदारी": "Shopping", "कपड़े": "Shopping", "जूते": "Shopping",
  "बाजार": "Shopping", "मॉल": "Shopping",
  "यात्रा": "Travel", "सफर": "Travel", "पेट्रोल": "Travel", "डीजल": "Travel",
  "ऑटो": "Travel", "बस": "Travel",
  "बिल": "Bills", "रिचार्ज": "Bills", "किराया": "Bills", "बिजली": "Bills",
  "पानी": "Bills", "गैस": "Bills", "वाईफाई": "Bills",
};

/**
 * Common Indian names (can be expanded).
 * Used for detecting payer names.
 */
const COMMON_NAMES = new Set([
  // Male
  "amit", "sumit", "rahul", "raj", "rohit", "vijay", "ajay", "sanjay", "deepak",
  "ankit", "vikas", "manoj", "pankaj", "nitesh", "arjun", "karan", "sameer",
  "ravi", "mohan", "sohan", "ram", "shyam", "mukesh", "suresh", "mahesh",
  "satish", "vinod", "pradeep", "amitabh", "akshay", "salman", "shahrukh",
  "aamir", "hrithik", "ranbir", "ranveer",
  // Female
  "priya", "neha", "pooja", "sonal", "ritu", "anjali", "kavita", "sneha",
  "deepika", "katrina", "kareena", "alia", "priyanka", "anushka", "shraddha",
  "kriti", "kiara", "jahnvi", "sara", "sonam", "sonakshi", "vidya", "kangana",
  "taapsee", "bhumi",
  // Unisex or short forms
  "raj", "simran", "gurpreet", "harpreet", "jasmine", "robin", "jatin",
]);

/**
 * Stopwords to remove from title (English + Hindi).
 * For new languages, add corresponding stopwords.
 */
const STOPWORDS = new Set([
  // English
  "for", "to", "and", "the", "a", "an", "paid", "by", "with", "from", "in",
  "on", "at", "of", "for", "rs", "rupees", "rupee", "₹",
  // Hinglish / common
  "ka", "ke", "ki", "mein", "me", "kharida", "liya", "hua", "hai", "the", "tha",
  "aur", "se", "ko", "ne", "dwaara", "dwara", "dvara", "through",
  // Hindi (Devanagari)
  "का", "के", "की", "में", "को", "ने", "द्वारा", "से", "और", "था", "थी", "थे",
  "है", "हैं", "कर", "किया", "की", "हुआ", "हुई", "गया", "गई",
]);

// ==================== PARSING FUNCTIONS ====================

/**
 * Extract amount from transcript (first numeric value)
 */
function extractAmount(transcript: string): number | undefined {
  const match = transcript.match(/\b(\d+(?:\.\d+)?)\b/);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Extract payment mode – check against known modes
 */
function extractPaymentMode(transcript: string): string | undefined {
  const lower = transcript.toLowerCase();
  for (const mode of PAYMENT_MODES) {
    if (lower.includes(mode.toLowerCase())) {
      return mode;
    }
  }
  return undefined;
}

/**
 * Extract category using keyword map (language-agnostic)
 */
function extractCategory(transcript: string): string | undefined {
  const lower = transcript.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    // Keyword might be in any script; comparison is exact lowercased.
    if (lower.includes(keyword.toLowerCase())) {
      return cat;
    }
  }
  return undefined;
}

/**
 * Extract payer name
 * Looks for patterns like "paid by X", "X paid", or a known name anywhere.
 * Can be extended with language-specific name lists.
 */
function extractPaidBy(transcript: string): string | undefined {
  const lower = transcript.toLowerCase();
  
  // Pattern 1: "paid by X"
  const paidByMatch = lower.match(/paid by (\w+)/i);
  if (paidByMatch) return capitalize(paidByMatch[1]);

  // Pattern 2: "X paid"
  const xPaidMatch = lower.match(/(\w+)\s+paid/i);
  if (xPaidMatch) return capitalize(xPaidMatch[1]);

  // Pattern 3: "X ne diya" (Hindi)
  const neDiyaMatch = lower.match(/(\w+)\s+ने\s+दिया/i);
  if (neDiyaMatch) return capitalize(neDiyaMatch[1]);

  // Pattern 4: check for any known name in the transcript
  const words = lower.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^\w]/g, '');
    if (COMMON_NAMES.has(clean)) {
      return capitalize(clean);
    }
  }

  return undefined;
}

/**
 * Detect split type
 */
function extractSplit(transcript: string): 'equal' | 'unequal' | undefined {
  const lower = transcript.toLowerCase();
  if (lower.includes('unequal') || lower.includes('custom') || lower.includes('uneven')) {
    return 'unequal';
  }
  if (lower.includes('equal') || lower.includes('equally') || lower.includes('share')) {
    return 'equal';
  }
  return undefined; // will default to 'equal' in UI
}

/**
 * Extract title (the main expense description)
 * – Remove amount, mode, known stopwords, and name if present.
 */
function extractTitle(
  transcript: string,
  amount?: number,
  mode?: string,
  paidBy?: string
): string | undefined {
  let cleaned = transcript;

  // Remove amount
  if (amount) {
    cleaned = cleaned.replace(new RegExp(`\\b${amount}\\b`, 'g'), '');
  }

  // Remove payment mode
  if (mode) {
    cleaned = cleaned.replace(new RegExp(`\\b${mode}\\b`, 'gi'), '');
  }

  // Remove payer name
  if (paidBy) {
    cleaned = cleaned.replace(new RegExp(`\\b${paidBy}\\b`, 'gi'), '');
  }

  // Remove common stopwords (using regex with word boundaries)
  for (const word of STOPWORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Remove special characters, keep letters and spaces (including all scripts)
  cleaned = cleaned.replace(/[^\p{L}\s]/gu, ' ');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If nothing left, maybe the first word that is not a stopword
  if (!cleaned) {
    const words = transcript.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^\p{L}]/gu, '').toLowerCase();
      if (cleanWord && !STOPWORDS.has(cleanWord) && cleanWord !== amount?.toString()) {
        cleaned = word;
        break;
      }
    }
  }

  return cleaned || undefined;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ==================== MAIN PARSER ====================

/**
 * Main parsing function
 * @param transcript - raw voice transcript
 */
export function parseVoiceTranscript(transcript: string): ParsedExpense {
  const trimmed = transcript.trim();
  
  const amount = extractAmount(trimmed);
  const paymentMode = extractPaymentMode(trimmed);
  const category = extractCategory(trimmed);
  const paidBy = extractPaidBy(trimmed);
  const split = extractSplit(trimmed);
  const title = extractTitle(trimmed, amount, paymentMode, paidBy);

  return {
    amount,
    title,
    paidBy,
    paymentMode,
    category,
    split,
  };
}