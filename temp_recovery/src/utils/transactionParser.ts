/**
 * 🛡️ LOGIC LOCK: Advanced Multi-Bank SMS Parser
 * Purpose: Free, Private, and Offline data extraction from Indian Bank SMS.
 * Old functionality safety: 100% Safe (Additive Utility).
 */

export interface ParsedData {
  amount: string;
  paymentMode: string;
  note: string;
  category: string;
}

/**
 * Parses a raw bank SMS string to extract financial data.
 * @param text The raw SMS content pasted by the user.
 */
export const smartParseSMS = (text: string): ParsedData => {
  const result: ParsedData = {
    amount: "",
    paymentMode: "UPI", // Default mode
    note: "",
    category: "Others"
  };

  if (!text) return result;

  const lowerText = text.toLowerCase();

  // 1. 💰 Amount Extraction
  // Matches: Rs. 500, INR 500, Rs.500.00, Amt 1,000 etc.
  const amountRegex = /(?:rs\.?|inr|amt)\s*([\d,]+(?:\.\d{2})?)/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    result.amount = amountMatch[1].replace(/,/g, '');
  }

  // 2. 🏪 Merchant / Recipient Extraction
  // Searches for names after keywords like "at", "to", "paid to", "vpa"
  const merchantRegex = /(?:at|to|on|info|vpa|paid to)\s+([a-z0-9\s&]{3,20}?)(?=\s+on|\s+at|\s+ref|\s+upi|\s+acct|\s*\.|$)/i;
  const merchantMatch = text.match(merchantRegex);
  
  if (merchantMatch) {
    result.note = merchantMatch[1].trim().toUpperCase();
  }

  // 3. 💳 Payment Mode Detection
  if (lowerText.includes('upi')) {
    result.paymentMode = 'UPI';
  } else if (lowerText.includes('card') || lowerText.includes('swipe') || lowerText.includes('pos')) {
    result.paymentMode = 'Card';
  } else if (lowerText.includes('net banking') || lowerText.includes('transfer')) {
    result.paymentMode = 'Net Banking';
  } else if (lowerText.includes('withdrawn') || lowerText.includes('cash')) {
    result.paymentMode = 'Cash';
  }

  return result;
};