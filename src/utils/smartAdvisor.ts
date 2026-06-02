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
  // Behavioral Patterns
  lateNightSpend: number; // 10PM - 4AM
  weekendSpend: number;
  salaryExhaustionDay: number | null; // Day of month when 80% of income is spent
  upiVelocity: number; // Avg transactions per day
  smallUpiHabitCount: number; // Count of small transactions < 200
  firstHalfSpend: number;
  secondHalfSpend: number;
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
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let incomeTotal = 0;
  let expenseTotal = 0;
  let lateNightSpend = 0;
  let weekendSpend = 0;
  let unnecessarySpend = 0;
  let cumulativeExpense = 0;
  let salaryExhaustionDay: number | null = null;
  let smallUpiHabitCount = 0;
  let firstHalfSpend = 0;
  let secondHalfSpend = 0;
  
  const categoryMap: Record<string, number> = {};
  const merchantMap: Record<string, number> = {};
  const unnecessaryCats = ['food', 'shopping', 'entertainment', 'others'];

  currentMonthTxs.forEach(t => {
    const amt = Number(t.amount || 0);
    const d = new Date(t.date);
    const hour = d.getHours();
    const day = d.getDay();
    const dateNum = d.getDate();

    if (t.type === 'income') {
      incomeTotal += amt;
    } else {
      expenseTotal += amt;
      cumulativeExpense += amt;
      
      const cat = t.category || 'Others';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      
      const merchant = t.sender || 'Unknown';
      merchantMap[merchant] = (merchantMap[merchant] || 0) + amt;

      if (unnecessaryCats.includes(cat.toLowerCase())) {
        unnecessarySpend += amt;
      }

      // Behavioral detection
      if (hour >= 22 || hour <= 4) lateNightSpend += amt;
      if (day === 0 || day === 6) weekendSpend += amt;
      if (amt > 0 && amt < 20000) smallUpiHabitCount++; // < 200 rupees
      
      if (dateNum <= 15) firstHalfSpend += amt;
      else secondHalfSpend += amt;

      // Salary exhaustion check (80% threshold)
      if (incomeTotal > 0 && !salaryExhaustionDay && cumulativeExpense >= (incomeTotal * 0.8)) {
        salaryExhaustionDay = dateNum;
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

  const unusualSpikes: string[] = [];
  if (currentMonthTxs.length >= 5) {
    const avgExpense = expenseTotal / (currentMonthTxs.filter(t => t.type === 'expense').length || 1);
    currentMonthTxs
      .filter(t => t.type === 'expense' && t.amount > avgExpense * 3)
      .slice(0, 2)
      .forEach(t => {
        unusualSpikes.push(`High spend: ₹${(t.amount/100).toLocaleString('en-IN')} at ${t.sender || t.category}`);
      });
  }

  const daysPassed = Math.max(1, now.getDate());

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
    monthYear,
    lateNightSpend,
    weekendSpend,
    salaryExhaustionDay,
    upiVelocity: currentMonthTxs.length / daysPassed,
    smallUpiHabitCount,
    firstHalfSpend,
    secondHalfSpend
  };
};

/**
 * Advanced Personalization Engine
 * Tone: Experienced Wealth Mentor, Emotionally Intelligent
 * Supported Languages: English, Hindi, Hinglish
 */
export const getRuleBasedStructuredAdviceFromSummary = (summary: FinancialSummary, language: string = 'en'): StructuredAIAdvice => {
  const isHindi = language === 'hi';
  const isHinglish = language === 'hinglish' || language.includes('in');
  
  const fmt = (val: number) => `₹${(val / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (summary.transactionCount === 0) {
    return {
      action: isHindi ? "बेटा, खर्चे लिखना शुरू करो।" : (isHinglish ? "Beta, kharcha track karna start karo." : "Start tracking your expenses."),
      reason: isHindi ? "बिना डेटा के मैं सही रास्ता नहीं दिखा पाऊंगा।" : (isHinglish ? "Bina data ke main sahi rasta nahi dikha paunga." : "Without data, I can't give you accurate financial guidance."),
      steps: isHindi ? "1. खर्चे डालो\n2. बजट बनाओ" : (isHinglish ? "1. Daily kharcha dalo\n2. Budget set karo" : "1. Log daily expenses\n2. Set a budget"),
      insights: isHindi ? "स्मार्ट इनसाइट्स के लिए खर्चे ट्रैक करें।" : (isHinglish ? "Start tracking to unlock insights." : "Track spending to unlock insights."),
      projection: isHindi ? "खर्च ट्रैक करने पर भविष्य की बचत दिखेगी।" : (isHinglish ? "Track spending to see future predictions." : "Track spending to see future predictions."),
      growth: isHindi ? "आज से बचत शुरू करें।" : (isHinglish ? "Aaj se save karna shuru karo." : "Start saving today."),
      healthScore: 50,
      healthReason: isHindi ? "डेटा नहीं है।" : (isHinglish ? "Data missing hai." : "No data available."),
      confidence: "LOW",
      investmentOptions: { sip: "", emergency: "", fd: "" },
      platforms: ["Groww", "Zerodha"],
      personalizedPlan: { sipAmount: 0, emergencyTarget: 0, savingsRate: 0, riskProfile: "Low", strategy: "" }
    };
  }

  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (summary.transactionCount > 20) confidence = "HIGH";
  else if (summary.transactionCount >= 5) confidence = "MEDIUM";

  const potentialSavings = Math.round(summary.unnecessarySpend * 0.4);
  // [BUG-FIX] surplus/expenseTotal are in PAISA. Convert to rupees ONCE (/100).
  // Previous code divided by /100/100 — made amounts 100x too small (e.g. ₹26 instead of ₹2600).
  const surplusRupees = summary.surplus / 100;
  const expenseTotalRupees = summary.expenseTotal / 100;
  const sipAmount = Math.max(500, Math.floor((surplusRupees * 0.5) / 100) * 100);
  const emergencyMonthly = Math.max(500, Math.floor((surplusRupees * 0.3) / 100) * 100);
  const emergencyTarget = Math.round((expenseTotalRupees * 3) / 100) * 100;

  let riskProfile: InvestmentPlan['riskProfile'] = "Low";
  if (summary.savingsRate > 30) riskProfile = "High";
  else if (summary.savingsRate > 15) riskProfile = "Medium";

  // --- Behavioral Logic Layer ---
  let emotion = "stable";
  let score = 70;
  
  const ratio = summary.incomeTotal > 0 ? summary.expenseTotal / summary.incomeTotal : 1.1;
  const highFoodAndShopping = (summary.topCategories.find(c => c.category.toLowerCase() === 'food')?.amount || 0) + 
                              (summary.topCategories.find(c => c.category.toLowerCase() === 'shopping')?.amount || 0);
  const lifestyleRatio = summary.expenseTotal > 0 ? highFoodAndShopping / summary.expenseTotal : 0;

  if (ratio > 0.95) { 
    score = 25; 
    emotion = "stress"; 
  } else if (summary.salaryExhaustionDay && summary.salaryExhaustionDay < 15) {
    score = 40;
    emotion = "exhaustion";
  } else if (summary.lateNightSpend > (summary.expenseTotal * 0.15)) {
    score = 55;
    emotion = "impulsive_night";
  } else if (summary.smallUpiHabitCount > 30) {
    score = 60;
    emotion = "upi_habit";
  } else if (lifestyleRatio > 0.45) {
    emotion = "lifestyle_inflation";
    score = 50;
  } else if (ratio < 0.4 && summary.transactionCount > 10) { 
    score = 95; 
    emotion = "elite"; 
  } else if (ratio < 0.6) {
    score = 85;
    emotion = "disciplined";
  }

  let actionStr = "";
  let reasonStr = "";
  let healthReasonStr = "";
  let projectionStr = "";
  let growthStr = "";
  let strategyStr = "";

  // 🛡️ [EMOTIONAL_MENTOR_STRINGS] - Varied to avoid repetition fatigue
  if (emotion === "stress") {
    const variations = [
      isHindi ? "खर्चे तुरंत रोकें, सैलरी पर भारी दबाव है।" : (isHinglish ? "Emergency alert! Paisa bahut fast nikal raha hai, control karo." : "Halt non-essential spending. Your outgoing velocity is dangerous."),
      isHindi ? "कैश बचाएं, यह महीना मुश्किल हो सकता है।" : (isHinglish ? "Current spending month-end pressure create kar sakta hai." : "Spending trajectory suggests end-of-month liquidity risk.")
    ];
    actionStr = variations[summary.transactionCount % variations.length];
    reasonStr = isHindi ? "आप अपनी कमाई से ज्यादा खर्च कर रहे हैं। यह कर्ज का जाल बन सकता है।" : (isHinglish ? "Aap income se zyada spend kar rahe ho. Bina savings ke emergency sambhalna mushkil hoga." : "You're spending more than you earn. This trajectory leads directly to financial instability.");
    healthReasonStr = isHindi ? "वित्तीय तनाव बहुत ज्यादा है।" : (isHinglish ? "Financial stress moderate hai. Cash-flow pressure feel hoga." : "High financial stress detected. Stability is compromised.");
    projectionStr = isHindi ? "बचत शून्य की ओर जा रही है।" : (isHinglish ? "Savings zero ki taraf ja rahi hai, sambhal jao." : "Projected savings are near zero.");
    growthStr = isHindi ? "अभी निवेश से ज्यादा पैसा बचाने पर ध्यान दें।" : (isHinglish ? "Abhi investment se zyada cash preservation zaroori hai." : "Prioritize cash retention over new investments right now.");
    strategyStr = isHindi ? "कठोर बजट लागू करें।" : (isHinglish ? "Strict survival budget follow karna padega, beta." : "Implement a strict survival budget immediately.");
  } 
  else if (emotion === "exhaustion") {
    actionStr = isHindi ? "महीने के अंत के लिए बैकअप रखें।" : (isHinglish ? `Salary fast khatam ho rahi hai. Month ke start mein hi 80% budget exhaust.` : `Slow down. You've burned 80% of your budget in the first half of the month.`);
    reasonStr = isHindi ? "महीने के पहले हिस्से में खर्च बहुत तेज है।" : (isHinglish ? "Aapka paisa month ke start mein fast nikal raha hai. End tak pressure aa jayega." : "Your spending velocity in the first 15 days is unsustainable for the full month.");
    healthReasonStr = isHindi ? "कैश-फ्लो दबाव में है।" : (isHinglish ? "Cash-flow tight hai. Month-end kaise manage karoge?" : "Imbalanced cash-flow. End-of-month deficit likely.");
    projectionStr = isHindi ? "महीना खत्म होने से पहले पैसे खत्म हो सकते हैं।" : (isHinglish ? "Is speed se chale toh month-end tak udhaar lena pad sakta hai." : "At this rate, you'll be out of cash before your next payday.");
    growthStr = isHindi ? "SIP से पहले कैश फ्लो बैलेंस करें।" : (isHinglish ? "Pehle salary ko full month chalana seekho, phir SIP badhao." : "Balance your burn rate before increasing investment commitments.");
    strategyStr = isHindi ? "डेली खर्च की लिमिट सेट करें।" : (isHinglish ? "Daily spend cap set karo warna month-end tough hoga." : "Apply a strict daily spending cap of ₹500 for the next 10 days.");
  }
  else if (emotion === "impulsive_night") {
    actionStr = isHindi ? "देर रात के ऑर्डर्स पर नियंत्रण रखें।" : (isHinglish ? `Raat ke orders control karo. ₹${(summary.lateNightSpend/100).toFixed(0)} sirf 10PM ke baad kharch hue.` : `Control late-night spending. You spent ${fmt(summary.lateNightSpend)} after 10 PM.`);
    reasonStr = isHindi ? "देर रात के फूड और शॉपिंग ऑर्डर्स बजट बिगाड़ रहे हैं।" : (isHinglish ? "Raat ke food orders milkar month-end mein ₹4000+ extra kharcha bana rahe hain." : "Late-night food deliveries are small but cumulative. They're draining ₹4000+ monthly.");
    healthReasonStr = isHindi ? "रात के खर्चों में स्पाइक है।" : (isHinglish ? "Impulsive behavior alert! Raat ki cravings budget kha rahi hain." : "Impulsive night-time spending detected.");
    projectionStr = isHindi ? "इन्हें रोककर आप बड़ी बचत कर सकते हैं।" : (isHinglish ? `Cravings control kiye toh saal mein ${fmt(summary.lateNightSpend * 12)} extra bachenge.` : `Redirecting night orders could save you ${fmt(summary.lateNightSpend * 12)} annually.`);
    growthStr = isHindi ? "इस फिजूलखर्ची को SIP में बदलें।" : (isHinglish ? "In orders ka paisa SIP mein dalo, future set hoga." : "Convert late-night impulses into a compounding wealth fund.");
    strategyStr = isHindi ? "रात में एप्स से दूर रहें।" : (isHinglish ? "10 PM ke baad food/shopping apps mat kholo." : "Uninstall food delivery apps or disable notifications after 9 PM.");
  }
  else if (emotion === "upi_habit") {
    actionStr = isHindi ? "छोटे UPI पेमेंट्स पर नजर रखें।" : (isHinglish ? `UPI habit alert! Is month ${summary.smallUpiHabitCount} baar small payments kiye.` : `Watch your UPI habits. You made ${summary.smallUpiHabitCount} small transactions this month.`);
    reasonStr = isHindi ? "छोटे-छोटे ₹20-₹50 के खर्च पता भी नहीं चलते और बजट खा जाते हैं।" : (isHinglish ? "Chhote-chhote UPI kharche silently savings ko kha rahe hain. Aapko track bhi nahi rehta." : "Micro-transactions (₹20-₹50) are invisible leaks. They're silently eroding your surplus.");
    healthReasonStr = isHindi ? "UPI खर्चों की फ्रीक्वेंसी ज्यादा है।" : (isHinglish ? "UPI velocity high hai. Control income nahi, habit hai." : "High frequency of small UPI transactions.");
    projectionStr = isHindi ? "इन आदतों को सुधारना जरूरी है।" : (isHinglish ? "Small leaks fix kiye toh savings 20% badh sakti hai." : "Fixing small leaks can boost your monthly savings by 20%.");
    growthStr = isHindi ? "बचत की आदत डालें।" : (isHinglish ? "Aap save kar sakte ho, problem income nahi — daily spending hai." : "You have the capacity to save; the issue is habit, not income.");
    strategyStr = isHindi ? "कैश का इस्तेमाल करें।" : (isHinglish ? "Next 5 din sirf Cash use karo, UPI band rakho." : "Try using strictly cash for all small daily needs for 5 days.");
  }
  else if (emotion === "lifestyle_inflation") {
    actionStr = isHindi ? "लाइफस्टाइल खर्चों को संतुलित करें।" : (isHinglish ? `Lifestyle inflation! Wants pe ${fmt(highFoodAndShopping)} kharch ho raha hai.` : `Balance lifestyle inflation. Discretionary spend hit ${fmt(highFoodAndShopping)}.`);
    reasonStr = isHindi ? "शौक और जरूरत के बीच का अंतर पहचानें।" : (isHinglish ? "Amazon aur Swiggy se zyada focus emergency fund pe hona chahiye." : "Your standard of living is rising faster than your standard of saving.");
    healthReasonStr = isHindi ? "लाइफस्टाइल खर्चे अधिक हैं।" : (isHinglish ? "Wants pe kharcha unusually high hai. Need vs Want samjho." : "Lifestyle maintenance cost is too high.");
    projectionStr = isHindi ? "भविष्य की वेल्थ पर असर पड़ सकता है।" : (isHinglish ? `Is pattern se wealth building slow hai. Change zaroori hai.` : `This lifestyle will delay your financial freedom by years.`);
    growthStr = isHindi ? "शॉपिंग से ज्यादा निवेश को महत्व दें।" : (isHinglish ? "Shopping apps se zyada SIP apps use karna shuru karo." : "Own assets that pay you, not products that cost you.");
    strategyStr = isHindi ? "24-घंटे का नियम अपनाएं।" : (isHinglish ? "Har purchase se pehle 24 ghante wait karne ki aadat dalo." : "Apply the 24-hour rule to every non-essential purchase.");
  }
  else if (emotion === "elite" || emotion === "disciplined") {
    actionStr = isHindi ? "आप बेहतरीन काम कर रहे हैं, निवेश बढ़ाएं!" : (isHinglish ? "Solid discipline! Savings speed ekdum mast hai. Shabaash!" : "Elite financial discipline! Your retention rate is outstanding. Well done.");
    reasonStr = isHindi ? "कमाई का बड़ा हिस्सा बचाना ही अमीरी का रास्ता है।" : (isHinglish ? "Aap income ka bada portion retain kar rahe ho, this is brilliant discipline." : "Retaining a high percentage of income is the fastest path to wealth.");
    healthReasonStr = isHindi ? "आर्थिक स्थिति बहुत मजबूत है।" : (isHinglish ? "Financial condition bohot strong hai. Tension free raho." : "Exceptional financial stability.");
    projectionStr = isHindi ? `एक साल में आप ${fmt(summary.surplus * 12)} जोड़ लेंगे!` : (isHinglish ? `Yahi speed rahi toh saal bhar mein ${fmt(summary.surplus * 12)} ki wealth build hogi! ✨` : `Outstanding! You are on track to accumulate ${fmt(summary.surplus * 12)} this year! ✨`);
    growthStr = isHindi ? `अब ₹${sipAmount.toLocaleString('en-IN')} की एग्रेसिव SIP का सही समय है।` : (isHinglish ? `Abhi ₹${sipAmount.toLocaleString('en-IN')} ki aggressive SIP dalo, wealth compound hogi.` : `Perfect time to deploy ₹${sipAmount.toLocaleString('en-IN')} into high-growth equity SIPs.`);
    strategyStr = isHindi ? "पोर्टफोलियो डाइवर्सिफाई करें।" : (isHinglish ? "Ab sirf save nahi, diversify bhi karo and assets badhao." : "Strategic asset allocation is your next milestone. Diversify.");
  }
  else {
    actionStr = isHindi ? "बजट स्थिर है, बचत बढ़ाने की कोशिश करें।" : (isHinglish ? "Budget stable hai, bas thoda aur save kar sakte ho." : "Budget is steady. Seek opportunities to optimize further.");
    reasonStr = isHindi ? "सब कुछ ठीक है, बस निवेश में निरंतरता बनाए रखें।" : (isHinglish ? "Balance sahi hai, bas consistency chahiye wealth building ke liye." : "You have achieved balance. Now focus on increasing your savings rate.");
    healthReasonStr = isHindi ? "वित्तीय सेहत अच्छी है।" : (isHinglish ? "Financial health normal hai, bas discipline maintain karo." : "Healthy financial state.");
    projectionStr = isHindi ? `अनुमानित वार्षिक बचत ${fmt(summary.surplus * 12)} होगी।` : (isHinglish ? `Estimated yearly savings ${fmt(summary.surplus * 12)} bachegi.` : `Projected annual savings: ${fmt(summary.surplus * 12)}.`);
    growthStr = isHindi ? "SIP नियमित रखें।" : (isHinglish ? "Emergency fund full karo aur SIP continue rakho." : "Complete your 6-month buffer and maintain SIP consistency.");
    strategyStr = isHindi ? "लगातार निवेश ही भविष्य की सुरक्षा है।" : (isHinglish ? "Consistency hi success ka rasta hai, lagay raho." : "Consistency is your primary wealth multiplier. Keep going.");
  }

  const stepsStr = isHindi 
    ? `1. ₹${sipAmount.toLocaleString('en-IN')} की SIP शुरू करें\n2. इमरजेंसी फंड में ₹${emergencyMonthly.toLocaleString('en-IN')} डालें\n3. अनावश्यक UPI खर्च ट्रैक करें`
    : (isHinglish 
      ? `1. ₹${sipAmount} ki SIP start karo\n2. Emergency fund mein ₹${emergencyMonthly} dalo\n3. Chhote UPI kharche control karo`
      : `1. Start a ₹${sipAmount} SIP\n2. Buffer ₹${emergencyMonthly} for Emergency\n3. Audit all recurring UPI spends`);

  return {
    action: actionStr,
    reason: reasonStr,
    steps: stepsStr,
    insights: isHindi ? `इस महीने ${summary.transactionCount} लेन-देन हुए। मुख्य खर्च: ${summary.topCategories[0]?.category || 'N/A'}।` : (isHinglish ? `Is mahine ${summary.transactionCount} transactions kiye. Top spend: ${summary.topCategories[0]?.category || 'N/A'}.` : `Analyzed ${summary.transactionCount} transactions. Primary outflow: ${summary.topCategories[0]?.category || 'N/A'}.`),
    projection: projectionStr,
    growth: growthStr,
    healthScore: score,
    healthReason: healthReasonStr,
    confidence: confidence,
    investmentOptions: {
      sip: isHindi ? `₹${sipAmount.toLocaleString('en-IN')} की SIP आपके भविष्य को सुरक्षित करेगी।` : (isHinglish ? `Monthly ₹${sipAmount} SIP future goals ke liye must hai.` : `A monthly SIP of ₹${sipAmount} is required for wealth creation.`),
      emergency: isHindi ? `टारगेट: ₹${emergencyTarget.toLocaleString('en-IN')}। मुश्किल वक्त का साथी।` : (isHinglish ? `Target: ₹${emergencyTarget}. Bure waqt mein yehi kaam aayega.` : `Target: ₹${emergencyTarget}. Secure this as your survival safety net.`),
      fd: isHindi ? "सुरक्षित रिटर्न के लिए बैंक FD बेहतर है।" : (isHinglish ? "Safe returns ke liye Bank FD ya Liquid Funds best hain." : "Bank FDs or Liquid Funds provide capital protection.")
    },
    platforms: ["Groww", "Zerodha", "Paytm Money"],
    personalizedPlan: {
      sipAmount,
      emergencyTarget,
      savingsRate: summary.savingsRate,
      riskProfile,
      strategy: strategyStr
    }
  };
};

// Deprecated in favor of summary-based logic, kept for API compatibility
export const getRuleBasedStructuredAdvice = (transactions: Transaction[], language: string = 'en'): StructuredAIAdvice => {
  const summary = summarizeLedger(transactions);
  return getRuleBasedStructuredAdviceFromSummary(summary, language);
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
export const getRichStructuredAIAdvice = async (transactions: Transaction[], language: string = 'en'): Promise<StructuredAIAdvice> => {
  // 🛡️ [PHASE_31] LOCAL PREPROCESSING
  // Summarize first to prevent O(N) re-processing in rule engine and prompt builder
  const summary = summarizeLedger(transactions);
  const fallback = getRuleBasedStructuredAdviceFromSummary(summary, language);
  
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
    
    let requestedLangName = 'English';
    if (language === 'hi') requestedLangName = 'Hindi';
    else if (language === 'hinglish' || language.includes('in')) requestedLangName = 'Hinglish';

    // 🛡️ [FINANCIAL_HEALTH_ARCHITECT] Upgraded prompt — India-specific, hybrid rule+AI
    const savingsTarget = Math.max(0, Math.round((summary.surplus / 100) / 100) * 100);
    const mandatorySavings = Math.max(0, Math.round(((summary.incomeTotal / 100) * 0.20) / 100) * 100);
    const behaviorFlags = [
      summary.smallUpiHabitCount > 20 ? `${summary.smallUpiHabitCount} small UPI payments (chillar drain)` : null,
      summary.lateNightSpend > 0 ? `₹${(summary.lateNightSpend/100).toFixed(0)} late-night spend (10PM-4AM)` : null,
      summary.salaryExhaustionDay && summary.salaryExhaustionDay < 20 ? `80% salary exhausted by Day ${summary.salaryExhaustionDay}` : null,
      summary.weekendSpend > (summary.expenseTotal * 0.3) ? `Weekend overspend: ₹${(summary.weekendSpend/100).toFixed(0)}` : null,
    ].filter(Boolean).join('; ') || 'No critical flags';

    const prompt = `### ROLE
You are a "Financial Health Architect" for BachatKaro — an elite wealth-management advisor for Indian users. Balance strict discipline with practical Indian market realities. Be like an experienced CA mentor who knows the user personally.

### USER FINANCIAL SNAPSHOT (${summary.monthYear})
- Income: ₹${(summary.incomeTotal/100).toLocaleString('en-IN')}
- Total Expense: ₹${(summary.expenseTotal/100).toLocaleString('en-IN')}
- Surplus: ₹${(summary.surplus/100).toLocaleString('en-IN')}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%
- Top Categories: ${topCatsStr}
- Behavior Flags: ${behaviorFlags}
- ${spikesStr}
- Local Mentor Pre-Assessment: "${fallback.action}" — ${fallback.reason}

### LANGUAGE POLICY
Respond ENTIRELY in ${requestedLangName}. If Hinglish, use natural urban Indian mix (e.g., "bhai", "yaar", "dekho"). If Hindi, use pure Devanagari. If English, be sharp and professional.

### MANDATORY INSTRUCTIONS
1. REALITY CHECK: Call out the behavior flags above firmly but with empathy. Name the exact habit, name the exact amount.
2. SAVINGS TARGET: Apply 50/30/20 rule adjusted for Indian middle-class reality. Mandatory savings this month = ₹${mandatorySavings.toLocaleString('en-IN')} (20% of income). If surplus < this, explain how to bridge the gap.
3. HIDDEN INVESTMENT GEMS — always include 2-3 from this India-specific list:
   - Sovereign Gold Bonds (SGB): 2.5% extra annual interest + tax-free capital gains on maturity vs physical gold
   - NPS (National Pension System): Structured retirement + extra ₹50,000 deduction under 80CCD(1B)
   - REITs/InvITs: Real estate/infrastructure exposure from just ₹500 with quarterly dividends
   - Direct Index Funds: Avoid Regular plan commissions (saves ~1% annually = lakhs over 20 years)
4. BEHAVIORAL HACK: Give exactly ONE powerful money rule relevant to this user's specific flags (e.g., "48-Hour Rule" for purchases above ₹2000, or "10PM App Lock" for night spenders).
5. TONE: Mentor voice — firm, warm, specific. Never generic. Use real rupee amounts from the data above.

### OUTPUT FORMAT
Return ONLY valid JSON with these exact keys (no extra keys, no markdown, no preamble):
{
  "action": "2-line punchy verdict of their financial state (their score in words)",
  "reason": "Why this verdict — specific to their data, not generic",
  "steps": "Numbered action plan with Hidden Gems + Behavioral Hack (use \n for line breaks)",
  "insights": "1-line behavioral pattern insight from the flags",
  "projection": "What happens in 12 months if they follow this plan — with specific ₹ figure",
  "growth": "The Hidden Investment Gem recommendation most suited to this user",
  "healthScore": <integer 1-10>,
  "healthReason": "Why this score — tie it to their savings rate and behavior",
  "confidence": "${summary.transactionCount > 20 ? 'HIGH' : summary.transactionCount >= 5 ? 'MEDIUM' : 'LOW'}",
  "investmentOptions": {
    "sip": "Specific SIP recommendation with fund type and amount",
    "emergency": "Emergency fund target and timeline",
    "fd": "FD or liquid fund recommendation"
  },
  "platforms": ["Groww", "Zerodha", "Paytm Money"],
  "personalizedPlan": {
    "sipAmount": ${fallback.personalizedPlan?.sipAmount || 500},
    "emergencyTarget": ${fallback.personalizedPlan?.emergencyTarget || 10000},
    "savingsRate": ${summary.savingsRate.toFixed(1)},
    "riskProfile": "${fallback.personalizedPlan?.riskProfile || 'Low'}",
    "strategy": "One-line core strategy for this user"
  }
}`;

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
