// src/services/advancedTripPlanner.ts
// 🛡️ LOGIC LOCK: V2 Engine updated with 3+ Stars & 5+ Reviews strict rule.

import { supabase } from '@/integrations/supabase/client';
import { safeJsonParse } from '@/utils/jsonUtils';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function robustJSONParser(text: string) {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON markers found");
    let cleanString = text.substring(firstBrace, lastBrace + 1);
    cleanString = cleanString.replace(/,\s*([}\]])/g, '$1');
    return safeJsonParse(cleanString, null);
  } catch (error) {
    return null;
  }
}

const getFallbackV2Plan = (destination: string, perPersonBudget: number, budgetTier: string) => ({
  trip_summary: { title: `Exploring ${destination}`, duration: "3 Days / 2 Nights", vibe: "Balanced & Fun", tier: budgetTier },
  budget_breakdown: { per_person: perPersonBudget, daily_limit: Math.round(perPersonBudget / 3), savings_tips: ["Book tickets 1 month early", "Use local transport"] },
  daywise_plan: [ { day: 1, title: "Arrival & Local Sightseeing", activities: [ { time: "11:00 AM", desc: `Check-in at Central ${destination}`, cost: 0, emoji: "🏨" }, { time: "05:00 PM", desc: "Main Market Walk", cost: 500, emoji: "🚶" } ] } ],
  transport_plan: { intercity: "Train/Bus recommended", local: "Rent a scooty or auto", est_cost: Math.round(perPersonBudget * 0.2) },
  stay_options: [ { name: `Zostel or Local Dharamshala`, type: "Budget Stay", cost_per_night: Math.round(perPersonBudget * 0.3) } ],
  food_plan: { must_try: ["Local Thali", "Famous Street Food"], suggestions: [ { name: "Popular Local Dhaba", type: "Mixed", cost: 300 } ] },
  expense_split_logic: "Add all expenses in BachatKaro and let it split evenly.",
  tips: ["Carry physical cash", "Stay hydrated"],
  whatsapp_share_text: `✈️ *TRIP PLAN: ${destination}* 🌴\n\nTap the link below to join!`
});

export const advancedTripService = {
  generatePlan: async (req: { 
    destination: string, origin: string, members: number, totalBudget: number, 
    language: 'English' | 'Hindi' | 'Hinglish', groupId: string, userId: string
  }) => {
    
    if (!GROQ_API_KEY) throw new Error("API Key Missing! Please check your .env file.");
    if (!req.destination || !req.origin || !req.members || !req.totalBudget) {
      throw new Error("Missing required trip details. Destination, origin, members, and budget are mandatory.");
    }

    const perPersonBudget = Math.round(req.totalBudget / req.members);
    let tripDays = perPersonBudget < 5000 ? 2 : perPersonBudget < 15000 ? 3 : 5;
    const dailyBudget = Math.round(perPersonBudget / tripDays);

    let budgetTier = 'MID';
    let tierRules = '';
    if (perPersonBudget < 4000) {
        budgetTier = 'LOW';
        tierRules = "CRITICAL: Very low budget. STRICTLY suggest Dharamshalas, Ashrams, or very cheap hostels. Street food only.";
    } else if (perPersonBudget > 20000) {
        budgetTier = 'HIGH';
        tierRules = "Luxury Budget. Suggest Premium 4/5 star hotels and fine dining.";
    } else {
        tierRules = "Balanced Budget. Mix of good 3-star hotels and popular restaurants.";
    }

    // 🤖 STRICT RULES FOR REAL PLACES ADDED HERE
    const prompt = `Act as an Elite Travel Architect. Plan a trip to ${req.destination} from ${req.origin} for ${req.members} people.
    Language: ${req.language}. Total Budget: ₹${req.totalBudget} (₹${perPersonBudget}/head). Length: ${tripDays} days.
    TIER: ${budgetTier}. ${tierRules}

    CRITICAL RULES FOR PLACES (HOTELS, FOOD, ACTIVITIES):
    1. DO NOT invent names. Every place MUST be real and verifiable on Google Maps.
    2. Hotels/Dharamshalas/Restaurants MUST have 3+ star ratings and 5+ reviews.
    3. Include at least one verified Dharamshala/Ashram in 'stay_options' if budget is Low/Mid.

    Return ONLY strict JSON matching this structure:
    {
      "trip_summary": { "title": "", "duration": "", "vibe": "", "tier": "${budgetTier}" },
      "budget_breakdown": { "per_person": ${perPersonBudget}, "daily_limit": ${dailyBudget}, "savings_tips": [""] },
      "daywise_plan": [ { "day": 1, "title": "", "activities": [ { "time": "", "desc": "", "cost": 0, "emoji": "" } ] } ],
      "transport_plan": { "intercity": "", "local": "", "est_cost": 0 },
      "stay_options": [ { "name": "", "type": "", "cost_per_night": 0 } ],
      "food_plan": { "must_try": [""], "suggestions": [ { "name": "", "type": "", "cost": 0 } ] },
      "expense_split_logic": "Explain how to split evenly in 2 lines",
      "tips": ["", ""],
      "whatsapp_share_text": "Write the exact formatted message with emojis requested by user"
    }`;

    let parsedData = null;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0.1, messages: [{ role: "user", content: prompt }] }),
      });
      if (!response.ok) throw new Error("AI Engine Busy");
      const data = await response.json();
      parsedData = robustJSONParser(data?.choices?.[0]?.message?.content);
      if (!parsedData) throw new Error("Malformed JSON");
    } catch (error) {
      console.warn("[TripPlanner V2] Fallback deployed.", error);
      parsedData = getFallbackV2Plan(req.destination, perPersonBudget, budgetTier);
    }

    const { data: saved, error } = await supabase.from('advanced_trip_plans').insert({
      group_id: req.groupId, created_by: req.userId, destination: req.destination,
      total_budget: req.totalBudget, members_count: req.members, language: req.language,
      budget_tier: budgetTier, plan_data: parsedData
    }).select().single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return saved;
  }
};
