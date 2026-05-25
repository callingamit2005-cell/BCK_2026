import { isValidDate } from './dateFilters';
import { formatCurrency } from './currencyFormatter';
import { aiRouter, AITelemetry } from '@/services/aiRouter';

export interface Transaction {
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  sender?: string;
}

export interface InvestmentPlan {
  sipAmount: number;
  emergencyTarget: number;
  savingsRate: number;
  riskProfile: "Low" | "Medium" | "High";
  strategy: string;
}

export interface StructuredAIAdvice {
  action: string;
  reason: string;
  steps: string;
  insights: string;
  projection: string;
  growth: string;
  healthScore: number;
  healthReason: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  investmentOptions?: {
    sip: string;
    emergency: string;
    fd: string;
  };
  platforms?: string[];
  personalizedPlan?: InvestmentPlan;
}

const DEFAULT_ADVICE: StructuredAIAdvice = {
  action: "Beta, kharch note karna shuru karo.",
  reason: "Jab tak data nahi hoga, main sahi rasta nahi dikha paunga.",
  steps: "1. SMS sync enable karo\n2. Manual entry dalo\n3. Daily kharch check karo",
  insights: "Start tracking expenses to unlock smart insights.",
  projection: "Track spending to see future predictions.",
  growth: "Start saving today to see investment tips.",
  healthScore: 50,
  healthReason: "Financial health score is neutral without transaction history.",
  confidence: "LOW",
  investmentOptions: {
    sip: "Index Funds ya Bluechip Funds mein monthly ₹500 se shuru karein.",
    emergency: "Pehle 3 mahine ke kharch jitna paisa alag rakhein.",
    fd: "Safe returns ke liye Bank FD ek acha option hai."
  },
  platforms: ["Groww", "Zerodha", "Paytm Money"],
  personalizedPlan: {
    sipAmount: 500,
    emergencyTarget: 10000,
    savingsRate: 0,
    riskProfile: "Low",
    strategy: "Pehle budgeting master karein, phir investing."
  }
};

export interface FinancialSummary {
  incomeTotal: number;
  expenseTotal: number;
  surplus: number;
  savingsRate: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  topMerchants: Array<{ name: string; amount: number }>;
  unusualSpikes: string[];
  transactionCount: number;
  unnecessarySpend: number;
  monthYear: string;
}

/**
 * 🛡️ [PHASE_31] FINTECH DATA COMPRESSION LAYER
 * Reduces 500+ transactions into a lightweight deterministic snapshot.
 */
export const summarizeLedger = (transactions: Transaction[]): FinancialSummary => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthYear = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;

  const currentMonthTxs = transactions.filter(t => {
    if (!t.date || !isValidDate(t.date)) return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  let incomeTotal = 0;
  let expenseTotal = 0;
  const categoryMap: Record<string, number> = {};
  const merchantMap: Record<string, number> = {};
  const unnecessaryCats = ['food', 'shopping', 'entertainment', 'others'];
  let unnecessarySpend = 0;

  currentMonthTxs.forEach(t => {
    const amt = Number(t.amount || 0);
    if (t.type === 'income') {
      incomeTotal += amt;
    } else {
      expenseTotal += amt;
      const cat = t.category || 'Others';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      
      const merchant = t.sender || 'Unknown';
      merchantMap[merchant] = (merchantMap[merchant] || 0) + amt;

      if (unnecessaryCats.includes(cat.toLowerCase())) {
        unnecessarySpend += amt;
      }
    }
  });

  const surplus = Math.max(0, incomeTotal - expenseTotal);
  const savingsRate = incomeTotal > 0 ? (surplus / incomeTotal) * 100 : 0;

  const topCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topMerchants = Object.entries(merchantMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Simple unusual spike detection (e.g., > 3x average)
  const unusualSpikes: string[] = [];
  if (currentMonthTxs.length >= 5) {
    const avgExpense = expenseTotal / currentMonthTxs.filter(t => t.type === 'expense').length;
    currentMonthTxs
      .filter(t => t.type === 'expense' && t.amount > avgExpense * 3)
      .slice(0, 2)
      .forEach(t => {
        unusualSpikes.push(`High spend: ₹${(t.amount/100).toLocaleString('en-IN')} at ${t.sender || t.category}`);
      });
  }

  return {
    incomeTotal,
    expenseTotal,
    surplus,
    savingsRate,
    topCategories,
    topMerchants,
    unusualSpikes,
    transactionCount: currentMonthTxs.length,
    unnecessarySpend,
    monthYear
  };
};

/**
 * Advanced Personalization Engine
 * Tone: Father + Mentor (Hinglish)
 */
export const getRuleBasedStructuredAdviceFromSummary = (summary: FinancialSummary): StructuredAIAdvice => {
  if (summary.transactionCount === 0) return DEFAULT_ADVICE;

  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (summary.transactionCount > 20) confidence = "HIGH";
  else if (summary.transactionCount >= 5) confidence = "MEDIUM";

  const potentialSavings = Math.round(summary.unnecessarySpend * 0.4);
  
  // Personalized Plan Calculation
  const sipAmount = Math.max(500, Math.floor((summary.surplus * 0.5) / 100 / 100) * 100);
  const emergencyMonthly = Math.max(500, Math.floor((summary.surplus * 0.3) / 100 / 100) * 100);
  const emergencyTarget = Math.round((summary.expenseTotal * 3) / 100 / 100) * 100;

  let riskProfile: InvestmentPlan['riskProfile'] = "Low";
  if (summary.savingsRate > 30) riskProfile = "High";
  else if (summary.savingsRate > 15) riskProfile = "Medium";

  // Logic for Health Score
  let score = 70;
  let healthReason = "Beta, aapka budget balance mein hai, sahi chapa hai!";
  if (summary.incomeTotal > 0) {
    const ratio = summary.expenseTotal / summary.incomeTotal;
    if (ratio > 1) { score = 30; healthReason = "Overspending alert! Income se zyada kharch ho raha hai, beta."; }
    else if (ratio > 0.8) { score = 50; healthReason = "Savings kam hain. Faltu 'Wants' pe control rakho."; }
    else if (ratio < 0.5) { score = 90; healthReason = "Shabaash! Aapki savings discipline bohot solid hai."; }
  }

  return {
    action: potentialSavings > 0 ? `Beta, ₹${(potentialSavings/100).toLocaleString('en-IN')} extra bacha lo.` : "Current budget follow karte raho.",
    reason: summary.unnecessarySpend > 0 ? `${formatCurrency(summary.unnecessarySpend)} 'Wants' mein kharch ho raha hai, sambhal jao.` : "Wasteful kharch nahi hai, good job!",
    steps: `1. ₹${sipAmount} ki SIP shuru karo\n2. Emergency fund mein ₹${emergencyMonthly} dalo\n3. Daily kharch note karte raho`,
    insights: `Is mahine ${summary.transactionCount} transactions kiye hain. Top spending: ${summary.topCategories[0]?.category || 'N/A'}.`,
    projection: summary.surplus > 0 ? `Yahi pattern raha toh saal mein ₹${(summary.surplus * 12 / 100).toLocaleString('en-IN')} save karoge. ✨` : "Projected savings focus ki zaroorat hai, beta.",
    growth: summary.surplus > 100000 ? `Aap ₹${(summary.surplus/100).toLocaleString('en-IN')} save kar rahe ho — isme se ₹${sipAmount} SIP start karo.` : "Pehle 3 mahine ka emergency fund banana zaroori hai.",
    healthScore: score,
    healthReason: healthReason,
    confidence: confidence,
    investmentOptions: {
      sip: sipAmount > 1000 ? `Monthly ₹${sipAmount} Index Funds mein dalo, wealth banegi.` : "₹500 se bhi SIP start ho sakti hai, der mat karo.",
      emergency: `Target: ₹${emergencyTarget.toLocaleString('en-IN')}. Mushkil waqt ke liye paisa alag rakho.`,
      fd: "Safe returns chahiye toh Bank FD ya Liquid Funds best hain."
    },
    platforms: ["Groww", "Zerodha", "Paytm Money"],
    personalizedPlan: {
      sipAmount,
      emergencyTarget,
      savingsRate: summary.savingsRate,
      riskProfile,
      strategy: riskProfile === "High" ? "Aggressive Growth plan follow karo, beta." : "Safe and Consistent wealth building pe focus karo."
    }
  };
};

// Deprecated in favor of summary-based logic, kept for API compatibility
export const getRuleBasedStructuredAdvice = (transactions: Transaction[]): StructuredAIAdvice => {
  const summary = summarizeLedger(transactions);
  return getRuleBasedStructuredAdviceFromSummary(summary);
};

function sanitizeAIResponse(raw: string): string {
  if (typeof raw !== 'string') return '';
  if (raw.length > 2000) raw = raw.substring(0, 2000);
  let clean = raw.replace(/```(?:json)?([\s\S]*?)```/g, '$1');
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace === -1 || lastBrace === -1) {
    return ''; // Invalid JSON structure
  }
  return clean.trim();
}

function validateStructuredAIAdvice(parsed: any, fallback: StructuredAIAdvice): StructuredAIAdvice {
  if (!parsed || typeof parsed !== 'object') return fallback;
  
  return {
    action: typeof parsed.action === 'string' ? parsed.action.substring(0, 100) : fallback.action,
    reason: typeof parsed.reason === 'string' ? parsed.reason.substring(0, 150) : fallback.reason,
    steps: typeof parsed.steps === 'string' ? parsed.steps.substring(0, 300) : fallback.steps,
    insights: typeof parsed.insights === 'string' ? parsed.insights.substring(0, 150) : fallback.insights,
    projection: typeof parsed.projection === 'string' ? parsed.projection.substring(0, 150) : fallback.projection,
    growth: typeof parsed.growth === 'string' ? parsed.growth.substring(0, 150) : fallback.growth,
    healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : fallback.healthScore,
    healthReason: typeof parsed.healthReason === 'string' ? parsed.healthReason.substring(0, 150) : fallback.healthReason,
    confidence: ["HIGH", "MEDIUM", "LOW"].includes(parsed.confidence) ? parsed.confidence : fallback.confidence,
    investmentOptions: {
      sip: typeof parsed.investmentOptions?.sip === 'string' ? parsed.investmentOptions.sip.substring(0, 100) : fallback.investmentOptions?.sip || '',
      emergency: typeof parsed.investmentOptions?.emergency === 'string' ? parsed.investmentOptions.emergency.substring(0, 100) : fallback.investmentOptions?.emergency || '',
      fd: typeof parsed.investmentOptions?.fd === 'string' ? parsed.investmentOptions.fd.substring(0, 100) : fallback.investmentOptions?.fd || ''
    },
    platforms: Array.isArray(parsed.platforms) ? parsed.platforms.slice(0, 3).map(String) : fallback.platforms,
    personalizedPlan: {
      sipAmount: typeof parsed.personalizedPlan?.sipAmount === 'number' ? parsed.personalizedPlan.sipAmount : fallback.personalizedPlan?.sipAmount || 0,
      emergencyTarget: typeof parsed.personalizedPlan?.emergencyTarget === 'number' ? parsed.personalizedPlan.emergencyTarget : fallback.personalizedPlan?.emergencyTarget || 0,
      savingsRate: typeof parsed.personalizedPlan?.savingsRate === 'number' ? parsed.personalizedPlan.savingsRate : fallback.personalizedPlan?.savingsRate || 0,
      riskProfile: ["Low", "Medium", "High"].includes(parsed.personalizedPlan?.riskProfile) ? parsed.personalizedPlan.riskProfile : fallback.personalizedPlan?.riskProfile || "Low",
      strategy: typeof parsed.personalizedPlan?.strategy === 'string' ? parsed.personalizedPlan.strategy.substring(0, 150) : fallback.personalizedPlan?.strategy || ''
    }
  };
}

/**
 * 🛡️ SAFE JSON PARSER (AI Defense)
 * Never allow malformed AI output to crash the application.
 */
function safeJsonParse(input: any, fallback = null) {
  try {
    const clean = sanitizeAIResponse(input);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI_DIAGNOSTIC] Raw Length: ${input?.length}, Sanitized Length: ${clean?.length}`);
    }

    if (!clean) {
      AITelemetry.logParseFailure();
      return fallback;
    }

    const parsed = JSON.parse(clean);
    return (parsed && typeof parsed === "object") ? parsed : fallback;
  } catch (e) {
    AITelemetry.logParseFailure();
    if (process.env.NODE_ENV === 'development') {
      console.warn("AI JSON parse failed:", e);
    }
    return fallback;
  }
}

/**
 * Rich Structured AI Advice Generator
 */
export const getRichStructuredAIAdvice = async (transactions: Transaction[], language: string = 'hinglish'): Promise<StructuredAIAdvice> => {
  // 🛡️ [PHASE_31] LOCAL PREPROCESSING
  // Summarize first to prevent O(N) re-processing in rule engine and prompt builder
  const summary = summarizeLedger(transactions);
  const fallback = getRuleBasedStructuredAdviceFromSummary(summary);
  
  if (summary.transactionCount === 0) return fallback;

  try {
    // 🛡️ [TOKEN_HARDENING] Reduced context payload
    const context = {
      income: summary.incomeTotal,
      totalExpense: summary.expenseTotal,
      unnecessaryTotal: summary.unnecessarySpend,
      projectedSavings: summary.surplus,
      language
    };

    // 🛡️ [DATA_COMPRESSION] Enriched compressed prompt
    const topCatsStr = summary.topCategories.map(c => `${c.category}: ₹${(c.amount/100).toFixed(0)} (${c.percentage.toFixed(0)}%)`).join(', ');
    const spikesStr = summary.unusualSpikes.length > 0 ? `Spikes: ${summary.unusualSpikes.join('; ')}` : '';

    const prompt = `Financial Snapshot for ${summary.monthYear}:
    - Income: ₹${(summary.incomeTotal/100).toLocaleString('en-IN')}
    - Expense: ₹${(summary.expenseTotal/100).toLocaleString('en-IN')}
    - Top Spending: ${topCatsStr}
    - ${spikesStr}
    - Local Recommendation: ${fallback.action}
    - Local Reason: ${fallback.reason}

    Please refine this into a personal 'Father + Mentor' style advice in Hinglish.
    Be wise, concise, and provide actionable steps.
    Include investment advice (SIP: ₹${fallback.personalizedPlan?.sipAmount}, Emergency: ₹${fallback.personalizedPlan?.emergencyTarget}).
    Return ONLY valid JSON with exactly the same keys as structured advice.`;

    const aiResponse = await aiRouter.generateAIResponse(prompt, context as any);
    
    if (aiResponse) {
      const parsed = safeJsonParse(aiResponse, null) as any;
      if (parsed && Object.keys(parsed).length > 0) {
        const validated = validateStructuredAIAdvice(parsed, fallback);
        
        if (process.env.NODE_ENV === 'development') {
          console.log("[AI_DIAGNOSTIC] Validation complete. Confidence:", validated.confidence);
        }

        return validated;
      }
    }
    
    // AI failed to return a response or parse failed
    AITelemetry.logFallback();
  } catch (err) {
    AITelemetry.logFallback();
    if (process.env.NODE_ENV === 'development') {
      console.error("Structured AI fetch failed:", err);
    }
  }

  return fallback;
};
