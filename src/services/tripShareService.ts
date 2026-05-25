// src/services/tripShareService.ts
// Enterprise‑grade formatting for trip sharing – emoji‑rich, clean, and robust.

/**
 * Data required to generate the WhatsApp message.
 * All fields are optional except destination, members, budget, and appLink.
 * Strings can be plain text; arrays are automatically joined.
 */
export interface ShareData {
  /** Destination name (e.g., "Goa") */
  destination: string;
  /** Number of members (can be number or string) */
  members: number | string;
  /** Budget per person in INR (can be number or string) */
  budget: number | string;
  /** Clean app deep link – should be something like "https://yourapp.com/groups/123" */
  appLink: string;
  /** List of top places to visit (array or comma‑separated string) */
  topPlaces?: string | string[];
  /** List of recommended hotels (array or comma‑separated string) */
  hotels?: string | string[];
  /** Local food recommendations */
  food?: string;
  /** Local travel advice */
  travelAdvice?: string;
  /** Budget breakdown (e.g., "Stay 40%, Food 30%") */
  budgetBreakdown?: string;
  /** Smart tips for the trip */
  smartAdvice?: string;
  /** Group ID (kept for compatibility, not used directly) */
  groupId?: string;
}

/**
 * Generates a professional, emoji‑rich WhatsApp message for sharing a trip plan.
 * Uses WhatsApp's *bold* syntax for headings and includes a clean call‑to‑action link.
 *
 * @param data - All trip details and the clean app link.
 * @returns A fully formatted WhatsApp message ready to be URL‑encoded.
 */
export const generateWhatsAppMessage = (data: ShareData): string => {
  const {
    destination,
    members,
    budget,
    topPlaces,
    hotels,
    food,
    travelAdvice,
    budgetBreakdown,
    smartAdvice,
    appLink,
  } = data;

  // Safely convert arrays to comma‑separated strings, or use the string as‑is
  const placesText = Array.isArray(topPlaces)
    ? topPlaces.join(', ')
    : (topPlaces || 'Not specified');

  const hotelsText = Array.isArray(hotels)
    ? hotels.join(', ')
    : (hotels || 'Not specified');

  // Uppercase destination safely (fallback to "TRIP" if missing)
  const destUpper = destination ? destination.toUpperCase() : 'TRIP';

  // Return the multi‑line message with proper spacing
  return `✈️ *TRIP PLAN: ${destUpper}* 🌴

Hey team! Check out our smart trip plan generated via BachatKaro App:

👥 *Members:* ${members}
💰 *Budget/Person:* ₹${budget}

🗺️ *Top Places to Visit:*
📍 ${placesText}

🏨 *Stay Options:*
🛏️ ${hotelsText}

🍕 *Must Try Food:*
🍛 ${food || 'Not specified'}

🚕 *Travel Tip:*
${travelAdvice || 'Not specified'}

📊 *Budget Breakdown:*
${budgetBreakdown || 'Not specified'}

💡 *Smart Advice:*
${smartAdvice || 'Not specified'}

🔗 *Tap the link below to join the group, view full details & track expenses:*
${appLink}`;
};

/**
 * Generate a Google Maps search URL for the given destination.
 * @param destination - Place name (e.g., "Taj Mahal, Agra")
 * @returns A direct Google Maps search URL
 */
export const getGoogleMapsUrl = (destination: string): string => {
  if (!destination) return 'https://maps.google.com';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
};