/**
 * WhatsApp Summary Generator Utility
 * 
 * This utility creates formatted WhatsApp messages for sharing expense summaries.
 * Maintains "Desi" flavor while keeping code professional.
 * 
 * @module whatsappSummary
 */

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface GroupDetails {
  name: string;
  totalExpense: number;
  currency?: string;
}

/**
 * Generates a WhatsApp friendly summary message from settlement data
 * 
 * @param {GroupDetails} groupDetails - Basic group information
 * @param {Settlement[]} settlements - Array of settlement objects
 * @returns {string} Formatted message ready for WhatsApp sharing
 * 
 * @example
 * const message = generateWhatsAppSummary(
 *   { name: "Goa Trip", totalExpense: 15000 },
 *   [{ from: "Amit", to: "Rahul", amount: 500 }]
 * );
 */
export const generateWhatsAppSummary = (
  groupDetails: GroupDetails,
  settlements: Settlement[]
): string => {
  // Format currency in Indian style (with ₹ symbol)
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get current group name from the group details
  const groupName = groupDetails.name || "Group";
  const totalAmount = groupDetails.totalExpense || 0;

  // Header with group info - Using Hinglish for Desi feel
  let message = `🏷️ *${groupName}*\n`;
  message += `💰 Total Kharcha: ${formatCurrency(totalAmount)}\n`;
  
  if (settlements.length === 0) {
    // When no settlements needed
    message += `✅ *Sab clear hai!* 🎉\n`;
    message += `Koi hisaab nahi bakaya. Sab ne pay kar diya! 🤝\n`;
  } else {
    // Add settlement summary header
    message += `📊 *Hisaab Kitab Summary*\n\n`;
    
    // Add each settlement in a clean format
    settlements.forEach((settlement, index) => {
      message += `${index + 1}. `;
      message += `${settlement.from} ko ${settlement.to} ko dena hai: `;
      message += `${formatCurrency(settlement.amount)}\n`;
    });

    // Add friendly closing message with Hinglish touch
    message += `\n💡 *Jaldi karo!* Hisaab clear karo aur tension free raho! 🚀\n`;
    message += `🔄 UPI ya Cash se payment kar sakte ho. ✨\n`;
  }

  // Add app branding with timestamp
  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  message += `\n📱 *BachatKaro* se bheja gaya (${timestamp})`;
  message += `\n🔗 https://bachatkaro.app - Desi Hisaab App!`;

  return message;
};

/**
 * Creates a WhatsApp deep link with encoded message
 * 
 * @param {string} message - The message to encode
 * @returns {string} WhatsApp deep link URL
 */
export const createWhatsAppLink = (message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  // Using the standard WhatsApp API link
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
};

/**
 * Combines summary generation and link creation
 * 
 * @param {GroupDetails} groupDetails - Basic group information
 * @param {Settlement[]} settlements - Array of settlement objects
 * @returns {Object} Contains both the raw message and WhatsApp link
 */
export const prepareWhatsAppShare = (
  groupDetails: GroupDetails,
  settlements: Settlement[]
): { message: string; whatsappLink: string } => {
  const message = generateWhatsAppSummary(groupDetails, settlements);
  const whatsappLink = createWhatsAppLink(message);
  
  return { message, whatsappLink };
};
