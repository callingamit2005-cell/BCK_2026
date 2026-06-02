// src/services/mentorService.ts
/**
 * Placeholder for future PRO API integration.
 * Provides static and future real‑time financial advice.
 */

export interface MentorAdvice {
  id: string;
  text: string;
  category: string;
  timestamp: Date;
  isPro?: boolean;
}

/**
 * Get recorded (pre‑generated) financial advice.
 * Currently returns a static list, but will be replaced with a database/API call.
 *
 * @param language - User's language code (reserved for future use).
 * @returns A promise resolving to an array of MentorAdvice items.
 */
export const getRecordedAdvice = async (language: string): Promise<MentorAdvice[]> => {
  // In future: fetch from Supabase or external API
  // For now, return a few sample items (can be expanded)
  return [
    { id: '1', text: 'Save at least 20% of your income.', category: 'savings', timestamp: new Date() },
    { id: '2', text: 'Review your expenses every week.', category: 'budgeting', timestamp: new Date() },
    { id: '3', text: 'Avoid impulse purchases; wait 24 hours.', category: 'spending', timestamp: new Date() },
  ];
};

/**
 * Get real‑time AI‑powered advice (PRO feature).
 * Currently a stub – will be implemented with external AI API.
 *
 * @param userData - Object containing salary, expenses, budget, and recent transactions.
 * @param language - User's language code.
 * @returns A promise resolving to a single MentorAdvice item (AI‑generated).
 */
export const getRealtimeAdvice = async (
  userData: {
    salary: number;
    expenses: number;
    budget: number;
    recentTransactions: any[];
  },
  language: string
): Promise<MentorAdvice> => {
  // Simulate AI call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `ai-${Date.now()}`,
    text: `Based on your spending pattern, consider reducing dining out by ₹${
      Math.floor(userData.expenses * 0.1)
    } this month.`,
    category: 'ai-insight',
    timestamp: new Date(),
    isPro: true,
  };
};
