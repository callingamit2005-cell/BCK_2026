// src/services/tripShareService.ts
interface ShareData {
  groupId: string;
  destination: string;
  members: number;
  budget: number;
  topPlaces: string[];
}

export const generateWhatsAppMessage = (data: ShareData): string => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const deepLink = `${baseUrl}/trip-share/${data.groupId}`;
  const highlights = data.topPlaces.slice(0, 3).join(', ');
  return `
🌍 Trip Plan for ${data.destination}

👥 Members: ${data.members}
💰 Budget: ₹${data.budget}

✨ Highlights:
${highlights}

👉 View Full Plan:
${deepLink}
  `.trim();
};

export const getGoogleMapsUrl = (destination: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
};