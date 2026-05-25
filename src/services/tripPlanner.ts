// src/services/tripPlanner.ts
// 🛡️ LOGIC LOCK: Missing Export Fixed. 10-Point Executive Blueprint Schema Added.

import { supabase } from '@/integrations/supabase/client';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

import { safeJsonParse } from '@/utils/jsonUtils';

function robustJSONParser(text: string) {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
    const cleanString = text.substring(firstBrace, lastBrace + 1);
    return safeJsonParse(cleanString, null);
  } catch (error) {
    return null;
  }
}

const getFallbackPlan = (destination: string, budget: number, origin: string) => ({
  overview: { duration: "3 Days / 2 Nights", season: "All Year", bestFit: "Budget Travelers" },
  assumptions: { group: "Friends/Family", budgetTarget: `₹${budget} per person`, travelMode: "Bus/Train", stayFocus: "Budget Hostels" },
  travelPlan: {
    flight: { route: `${origin} ➝ ${destination}`, fare: "Not recommended in this budget", arrival: "N/A", postLanding: "N/A" },
    train: { route: `${origin} ➝ ${destination}`, fare: "₹500–₹1,000", time: "~10 hrs", postLanding: "Take local auto/bus" }
  },
  stayStrategy: { location: `Central ${destination}`, areas: "Backpacker areas", hotels: ["Zostel", "Local Guest House"], avgCost: "₹500–₹1000/night" },
  itinerary: [
    { day: 1, title: "Arrival & Local Streets", activities: ["Check-in", "Street walking", "Local cheap food"], dailyBudget: "₹500" },
    { day: 2, title: "Free/Low-cost Attractions", activities: ["Visit public monuments", "Parks/Beaches", "Walking tour"], dailyBudget: "₹700" }
  ],
  transportStrategy: { bestOption: "Public Bus / Walking", backup: "Shared Auto" },
  foodStrategy: { mustTry: ["Street Food", "Local Dhabas"], avgCost: "₹400/day" },
  costBreakdown: { travel: "₹1000", stay: "₹1000", food: "₹800", activities: "₹200", transport: "₹300", shopping: "₹0", total: `₹3300 approx.` },
  riskPlan: { rain: "Stay indoors", budget: "Strictly avoid cafes", health: "Drink filtered water" },
  checklist: ["Book sleeper class early", "Carry own water bottle", "Pack light"]
});

// 🚀 THIS WAS THE MISSING EXPORT THAT CAUSED THE CRASH
export const tripPlannerService = {
  generatePlan: async (req: any): Promise<any> => {
    if (!GROQ_API_KEY) throw new Error("API Key Missing! Restart Server.");
    if (!req.destination || !req.origin || !req.members || !req.budgetPerPerson) {
      throw new Error("Missing required trip details. Destination, origin, members, and budget are mandatory.");
    }

    const isLowBudget = req.budgetPerPerson < 2500;
    const budgetAdvice = isLowBudget 
      ? "CRITICAL: The budget is very low. In 'overview.bestFit' write: 'Bhai, budget bahut low hai, thoda badao ya phir strict backpacker style adjust karna padega!'" 
      : "The budget is healthy. Plan a premium/balanced experience.";

    const prompt = `Act as an Executive Travel Consultant. Create a STRICT 10-point Blueprint for ${req.destination} from ${req.origin} for ${req.members} people with a HARD TOTAL BUDGET of ₹${req.budgetPerPerson * req.members} (₹${req.budgetPerPerson} per person).
    ${budgetAdvice}
    
    CRITICAL RULES:
    1. The TOTAL cost across all categories MUST NOT EXCEED ₹${req.budgetPerPerson * req.members}.
    2. Every Hotel and Restaurant MUST include a "mapQuery" field containing a Google Maps search string.
    3. Recommendations must be realistic for the budget (e.g., if budget is low, suggest hostels/dhabas).

    Return ONLY strict JSON:
    {
      "overview": { "duration": "", "season": "", "bestFit": "" },
      "assumptions": { "group": "", "budgetTarget": "₹${req.budgetPerPerson}/person", "travelMode": "", "stayFocus": "" },
      "travelPlan": { "flight": { "route": "", "fare": "", "arrival": "", "postLanding": "" }, "train": { "route": "", "fare": "", "time": "", "postLanding": "" } },
      "stayStrategy": { 
        "location": "", 
        "areas": "", 
        "hotels": [
          { "name": "", "budget": "₹XXX", "mapQuery": "", "desc": "" }
        ], 
        "avgCost": "" 
      },
      "itinerary": [ { "day": 1, "title": "", "activities": [ { "name": "", "mapQuery": "", "cost": "" } ], "dailyBudget": "" } ],
      "transportStrategy": { "bestOption": "", "backup": "" },
      "foodStrategy": { "mustTry": [ { "name": "", "mapQuery": "", "type": "" } ], "avgCost": "" },
      "costBreakdown": { "travel": "", "stay": "", "food": "", "activities": "", "transport": "", "total": "₹${req.budgetPerPerson * req.members}" },
      "riskPlan": { "rain": "", "budget": "", "health": "" },
      "checklist": ["","","","",""]
    }
    STRICT RULE: NO markdown. NO backticks. NO preamble.`;

    let parsedData = null;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0, messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) throw new Error("API_BUSY");
      const data = await response.json();
      parsedData = robustJSONParser(data?.choices?.[0]?.message?.content);
      if (!parsedData) throw new Error("PARSE_FAILED");
    } catch (error) {
      console.error("[TripPlanner] Using Budget-Aware Fallback.");
      parsedData = getFallbackPlan(req.destination, req.budgetPerPerson, req.origin);
    }

    const uniqueVersion = Math.floor(Date.now() / 1000);
    const { data: saved, error } = await supabase.from('trip_plans').insert({
      group_id: req.groupId, user_id: req.userId, destination: req.destination, origin: req.origin,
      nickname: "Executive Blueprint", budget_per_person: req.budgetPerPerson, total_members: req.members,
      plan_data: parsedData, version: uniqueVersion
    }).select().single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return saved;
  }
};