// src/components/groups/TripAdvisor.tsx
// 🛡️ LOGIC LOCK: UTF-8 Emoji Support & Official Google Maps Search Links.

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Share2, MapPin, Sparkles, CheckCircle2, AlertTriangle, Map as MapIcon, Navigation, ExternalLink, Calendar, Plane, Hotel, Globe, ArrowLeft, Heart, Target, Brain } from 'lucide-react';
import { tripPlannerService } from '@/services/tripPlanner';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO, isValid } from "date-fns";

const KNOWN_PLACES = [
  'goa', 'kerala', 'jaipur', 'ayodhya', 'manali', 'shimla', 'mumbai', 'delhi', 'bangalore', 'pune',
  'chennai', 'kolkata', 'hyderabad', 'agra', 'rishikesh', 'haridwar', 'varanasi', 'kasol', 'udaipur',
  'jodhpur', 'jaisalmer', 'ladakh', 'leh', 'srinagar', 'kashmir', 'ooty', 'munnar', 'wayanad', 'coorg',
  'andaman', 'darjeeling', 'gangtok', 'sikkim', 'meghalaya', 'shillong', 'tawang', 'hampi', 'gokarna',
  'pondicherry', 'puducherry', 'mahabaleshwar', 'lonavala', 'khandala', 'alibaug', 'nainital', 'mussoorie',
  'auli', 'spiti', 'dharamshala', 'dalhousie', 'mcleodganj', 'amritsar', 'chandigarh', 'mathura', 'vrindavan',
  'pushkar', 'mount abu', 'ranthambore', 'bandhavgarh', 'kanha', 'jim corbett', 'kaziranga', 'lakshadweep',
  'maldives', 'bali', 'dubai', 'singapore', 'thailand', 'bangkok', 'phuket', 'pattaya', 'malaysia', 'vietnam',
  'europe', 'paris', 'london', 'new york', 'nepal', 'bhutan', 'sri lanka', 'kedarnath', 'badrinath', 'ujjain',
  'puri', 'rameshwaram', 'tirupati', 'somnath', 'dwarka', 'shirdi', 'vaishno devi', 'amarnath', 'kanyakumari',
  'mahabalipuram', 'kochi', 'trivandrum', 'alleppey', 'sultanpur', 'lucknow', 'kanpur', 'prayagraj', 'patna',
  'गोवा', 'केरल', 'जयपुर', 'अयोध्या', 'मनाली', 'शिमला', 'मुंबई', 'दिल्ली', 'बेंगलुरु', 'पुणे',
  'चेन्नई', 'कोलकाता', 'हैदराबाद', 'आगरा', 'ऋषिकेश', 'हरिद्वार', 'वाराणसी', 'उदयपुर', 'जोधपुर', 'जैसलमेर',
  'लद्दाख', 'लेह', 'श्रीनगर', 'कश्मीर', 'ऊटी', 'मुन्नार', 'वायनाड', 'कूर्ग', 'अंडमान', 'दार्जिलिंग',
  'गंगटोक', 'सिक्किम', 'मेघालय', 'शिलांग', 'तवांग', 'हम्पी', 'गोकर्ण', 'पांडिचेरी', 'नैनीताल', 'मसूरी',
  'औली', 'अमृतसर', 'चंडीगढ़', 'मथुरा', 'वृंदावन', 'पुष्कर', 'माउंट आबू', 'मालदीव', 'बाली', 'दुबई',
  'सिंगापुर', 'थाईलैंड', 'बैंकॉक', 'फुकेत', 'मलेशिया', 'वियतनाम', 'यूरोप', 'पेरिस', 'लंदन', 'नेपाल',
  'भूटान', 'श्रीलंका', 'केदारनाथ', 'बद्रीनाथ', 'उज्जैन', 'पुरी', 'रामेश्वरम', 'तिरुपति', 'सोमनाथ',
  'द्वारका', 'शिर्डी', 'वैष्णो देवी', 'अमरनाथ', 'कन्याकुमारी', 'कोच्चि', 'तिरुवनंतपुरम', 'प्रयागराज', 'पटना'
];

const BLACKLIST = ['rent', 'bill', 'purchase', 'emi', 'salary', 'grocery', 'paid', 'due', 'expense', 'split', 'settle', 'loan', 'fee', 'hisaab', 'kharcha', 'udhaar', 'maid', 'cook', 'petrol', 'amazon', 'flipkart', 'किराया', 'राशन', 'ईएमआई', 'वेतन', 'मासिक खर्च', 'बिल', 'खर्च', 'उधार', 'लोन', 'फीस', 'सैलरी'];
const GENERIC_TERMS = ['friends', 'trip', 'tour', 'vacation', 'holiday', 'weekend', 'party', 'family'];
const VALID_TRAVEL_INTENTS = ['honeymoon', 'yatra', 'pilgrimage', 'office trip', 'bike ride', 'group travel', 'family trip', 'vacation', 'holiday', 'tour', 'यात्रा', 'हनीमून', 'धार्मिक यात्रा', 'पारिवारिक टूर', 'ghumne', 'safar', 'darshan', 'ghoomne', 'घूमने', 'सफर', 'दर्शन', 'टूर', 'ट्रिप', 'परिवार यात्रा'];
const BUDGET_SPLIT = { hotel: 0.34, travel: 0.2, food: 0.16, localTransport: 0.08, shopping: 0.08, emergency: 0.07, hiddenCosts: 0.07 };
const HIDDEN_COST_RANGE = { min: 0.08, max: 0.14 };

// 🌟 PHASE 5: PERSONALIZATION CONSTANTS
const TRAVEL_PERSONALITIES = {
  LUXURY: { label: 'Luxury Traveler', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  BUDGET: { label: 'Budget Explorer', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  FAMILY: { label: 'Family Planner', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  SPIRITUAL: { label: 'Soul Seeker', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  ROMANTIC: { label: 'Romantic Nomad', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  ADVENTURE: { label: 'Thrill Seeker', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
};

const JOURNEY_STAGES = [
  { id: 'dreaming', label: 'Dreaming', minScore: 0 },
  { id: 'planning', label: 'Planning', minScore: 30 },
  { id: 'saving', label: 'Saving', minScore: 50 },
  { id: 'preparing', label: 'Preparing', minScore: 75 },
  { id: 'ready', label: 'Ready', minScore: 90 }
];

// 🌟 PHASE 2: STATIC SEASONAL DATA
const DESTINATION_SEASONS: Record<string, { peak: number[], budget: number[] }> = {
  'goa': { peak: [11, 12, 1], budget: [5, 6, 7, 8] },
  'kerala': { peak: [9, 10, 11, 12, 1, 2, 3], budget: [5, 6, 7, 8] },
  'manali': { peak: [5, 6, 12, 1], budget: [9, 10, 11] },
  'ladakh': { peak: [6, 7, 8], budget: [4, 5, 9] },
  'jaipur': { peak: [10, 11, 12, 1, 2], budget: [4, 5, 6, 7, 8] },
};

// 🌟 PHASE 2: AFFILIATE PARTNERS
const AFFILIATE_LINKS = [
  { id: 'hotels', name: 'Premium Stays', icon: Hotel, url: null, desc: 'Curated premium stays launching soon ✨' },
  { id: 'activities', name: 'Experiences', icon: Globe, url: null, desc: 'Local experiences & adventures coming soon ✨' },
  { id: 'travel', name: 'Fast Travel', icon: Plane, url: null, desc: 'Smart travel deals arriving soon ✨' }
];

const TripAdvisor = ({ open, onOpenChange, groupId, group: propGroup }: any) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState('5');
  const [totalBudget, setTotalBudget] = useState('25000'); 
  const [targetDestination, setTargetDestination] = useState('');
  const [tripDate, setTripDate] = useState(''); // 🌟 PHASE 2: TRIP DATE
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [manualOverride, setManualOverride] = useState(false);

  // 🌟 PHASE 2: WEBVIEW STATE
  const [webViewOpen, setWebViewOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState('');

  const { data: fetchedGroup } = useQuery({ 
    queryKey: ['group', groupId], 
    queryFn: async () => { 
      const { data } = await supabase.from('groups').select('*').eq('id', groupId).single(); 
      return data; 
    }, 
    enabled: !!groupId && open 
  });
  
  const group = propGroup || fetchedGroup;
  const groupName = group?.name || group?.destination || "YOUR TRIP";

  useEffect(() => {
    if (open) {
      setTargetDestination(groupName);
      setTripPlan(null);
      setManualOverride(false); 
    }
  }, [open, groupName]);

  const isTravelGroup = useMemo(() => {
    if (manualOverride) return true; 
    const lowerName = groupName.toLowerCase();
    if (!lowerName.trim() || lowerName === 'your trip') return false;
    if (BLACKLIST.some(k => lowerName.includes(k))) return false;
    const hasPlace = KNOWN_PLACES.some(place => lowerName.includes(place));
    const hasValidTravelIntent = VALID_TRAVEL_INTENTS.some(term => lowerName.includes(term));
    const hasGenericTerm = GENERIC_TERMS.some(term => lowerName.includes(term));
    if (hasPlace || hasValidTravelIntent) return true;
    if (hasGenericTerm && !hasPlace && !hasValidTravelIntent) return false;
    return false; 
  }, [groupName, manualOverride]);

  const perPersonCost = useMemo(() => {
    const mems = parseInt(members) || 1;
    const total = parseInt(totalBudget) || 0;
    return Math.round(total / mems);
  }, [members, totalBudget]);

  // 🌟 PHASE 2: TRIP COUNTDOWN
  const countdownDays = useMemo(() => {
    if (!tripDate) return null;
    const date = parseISO(tripDate);
    if (!isValid(date)) return null;
    const diff = differenceInDays(date, new Date());
    return diff;
  }, [tripDate]);

  // 🌟 PHASE 2: SEASONAL INSIGHTS
  const seasonalInsight = useMemo(() => {
    if (!targetDestination || !tripDate) return null;
    const lowerDest = targetDestination.toLowerCase();
    const seasonData = DESTINATION_SEASONS[Object.keys(DESTINATION_SEASONS).find(k => lowerDest.includes(k)) || ''];
    if (!seasonData) return null;
    
    const month = parseISO(tripDate).getMonth() + 1;
    if (seasonData.peak.includes(month)) return { type: 'PEAK', text: 'Peak season! Book hotels immediately to avoid 2x prices.' };
    if (seasonData.budget.includes(month)) return { type: 'BUDGET', text: 'Great timing! Off-season deals may reduce costs by 30%.' };
    return null;
  }, [targetDestination, tripDate]);

  // 🌟 PHASE 2: SMART SAVINGS TIPS
  const savingsTips = useMemo(() => {
    const tips: string[] = [];
    if (perPersonCost < 3000) tips.push("Group hostels or Dharamshalas will save ~₹500/night.");
    if (perPersonCost > 15000) tips.push("Early bird premium bookings can save ₹2,000+ on flights.");
    if (parseInt(members) >= 5) tips.push("Negotiate group rates for local transport; standard rates don't apply.");
    return tips;
  }, [perPersonCost, members]);

  const isLowBudget = perPersonCost < 2500;
  const p = useMemo(() => tripPlan?.plan_data, [tripPlan]);
  const memberCount = useMemo(() => Math.max(1, parseInt(members) || 1), [members]);

  const affordability = useMemo(() => {
    const bounded = Math.max(1500, Math.min(14000, perPersonCost || 0));
    const score = Math.max(5, Math.min(99, Math.round((bounded / 14000) * 100)));
    const level = score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
    return { score, level };
  }, [perPersonCost]);

  const hiddenCostEstimate = useMemo(() => {
    const total = Math.max(0, parseInt(totalBudget) || 0);
    const min = Math.round(total * HIDDEN_COST_RANGE.min);
    const max = Math.round(total * HIDDEN_COST_RANGE.max);
    const localTransport = Math.round(total * BUDGET_SPLIT.localTransport);
    const shopping = Math.round(total * BUDGET_SPLIT.shopping);
    const emergency = Math.round(total * BUDGET_SPLIT.emergency);
    const hiddenCharges = Math.round(total * BUDGET_SPLIT.hiddenCosts);
    return { min, max, localTransport, shopping, emergency, hiddenCharges };
  }, [totalBudget]);

  const smartBudget = useMemo(() => {
    const total = Math.max(0, parseInt(totalBudget) || 0);
    return {
      hotel: Math.round(total * BUDGET_SPLIT.hotel),
      travel: Math.round(total * BUDGET_SPLIT.travel),
      food: Math.round(total * BUDGET_SPLIT.food),
      localTransport: Math.round(total * BUDGET_SPLIT.localTransport),
      shopping: Math.round(total * BUDGET_SPLIT.shopping),
      emergency: Math.round(total * BUDGET_SPLIT.emergency),
      hiddenCosts: Math.round(total * BUDGET_SPLIT.hiddenCosts),
    };
  }, [totalBudget]);

  const destinationEvidence = useMemo(() => {
    const lowerDestination = (targetDestination || '').toLowerCase();
    const hasPlace = KNOWN_PLACES.some(place => lowerDestination.includes(place));
    const hasIntent = VALID_TRAVEL_INTENTS.some(term => lowerDestination.includes(term));
    return { hasPlace, hasIntent };
  }, [targetDestination]);

  // 🌟 PHASE 3: EMOTIONAL INTELLIGENCE
  const emotionalIntelligence = useMemo(() => {
    const lowerDest = (targetDestination || '').toLowerCase();
    const isRomantic = ['honeymoon', 'maldives', 'bali', 'paris', 'kashmir', 'munnar', 'ooty', 'हनीमून'].some(t => lowerDest.includes(t)) || (memberCount === 2 && perPersonCost > 10000);
    const isFamily = ['family', 'परिवार'].some(t => lowerDest.includes(t)) || memberCount > 4;
    const isSpiritual = ['pilgrimage', 'yatra', 'kedarnath', 'badrinath', 'ayodhya', 'varanasi', 'darshan', 'तीर्थ', 'दर्शन', 'मंदिर'].some(t => lowerDest.includes(t));
    const isBudgetStruggle = affordability.level === 'LOW' || perPersonCost < 2000;

    let sentiment = '';
    if (isRomantic) sentiment = "This looks like a special romantic getaway. Prioritize comfort.";
    else if (isFamily) sentiment = "Family trips build core memories. Plan activities for all ages.";
    else if (isSpiritual) sentiment = "A spiritual journey ahead. Focus on peace and early bookings.";
    else if (isBudgetStruggle) sentiment = "Budget is tight, but smart planning makes this adventure possible.";
    else sentiment = "An exciting journey awaits! Proper planning reduces travel stress.";

    return { sentiment, isRomantic, isFamily, isSpiritual, isBudgetStruggle };
  }, [targetDestination, memberCount, perPersonCost, affordability.level]);

  // 🌟 PHASE 3: AI SAVINGS GOAL ENGINE
  const savingsGoal = useMemo(() => {
    if (!tripDate || !totalBudget || parseInt(totalBudget) === 0) return null;
    
    const total = parseInt(totalBudget);
    const monthsAway = Math.max(1, Math.ceil((countdownDays || 0) / 30));
    const monthlyTarget = Math.round(total / monthsAway);
    
    // 🌟 PHASE 5: READINESS PERCENTAGE
    const readinessScore = Math.max(5, Math.min(100, Math.round((monthsAway / 12) * 100)));
    const readiness = readinessScore > 75 ? 'HIGH' : readinessScore > 40 ? 'MEDIUM' : 'LOW';
    
    return { monthlyTarget, monthsAway, readiness, readinessScore };
  }, [tripDate, totalBudget, countdownDays]);

  // 🌟 PHASE 5: AI TRAVEL PERSONALITY ENGINE
  const travelPersonality = useMemo(() => {
    if (emotionalIntelligence.isRomantic) return TRAVEL_PERSONALITIES.ROMANTIC;
    if (emotionalIntelligence.isSpiritual) return TRAVEL_PERSONALITIES.SPIRITUAL;
    if (memberCount >= 5) return TRAVEL_PERSONALITIES.FAMILY;
    if (perPersonCost > 12000) return TRAVEL_PERSONALITIES.LUXURY;
    if (isLowBudget) return TRAVEL_PERSONALITIES.BUDGET;
    const lowerDest = (targetDestination || '').toLowerCase();
    if (['trek', 'bike', 'hike', 'climb', 'ladakh', 'spiti'].some(t => lowerDest.includes(t))) return TRAVEL_PERSONALITIES.ADVENTURE;
    return TRAVEL_PERSONALITIES.BUDGET; // Default
  }, [emotionalIntelligence, memberCount, perPersonCost, isLowBudget, targetDestination]);

  // 🌟 PHASE 5: AI JOURNEY PROGRESSION SYSTEM
  const journeyStage = useMemo(() => {
    let score = 0;
    if (targetDestination) score += 20;
    if (parseInt(totalBudget) > 0) score += 20;
    if (tripDate) score += 20;
    if (p) score += 20;
    if (memberCount >= 2) score += 10;
    if (savingsGoal?.readinessScore && savingsGoal.readinessScore > 50) score += 10;
    
    const stage = [...JOURNEY_STAGES].reverse().find(s => score >= s.minScore) || JOURNEY_STAGES[0];
    return { ...stage, score };
  }, [targetDestination, totalBudget, tripDate, p, memberCount, savingsGoal]);

  // 🌟 PHASE 4: AI LIFESTYLE RECOMMENDATION ENGINE
  const lifestyleRecommendation = useMemo(() => {
    const total = parseInt(totalBudget) || 0;
    if (total === 0 || !targetDestination) return null;

    if (affordability.level === 'LOW') {
      return { type: 'ALTERNATIVE', text: `Consider cheaper alternatives nearby to save ~30%.` };
    }
    
    if (savingsGoal?.readiness === 'LOW' && countdownDays && countdownDays > 0) {
      return { type: 'TIMING', text: `Delaying this trip by 2 months could make it 50% more affordable.` };
    }

    if (emotionalIntelligence.isRomantic && perPersonCost < 5000) {
        return { type: 'BUDGET', text: `For romantic trips, allocating 10% more to stays enhances the experience.` };
    }

    if (memberCount >= 4) {
       return { type: 'GROUP', text: `Group sizes of ${memberCount} often unlock private villa deals over standard hotels.` };
    }

    return null;
  }, [totalBudget, targetDestination, affordability.level, savingsGoal, countdownDays, emotionalIntelligence, perPersonCost, memberCount]);

  // 🌟 PHASE 5: SMART AI NUDGES
  const aiNudges = useMemo(() => {
    const nudges: string[] = [];
    if (journeyStage.id === 'planning' && !tripDate) nudges.push("Setting a trip date helps us calculate your monthly savings goal.");
    if (perPersonCost < 2000) nudges.push("₹1,000 more per head could upgrade your stay to a boutique hostel.");
    if (memberCount >= 4 && !lifestyleRecommendation?.type) nudges.push("Large groups often save 20% by booking whole apartments instead of hotel rooms.");
    if (savingsGoal?.readiness === 'LOW') nudges.push("Delayed planning detected. Consider early-bird bookings to keep costs within ₹" + totalBudget + ".");
    return nudges;
  }, [journeyStage, tripDate, perPersonCost, memberCount, lifestyleRecommendation, savingsGoal, totalBudget]);

  // 🌟 PHASE 4: SMART TRAVEL MEMORY SYSTEM (Simulated based on local state)
  const memoryEngine = useMemo(() => {
    // In a real system, this would query a historical trips table.
    // Here we use deterministic local heuristics to simulate memory.
    const isReturningDest = ['goa', 'manali'].some(d => (targetDestination || '').toLowerCase().includes(d));
    if (isReturningDest) return { type: 'REVISIT', text: `You've checked ${targetDestination} before. Let's make this trip better.` };
    return { type: 'NEW', text: `A new journey to ${targetDestination || 'an exciting place'}. Building your travel timeline.` };
  }, [targetDestination]);

  const travelConfidence = useMemo(() => {
    let score = 0;
    if (isTravelGroup) score += 35;
    if (destinationEvidence.hasPlace || destinationEvidence.hasIntent) score += 25;
    if (memberCount >= 2) score += 10;
    if ((parseInt(totalBudget) || 0) > 0 && perPersonCost > 0) score += 15;
    if (p) score += 15;
    const level = score >= 75 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
    return { score, level };
  }, [isTravelGroup, destinationEvidence, memberCount, totalBudget, perPersonCost, p]);

  const insightCards = useMemo(() => {
    const cards: string[] = [];
    if (affordability.level === 'HIGH') cards.push('This trip appears budget friendly for the current group size.');
    if (affordability.level === 'MEDIUM') cards.push('Budget looks manageable with planned spending controls.');
    if (affordability.level === 'LOW') cards.push('Current budget may feel tight for this destination.');
    if (memberCount >= 3) cards.push('Group travel reduces per-person cost pressure.');
    
    // 🌟 PHASE 2: INJECT SMART TIPS
    savingsTips.forEach(tip => cards.push(tip));

    // 🌟 PHASE 4: INJECT LIFESTYLE TIPS
    if (lifestyleRecommendation) cards.push(lifestyleRecommendation.text);

    // 🌟 PHASE 5: INJECT AI NUDGES
    aiNudges.forEach(nudge => cards.push(nudge));
    
    if (hiddenCostEstimate.emergency > 0) cards.push('Emergency reserve is recommended before final confirmation.');
    if (travelConfidence.level === 'LOW') cards.push('Travel confidence is low until destination and budget details stabilize.');
    if (cards.length === 0) cards.push('Add destination and budget details for sharper insights.');
    return Array.from(new Set(cards)).slice(0, 5); // Unique and max 5
  }, [affordability, memberCount, hiddenCostEstimate.emergency, travelConfidence.level, savingsTips, lifestyleRecommendation, aiNudges]);

  const handleGenerate = async () => {
    if (!targetDestination.trim()) {
      toast({ title: "Valid Destination Required", description: "Please enter a place name.", variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const plan = await tripPlannerService.generatePlan({ 
        origin: 'Lucknow', 
        destination: targetDestination, 
        members: parseInt(members), 
        budgetPerPerson: perPersonCost, 
        groupId, 
        userId: user?.id 
      });
      setTripPlan(plan);
      toast({ title: "Blueprint Ready!", className: "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" });
    } catch (error: any) { 
      toast({ title: "Error", description: error.message, variant: 'destructive' }); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleManualOverride = () => {
    setManualOverride(true);
    setTargetDestination(''); 
  };

  const handleWhatsAppShare = () => {
    if (!p) return;
    const getMapLink = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + ' ' + targetDestination)}`;
    
    const msg = `✈️ *TRIP PLAN: ${targetDestination.toUpperCase()} TRIP* 🌴

1️⃣ *EXECUTIVE OVERVIEW*
• Duration: ${p.overview?.duration}
• Best Fit: ${p.overview?.bestFit}

2️⃣ *ASSUMPTIONS*
• Budget: ${p.assumptions?.budgetTarget}
• Members: ${members}

3️⃣ *STAY STRATEGY*
${p.stayStrategy?.hotels?.map((h: any) => `• ${h.name} (${h.budget})\n  📍 Map: ${getMapLink(h.mapQuery || h.name)}`).join('\n')}

4️⃣ *COST BREAKDOWN*
• Total: ${p.costBreakdown?.total}

🔗 Generated via BachatKaro App`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 🌟 PHASE 2: WEBVIEW HANDLER
  const openAffiliateLink = (url: string | null) => {
    if (!url) {
      toast({ title: "Coming Soon", description: "This ecosystem feature is being prepared for your destination ✨" });
      return;
    }
    setActiveUrl(url);
    setWebViewOpen(true);
  };

  const zenBgStyle = {
    background: `linear-gradient(to bottom, rgba(10, 0, 20, 0.85), rgba(10, 0, 20, 0.6)), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-[#0a0014] rounded-[2.5rem] border border-[#ff0f7b]/30 shadow-2xl z-50 max-h-[92vh] flex flex-col outline-none transform-gpu">
        
        <DialogTitle className="sr-only">Executive Blueprint Planner</DialogTitle>
        <DialogDescription className="sr-only">Plan your trip based on an exact budget calculation.</DialogDescription>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-20 md:hidden" />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 md:pb-12">
          
          <div className="relative pt-12 pb-6 md:pt-16 md:pb-8 bg-gradient-to-b from-purple-900/20 to-transparent">
             <div className="text-center mb-6 md:mb-8 px-4">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#b3b3b3] mb-1 md:mb-2">EXECUTIVE BLUEPRINT</h3>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-white truncate drop-shadow-[0_0_15px_rgba(255,15,123,0.6)]">
                  {targetDestination || groupName}
                </h2>

                {/* 🌟 PHASE 5: PERSONALITY & JOURNEY HEADER */}
                <div className="mt-4 flex flex-col items-center gap-3">
                   <div className={cn(
                     "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2",
                     travelPersonality.bg, travelPersonality.border, travelPersonality.color
                   )}>
                     {travelPersonality.label}
                   </div>
                   
                   <div className="w-full max-w-[200px] space-y-1.5">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-white/40 px-1">
                        <span>{journeyStage.label}</span>
                        <span>{journeyStage.score}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#ff0f7b] transition-all duration-1000 ease-out"
                          style={{ width: `${journeyStage.score}%` }}
                        />
                      </div>
                   </div>
                </div>
                
                {/* 🌟 PHASE 2: COUNTDOWN BANNER */}
                {countdownDays !== null && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-[#ff0f7b]/20 border border-[#ff0f7b]/40 rounded-full animate-pulse">
                    <Calendar className="h-3 w-3 text-[#ff0f7b]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {countdownDays === 0 ? "Traveling Today! 🚀" : countdownDays < 0 ? "Trip Completed ✅" : `${countdownDays} Days Remaining`}
                    </span>
                  </div>
                )}
             </div>

             {!isTravelGroup ? (
               <div className="px-6 md:px-12 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-[#ff0f7b]/10 border border-[#ff0f7b]/20 rounded-[32px] p-6 md:p-8 backdrop-blur-xl">
                    <p className="text-[#ff0f7b] font-black text-lg md:text-2xl italic mb-2 tracking-tighter uppercase">No trip plan for this. Enjoy! 🚀</p>
                    <p className="text-[#b3b3b3] text-[10px] md:text-xs uppercase font-bold mt-2 tracking-widest">Manage your group expenses wisely.</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 max-w-sm mx-auto">
                     <Button onClick={handleManualOverride} variant="outline" className="w-full bg-white/5 border-white/10 text-white rounded-2xl h-14 hover:bg-white/10 active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest">
                       <MapIcon className="w-4 h-4 mr-2 text-[#ff0f7b]" /> Yes, This is a trip
                     </Button>
                  </div>
               </div>
             ) : (
               <div className="px-6 md:px-12 lg:px-20 space-y-4 md:space-y-6">
                 {/* 🌟 PHASE 2: INPUT GRID UPDATED */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#b3b3b3] text-[9px] font-black uppercase ml-1 tracking-widest">📍 Destination</Label>
                      <Input value={targetDestination} onChange={(e) => setTargetDestination(e.target.value)} placeholder="e.g. Goa" className="bg-white/5 border-white/10 text-white h-14 rounded-2xl font-black text-sm px-5" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#b3b3b3] text-[9px] font-black uppercase ml-1 tracking-widest">📅 Trip Date</Label>
                      <Input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="bg-white/5 border-white/10 text-white h-14 rounded-2xl font-black text-sm px-5 appearance-none" style={{ colorScheme: 'dark' }} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#b3b3b3] text-[9px] font-black uppercase ml-1 tracking-widest">👥 Members</Label>
                      <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-white/5 border-white/10 text-white h-14 rounded-2xl font-black text-sm px-5" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#b3b3b3] text-[9px] font-black uppercase ml-1 tracking-widest">💰 Total Budget (₹)</Label>
                      <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-white/5 border-white/10 text-white h-14 rounded-2xl font-black text-sm px-5" />
                    </div>
                 </div>

                 {/* 🌟 PHASE 2: SEASONAL ALERT */}
                 {seasonalInsight && (
                   <div className={cn(
                     "px-4 py-3 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300",
                     seasonalInsight.type === 'PEAK' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                   )}>
                     {seasonalInsight.type === 'PEAK' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Sparkles className="h-4 w-4 shrink-0" />}
                     <p className="text-[10px] font-bold leading-tight tracking-wide">{seasonalInsight.text}</p>
                   </div>
                 )}

                 <div className={cn(
                   "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border transition-all",
                   isLowBudget ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                 )}>
                   {isLowBudget ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                   {isLowBudget 
                     ? `Low Budget: ₹${perPersonCost}/head. Suggestions will be backpacker-grade.` 
                     : `Budget Stable: ₹${perPersonCost} per person share.`}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className="p-4 bg-white/5 border border-cyan-400/20 rounded-2xl space-y-1">
                     <p className="text-[9px] font-black text-cyan-300 uppercase tracking-widest">Affordability Score</p>
                     <p className="text-2xl font-black text-white">{affordability.score}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">{affordability.level}</p>
                   </div>
                   <div className="p-4 bg-white/5 border border-indigo-400/20 rounded-2xl space-y-1">
                     <div className="flex justify-between items-start">
                       <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Travel Confidence</p>
                       <Brain className="h-4 w-4 text-indigo-400/50" />
                     </div>
                     <p className="text-2xl font-black text-white">{travelConfidence.score}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{travelConfidence.level}</p>
                   </div>
                 </div>

                 {/* 🌟 PHASE 4: SMART TRAVEL MEMORY */}
                 {targetDestination && (
                   <div className="px-4 py-2.5 rounded-xl border bg-white/5 border-white/10 flex items-center gap-3">
                     <div className="h-6 w-6 rounded-full bg-[#ff0f7b]/20 flex items-center justify-center shrink-0">
                       <MapPin className="h-3 w-3 text-[#ff0f7b]" />
                     </div>
                     <p className="text-[10px] font-bold text-white/80">{memoryEngine.text}</p>
                   </div>
                 )}

                 {/* 🌟 PHASE 3: EMOTIONAL INTELLIGENCE & SAVINGS GOAL PANELS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className={cn(
                     "p-4 border rounded-2xl space-y-2 flex flex-col justify-center transition-all",
                     emotionalIntelligence.isRomantic ? "bg-pink-500/10 border-pink-500/20" :
                     emotionalIntelligence.isSpiritual ? "bg-orange-500/10 border-orange-500/20" :
                     "bg-purple-500/10 border-purple-500/20"
                   )}>
                     <div className="flex items-center gap-2 mb-1">
                        <Heart className={cn(
                          "h-4 w-4",
                          emotionalIntelligence.isRomantic ? "text-pink-400" :
                          emotionalIntelligence.isSpiritual ? "text-orange-400" : "text-purple-400"
                        )} />
                        <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Vibe Check</p>
                     </div>
                     <p className="text-[11px] font-bold text-white leading-tight">{emotionalIntelligence.sentiment}</p>
                   </div>
                   
                   {savingsGoal ? (
                     <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-1">
                         <Target className="h-4 w-4 text-emerald-400" />
                         <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Savings Goal</p>
                       </div>
                       <p className="text-xl font-black text-white">₹{savingsGoal.monthlyTarget}<span className="text-[10px] text-emerald-400/60 font-bold ml-1">/mo</span></p>
                       <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-emerald-400/60 mt-1 mb-0.5">
                         <span>Ready</span>
                         <span>{savingsGoal.readinessScore}%</span>
                       </div>
                       <div className="h-0.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${savingsGoal.readinessScore}%` }} />
                       </div>
                     </div>
                   ) : (
                     <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center items-center text-center opacity-50">
                       <Calendar className="h-5 w-5 text-white/40 mb-2" />
                       <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Set Trip Date<br/>for Savings Goal</p>
                     </div>
                   )}
                 </div>

                 <div className="p-4 bg-white/5 border border-amber-400/20 rounded-2xl space-y-2">
                   <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest">AI Insights</p>
                   <div className="space-y-1.5">
                     {insightCards.map((insight, idx) => (
                       <p key={idx} className="text-[11px] font-bold text-white/90">• {insight}</p>
                     ))}
                   </div>
                 </div>

                 <Button 
                   onClick={handleGenerate} 
                   disabled={isGenerating} 
                   className="w-full h-16 bg-gradient-to-r from-[#7C3AED] to-[#ff0f7b] text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.965] text-sm uppercase tracking-widest mt-2"
                 >
                   {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Sparkles className="h-5 w-5 mr-3" />}
                   {isGenerating ? "Compiling Blueprint..." : "Create Blueprint 🚀"}
                 </Button>

                 {/* 🌟 PHASE 2: AFFILIATE CARDS (PRE-GENERATION) */}
                 {!p && (
                   <div className="pt-6 space-y-4">
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] text-center">Evolving Ecosystem</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       {AFFILIATE_LINKS.map((link) => (
                         <button 
                           key={link.id}
                           onClick={() => openAffiliateLink(link.url)}
                           className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left transition-all hover:bg-white/10 active:scale-95 group"
                         >
                           <div className="flex justify-between items-center mb-3">
                             <link.icon className="h-5 w-5 text-white/20 group-hover:text-[#ff0f7b] transition-colors" />
                             {!link.url && <div className="px-1.5 py-0.5 rounded-md bg-[#ff0f7b]/10 text-[#ff0f7b] text-[7px] font-black uppercase tracking-tighter">SOON</div>}
                           </div>
                           <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{link.name}</p>
                           <p className="text-[9px] text-white/30 font-bold leading-tight">{link.desc}</p>
                         </button>
                       ))}
                     </div>

                     {/* 🌟 PHASE 5: LIFESTYLE DISCOVERY */}
                     <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-[32px] space-y-4">
                        <div className="flex justify-between items-center px-1">
                           <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Lifestyle Discovery</h4>
                           <Sparkles className="h-3.5 w-3.5 text-[#ff0f7b]" />
                        </div>
                        <div className="space-y-2.5">
                           <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
                              <div className="h-8 w-8 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center shrink-0">
                                <MapIcon className="h-4 w-4 text-[#7C3AED]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Style Alternative</p>
                                <p className="text-[9px] text-white/50 font-bold leading-tight">
                                  {travelPersonality.label === 'Luxury Traveler' 
                                    ? "Consider private estate stays for absolute seclusion." 
                                    : "Boutique hostels often offer better social vibes for this style."}
                                </p>
                              </div>
                           </div>
                           <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5 text-left w-full cursor-pointer hover:bg-white/10 transition-colors" onClick={() => toast({ title: "Opening Discover", description: "Finding hidden gems for your profile..." })}>
                              <div className="h-8 w-8 rounded-xl bg-[#ff0f7b]/20 flex items-center justify-center shrink-0">
                                <Globe className="h-4 w-4 text-[#ff0f7b]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Hidden Gem Discovery</p>
                                <p className="text-[9px] text-white/50 font-bold leading-tight">Explore off-beat locations matching your {travelPersonality.label} profile.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

          {p && (
            <div 
              style={zenBgStyle}
              className="mt-8 mx-4 sm:mx-8 rounded-[40px] overflow-hidden border border-white/10 shadow-3xl animate-in fade-in zoom-in-95 duration-1000 transform-gpu"
            >
              <div className="p-6 md:p-12 lg:p-16 space-y-10 backdrop-blur-[32px] bg-[#0a0014]/60">
                 
                 {/* 🌟 PHASE 2: PREMIUM AFFILIATE OVERLAY (POST-GENERATION) */}
                 <section className="space-y-4">
                   <h4 className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-[0.3em]">ECOSYSTEM EXPERIENCES</h4>
                   <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                     {AFFILIATE_LINKS.map((link) => (
                       <div 
                         key={link.id} 
                         onClick={() => openAffiliateLink(link.url)}
                         className="flex-shrink-0 w-64 p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl cursor-pointer hover:border-[#ff0f7b]/30 transition-all group"
                       >
                         <div className="flex items-center justify-between mb-4">
                           <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-[#ff0f7b]/10 transition-colors">
                             <link.icon className="h-5 w-5 text-white/40 group-hover:text-[#ff0f7b] transition-colors" />
                           </div>
                           {!link.url && <Sparkles className="h-3 w-3 text-[#ff0f7b] animate-pulse" />}
                           {link.url && <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white transition-all" />}
                         </div>
                         <p className="text-sm font-black text-white uppercase tracking-tighter mb-1">{link.name}</p>
                         <p className="text-[9px] text-white/30 font-bold mb-4 leading-tight">{link.desc}</p>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className={cn("h-full transition-all duration-1000", link.url ? "bg-[#ff0f7b] w-1/3 group-hover:w-full" : "bg-[#ff0f7b]/20 w-0 group-hover:w-1/4")} 
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </section>

                 <section className="space-y-5">
                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Navigation className="h-4 w-4" /> Live Map Preview
                    </h4>
                    <div className="w-full h-64 md:h-96 rounded-[32px] overflow-hidden border border-white/10 shadow-inner">
                      <iframe 
                        width="100%" height="100%" 
                        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(1.2)' }} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(targetDestination)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                 </section>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                     <h4 className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest">01. EXECUTIVE OVERVIEW</h4>
                     <div className="space-y-3">
                       <p className="text-sm font-bold text-white tracking-tight">Duration: <span className="text-[#b3b3b3]">{p.overview?.duration}</span></p>
                       <p className="text-sm font-bold text-white tracking-tight">Best Fit: <span className="text-[#b3b3b3]">{p.overview?.bestFit}</span></p>
                     </div>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                     <h4 className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest">02. CORE ASSUMPTIONS</h4>
                     <div className="space-y-3 font-mono">
                       <p className="text-sm font-black text-white uppercase tracking-tighter">PER HEAD: ₹{perPersonCost}</p>
                       <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter italic">TOTAL CAP: ₹{totalBudget}</p>
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="p-6 bg-white/5 rounded-3xl border border-cyan-400/20">
                     <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest mb-3">03. AFFORDABILITY</h4>
                     <p className="text-3xl font-black text-white">{affordability.score}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200 mt-2">Risk Level: {affordability.level}</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-amber-400/20">
                     <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-3">04. HIDDEN COST WINDOW</h4>
                     <p className="text-sm font-black text-white">₹{hiddenCostEstimate.min} - ₹{hiddenCostEstimate.max}</p>
                     <p className="text-[10px] text-amber-200/90 font-bold mt-2">Includes transport, shopping, emergency and hidden charges.</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-indigo-400/20">
                     <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">05. TRAVEL CONFIDENCE</h4>
                     <p className="text-3xl font-black text-white">{travelConfidence.score}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">{travelConfidence.level}</p>
                   </div>
                 </div>

                 <div className="p-6 bg-white/5 rounded-3xl border border-emerald-500/20 space-y-4">
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">06. SMART BUDGET MODEL</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Hotel</p><p className="text-sm font-black text-white">₹{smartBudget.hotel}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Travel</p><p className="text-sm font-black text-white">₹{smartBudget.travel}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Food</p><p className="text-sm font-black text-white">₹{smartBudget.food}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Local Transport</p><p className="text-sm font-black text-white">₹{smartBudget.localTransport}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Shopping</p><p className="text-sm font-black text-white">₹{smartBudget.shopping}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Emergency</p><p className="text-sm font-black text-white">₹{smartBudget.emergency}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Hidden Costs</p><p className="text-sm font-black text-white">₹{smartBudget.hiddenCosts}</p></div>
                     <div className="p-3 rounded-xl bg-black/20 border border-white/10"><p className="text-[9px] text-white/60 font-black uppercase">Reserve</p><p className="text-sm font-black text-white">₹{hiddenCostEstimate.hiddenCharges}</p></div>
                   </div>
                 </div>

                 <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">07. VETTED ACCOMMODATION</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     {p.stayStrategy?.hotels?.map((h: any, i: number) => (
                       <a 
                        key={i}
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.mapQuery || h.name)}`}
                        target="_blank"
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 group"
                       >
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{h.budget || 'STAY'}</span>
                           <ExternalLink className="h-3 w-3 text-white/20 group-hover:text-white transition-colors" />
                         </div>
                         <p className="text-sm font-black text-white uppercase tracking-tight mb-1">{h.name}</p>
                         <p className="text-[10px] text-[#b3b3b3] leading-relaxed line-clamp-2">{h.desc}</p>
                       </a>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">08. DAY-WISE ITINERARY</h4>
                   <div className="grid gap-5">
                     {p.itinerary?.map((d: any, i: number) => (
                       <div key={i} className="p-6 bg-white/5 border-l-4 border-emerald-500 rounded-r-3xl">
                         <h5 className="text-sm font-black text-white mb-4 uppercase tracking-tighter italic">Day {d.day} — {d.title}</h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {d.activities?.map((act: any, idx: number) => (
                             <a 
                              key={idx}
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.mapQuery || act.name)}`}
                              target="_blank"
                              className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-all border border-white/5"
                             >
                               <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                 <MapPin className="h-4 w-4 text-emerald-500" />
                               </div>
                               <div>
                                 <p className="text-[11px] font-bold text-white uppercase truncate max-w-[120px]">{act.name}</p>
                                 <p className="text-[9px] font-black text-emerald-400/60 font-mono">COST: {act.cost}</p>
                               </div>
                             </a>
                           ))}
                         </div>
                         <p className="mt-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block">
                           DAILY BUDGET: {d.dailyBudget}
                         </p>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                     <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">09. TRANSPORT</h4>
                     <p className="text-xs font-bold text-white uppercase leading-relaxed">{p.transportStrategy?.bestOption}</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                     <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">10. FOOD ENGINE</h4>
                     <div className="space-y-2">
                       {p.foodStrategy?.mustTry?.map((f: any, i: number) => (
                         <p key={i} className="text-[10px] font-black text-white uppercase tracking-tight">• {f.name}</p>
                       ))}
                     </div>
                   </div>
                   <div className="p-6 bg-[#ff0f7b]/10 rounded-3xl border border-[#ff0f7b]/30">
                     <h4 className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest mb-3">11. COST AUDIT</h4>
                     <p className="text-2xl font-black text-white font-mono tracking-tighter underline underline-offset-8 decoration-[#ff0f7b]">{p.costBreakdown?.total}</p>
                   </div>
                 </div>

                 {Array.isArray(p.checklist) && p.checklist.length > 0 && (
                   <div className="p-6 bg-white/5 rounded-3xl border border-cyan-500/20 space-y-3">
                     <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.3em]">12. PACKING CHECKLIST</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                       {p.checklist
                         .filter((item: any) => typeof item === 'string' && item.trim())
                         .map((item: string, i: number) => (
                           <p key={i} className="text-[11px] font-bold text-white/90">• {item}</p>
                         ))}
                     </div>
                   </div>
                 )}

                 <div className="pt-6">
                   <Button onClick={handleWhatsAppShare} className="w-full h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition-all active:scale-[0.965] uppercase tracking-[0.2em] text-sm">
                     <Share2 className="h-5 w-5" /> Copy Blueprint to WhatsApp
                   </Button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* 🌟 PHASE 2: IN-APP WEBVIEW CONTINUITY DIALOG */}
    <Dialog open={webViewOpen} onOpenChange={setWebViewOpen}>
      <DialogContent className="fixed top-0 left-0 w-screen h-screen max-w-none p-0 bg-[#0a0014] border-none z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0014]">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setWebViewOpen(false)} className="text-white hover:bg-white/10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest">Partner Portal</p>
              <p className="text-xs font-bold text-white/60 truncate max-w-[200px]">{activeUrl}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(activeUrl, '_blank')} className="bg-white/5 border-white/10 text-white rounded-xl text-[9px] uppercase font-black tracking-widest h-9">
            External Browser <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </div>
        <div className="flex-1 relative bg-white">
          <iframe 
            src={activeUrl} 
            className="w-full h-full border-none"
            title="Affiliate Portal"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          {/* Fallback overlay for sites blocking iframes */}
          <div className="absolute inset-0 bg-[#0a0014] flex flex-col items-center justify-center text-center p-8 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="max-w-xs space-y-4">
              <Globe className="h-12 w-12 text-[#ff0f7b] mx-auto mb-4" />
              <h4 className="text-lg font-black text-white uppercase">Secure Connection</h4>
              <p className="text-xs text-[#b3b3b3] font-bold">If the portal doesn't load, use the External Browser button above for full features.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default TripAdvisor;
