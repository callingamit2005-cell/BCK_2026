// src/utils/voiceParser.ts
import { convertToPaisa } from './currencyFormatter';

/**
 * Voice Parser Utility
 * 
 * Parses natural language voice transcripts into structured expense data.
 * Supports multiple languages by using language‑specific keyword maps,
 * stopword lists, and name lists. Currently includes English and Hindi.
 * 
 * To add a new language (e.g., Tamil, Telugu, Bengali, etc.):
 * 1. Add a new entry to `LANGUAGE_DATA` with:
 *    - categoryMap: language‑specific keywords mapping to categories.
 *    - stopwords: Set of common words to ignore.
 *    - nameList: Set of common names for payer detection.
 * 2. The parser will automatically use the data for the given language.
 */

export interface ParsedExpense {
  amount?: number;
  title?: string;
  paidBy?: string;
  paymentMode?: string;
  category?: string;
  split?: 'equal' | 'unequal';
}

// ==================== LANGUAGE DATA ====================

interface LanguageData {
  categoryMap: Record<string, string>;
  stopwords: Set<string>;
  nameList: Set<string>;
}

const PAYMENT_MODES = ["UPI", "Cash", "Net Banking", "Card"] as const;

const LANGUAGE_DATA: Record<string, LanguageData> = {
  en: {
    categoryMap: {
      food: "Food", dinner: "Food", lunch: "Food", breakfast: "Food", restaurant: "Food",
      cafe: "Food", pizza: "Food", burger: "Food", milk: "Food", tomato: "Food",
      kirana: "Shopping", grocery: "Shopping", shopping: "Shopping", clothes: "Shopping",
      amazon: "Shopping", flipkart: "Shopping",
      travel: "Travel", petrol: "Travel", diesel: "Travel", auto: "Travel", uber: "Travel",
      ola: "Travel", bike: "Travel", bus: "Travel", taxi: "Travel", cab: "Travel",
      train: "Travel", flight: "Travel",
      bills: "Bills", recharge: "Bills", rent: "Bills", electricity: "Bills",
      water: "Bills", gas: "Bills", wifi: "Bills", internet: "Bills", mobile: "Bills",
      phone: "Bills", bill: "Bills",
    },
    stopwords: new Set([
      "for", "to", "and", "the", "a", "an", "paid", "by", "with", "from", "in",
      "on", "at", "of", "rs", "rupees", "rupee", "₹",
      "ka", "ke", "ki", "mein", "me", "kharida", "liya", "hua", "hai", "the", "tha",
      "aur", "se", "ko", "ne", "dwaara", "dwara", "dvara", "through",
    ]),
    nameList: new Set([
      "amit", "sumit", "rahul", "raj", "rohit", "vijay", "ajay", "sanjay", "deepak",
      "ankit", "vikas", "manoj", "pankaj", "nitesh", "arjun", "karan", "sameer",
      "ravi", "mohan", "sohan", "ram", "shyam", "mukesh", "suresh", "mahesh",
      "satish", "vinod", "pradeep", "amitabh", "akshay", "salman", "shahrukh",
      "aamir", "hrithik", "ranbir", "ranveer",
      "priya", "neha", "pooja", "sonal", "ritu", "anjali", "kavita", "sneha",
      "deepika", "katrina", "kareena", "alia", "priyanka", "anushka", "shraddha",
      "kriti", "kiara", "jahnvi", "sara", "sonam", "sonakshi", "vidya", "kangana",
      "taapsee", "bhumi",
      "raj", "simran", "gurpreet", "harpreet", "jasmine", "robin", "jatin",
    ]),
  },
  hi: {
    categoryMap: {
      "खाना": "Food", "भोजन": "Food", "रोटी": "Food", "सब्जी": "Food", "दूध": "Food",
      "चाय": "Food", "नाश्ता": "Food", "फल": "Food", "साग": "Food", "दाल": "Food",
      "चावल": "Food", "आलू": "Food", "प्याज": "Food",
      "किराना": "Shopping", "खरीदारी": "Shopping", "कपड़े": "Shopping", "जूते": "Shopping",
      "बाजार": "Shopping", "मॉल": "Shopping",
      "यात्रा": "Travel", "सफर": "Travel", "पेट्रोल": "Travel", "डीजल": "Travel",
      "ऑटो": "Travel", "बस": "Travel",
      "बिल": "Bills", "रिचार्ज": "Bills", "किराया": "Bills", "बिजली": "Bills",
      "पानी": "Bills", "गैस": "Bills", "वाईफाई": "Bills",
    },
    stopwords: new Set([
      "का", "के", "की", "में", "को", "ने", "द्वारा", "से", "और", "था", "थी", "थे",
      "है", "हैं", "कर", "किया", "की", "हुआ", "हुई", "गया", "गई",
    ]),
    nameList: new Set([
      "अमित", "सुमित", "राहुल", "राज", "रोहित", "विजय", "अजय", "संजय", "दीपक",
      "अंकित", "विकास", "मनोज", "पंकज", "नीतेश", "अर्जुन", "करण", "समीर",
      "रवि", "मोहन", "सोहन", "राम", "श्याम", "मुकेश", "सुरेश", "महेश",
      "सतीश", "विनोद", "प्रदीप", "अमिताभ", "अक्षय", "सलमान", "शाहरुख",
      "आमिर", "ऋतिक", "रणबीर", "रणवीर",
      "प्रिया", "नेहा", "पूजा", "सोनल", "ऋतु", "अंजलि", "कविता", "स्नेहा",
      "दीपिका", "कैटरीना", "करीना", "आलिया", "प्रियंका", "अनुष्का", "श्रद्धा",
      "कृति", "कियारा", "जाह्नवी", "सारा", "सोनम", "सोनाक्षी", "विद्या", "कंगना",
      "तापसी", "भूमि",
    ]),
  },
};

// Default fallback to English
const DEFAULT_LANG = 'en';

// ==================== PARSING FUNCTIONS ====================

/**
 * Parse Indian number words (lakh, lac, crore, cr)
 * Converts to rupees, then to PAISA for DB storage
 * 
 * Examples:
 * "1 lakh petrol" → 10000000 paisa
 * "2.5 lakh rent" → 25000000 paisa (250000 rupees)
 * "1 crore investment" → 1000000000 paisa
 * "50 lac" → 5000000 paisa
 */
export function parseIndianAmount(input: string): number {
  let text = input.toLowerCase().trim();
  text = text.replace(/,/g, "");
  
  let multiplier = 1;
  if (text.includes("lakh") || text.includes("lac")) multiplier = 100000;
  else if (text.includes("crore") || text.includes("cr")) multiplier = 10000000;
  
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|crore|cr)?/);
  if (!match) return 0;
  
  const number = parseFloat(match[1]);
  if (isNaN(number) || number <= 0) return 0;
  
  return convertToPaisa(number * multiplier);
}

/**
 * Extract amount from transcript (first numeric value)
 * Supports both regular numbers and Indian number words (lakh, crore, etc.)
 */
function extractAmount(transcript: string): number | undefined {
  // First try to parse Indian number words
  const indianPaisaAmount = parseIndianAmount(transcript);
  if (indianPaisaAmount > 0) {
    return indianPaisaAmount;
  }
  
  // Fallback to regular numeric parsing
  const match = transcript.match(/\b(\d+(?:\.\d+)?)\b/);
  if (match) {
    const rupees = parseFloat(match[1]);
    // Convert rupees to PAISA for consistency
    return convertToPaisa(rupees);
  }
  
  return undefined;
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
 * Extract category using language-specific keyword map
 */
function extractCategory(transcript: string, langData: LanguageData): string | undefined {
  const lower = transcript.toLowerCase();
  for (const [keyword, cat] of Object.entries(langData.categoryMap)) {
    if (lower.includes(keyword.toLowerCase())) {
      return cat;
    }
  }
  return undefined;
}

/**
 * Extract payer name
 * Looks for patterns like "paid by X", "X paid", or a known name from language-specific name list.
 */
function extractPaidBy(transcript: string, langData: LanguageData): string | undefined {
  const lower = transcript.toLowerCase();
  
  // English patterns
  const paidByMatch = lower.match(/paid by (\w+)/i);
  if (paidByMatch) return capitalize(paidByMatch[1]);

  const xPaidMatch = lower.match(/(\w+)\s+paid/i);
  if (xPaidMatch) return capitalize(xPaidMatch[1]);

  // Hindi pattern
  const neDiyaMatch = lower.match(/(\w+)\s+ने\s+दिया/i);
  if (neDiyaMatch) return capitalize(neDiyaMatch[1]);

  // Check for any known name in the transcript
  const words = lower.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^\w\u0900-\u097F]/g, ''); // keep Hindi letters
    if (langData.nameList.has(clean)) {
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
  paidBy?: string,
  langData?: LanguageData
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

  // Remove common stopwords (using language-specific list)
  if (langData) {
    for (const word of langData.stopwords) {
      cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }
  }

  // Remove special characters, keep letters and spaces (including all scripts)
  cleaned = cleaned.replace(/[^\p{L}\s]/gu, ' ');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If nothing left, maybe the first word that is not a stopword
  if (!cleaned && langData) {
    const words = transcript.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^\p{L}]/gu, '').toLowerCase();
      if (cleanWord && !langData.stopwords.has(cleanWord) && cleanWord !== amount?.toString()) {
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
 * @param language - language code (e.g., 'en', 'hi'). Defaults to 'en'.
 */
export function parseVoiceTranscript(transcript: string, language: string = DEFAULT_LANG): ParsedExpense {
  const trimmed = transcript.trim();
  const langData = LANGUAGE_DATA[language] || LANGUAGE_DATA[DEFAULT_LANG];
  
  const amount = extractAmount(trimmed);
  const paymentMode = extractPaymentMode(trimmed);
  const category = extractCategory(trimmed, langData);
  const paidBy = extractPaidBy(trimmed, langData);
  const split = extractSplit(trimmed);
  const title = extractTitle(trimmed, amount, paymentMode, paidBy, langData);

  return {
    amount,
    title,
    paidBy,
    paymentMode,
    category,
    split,
  };
}

/**
 * Export parseIndianAmount for use in other components
 * Useful for direct Indian number word parsing in forms/inputs
 */
export { parseIndianAmount };
