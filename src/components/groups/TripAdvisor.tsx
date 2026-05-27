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
import { Loader2, Share2, MapPin, Sparkles, CheckCircle2, AlertTriangle, Map as MapIcon, Navigation, ExternalLink, Calendar, Plane, Hotel, Globe, ArrowLeft, Heart, Target, Brain, Clock, Zap } from 'lucide-react';
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
• Duration: ${p.overview?.duration || 'TBD'}
• Best Fit: ${p.overview?.bestFit || 'TBD'}

2️⃣ *ASSUMPTIONS*
• Budget: ${p.assumptions?.budgetTarget || 'TBD'}
• Members: ${members}

3️⃣ *STAY STRATEGY*
${p.stayStrategy?.hotels?.map((h: any) => `• ${h.name} (${h.budget})\n  📍 Map: ${getMapLink(h.mapQuery || h.name)}`).join('\n')}

4️⃣ *COST BREAKDOWN*
• Total: ${p.costBreakdown?.total || 'TBD'}

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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-background rounded-[2.5rem] border border-border shadow-2xl z-50 max-h-[92vh] flex flex-col outline-none transform-gpu">
        
        <DialogTitle className="sr-only">Executive Blueprint Planner</DialogTitle>
        <DialogDescription className="sr-only">Plan your trip based on an exact budget calculation.</DialogDescription>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground/10 rounded-full z-20 md:hidden" />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 md:pb-12">
          
          <div className="relative pt-12 pb-6 md:pt-16 md:pb-8 bg-surface">
             <div className="text-center mb-10 md:mb-12 px-4">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-fintech-graphite-muted mb-2">EXECUTIVE BLUEPRINT</h3>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-[#1a1a1a] truncate px-4">
                  {targetDestination || groupName}
                </h2>

                {/* 🌟 PHASE 5: PERSONALITY & JOURNEY HEADER */}
                <div className="mt-6 flex flex-col items-center gap-4">
                   <div className={cn(
                     "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 shadow-sm",
                     "bg-background border-border text-text-secondary"
                   )}>
                     {travelPersonality.label}
                   </div>
                   
                   <div className="w-full max-w-[240px] space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-text-muted px-1">
                        <span>{journeyStage.label}</span>
                        <span>{journeyStage.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border shadow-inner">
                        <div 
                          className="h-full bg-foreground transition-all duration-1000 ease-out"
                          style={{ width: `${journeyStage.score}%` }}
                        />
                      </div>
                   </div>
                </div>
                
                {/* 🌟 PHASE 2: COUNTDOWN BANNER */}
                {countdownDays !== null && (
                  <div className="mt-6 inline-flex items-center gap-2.5 px-6 py-2 bg-background border border-border rounded-full shadow-sm">
                    <Calendar className="h-4 w-4 text-text-secondary" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                      {countdownDays === 0 ? "Traveling Today! 🚀" : countdownDays < 0 ? "Trip Completed ✅" : `${countdownDays} Days Remaining`}
                    </span>
                  </div>
                )}
             </div>

             {!isTravelGroup ? (
               <div className="px-6 md:px-12 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-background border border-border/60 rounded-[32px] p-8 md:p-12 shadow-inner">
                    <p className="text-[#1a1a1a] font-black text-lg md:text-2xl italic mb-3 tracking-tighter uppercase">No trip plan detected.</p>
                    <p className="text-fintech-graphite-muted text-[11px] md:text-xs uppercase font-black tracking-[0.2em] opacity-60">Manage your group expenses wisely.</p>
                  </div>
                  
                  {/* 🌍 FALLBACK: Manual Override Button */}
                  <div className="mt-10 pt-8 border-t border-border/40 max-w-sm mx-auto">
                     <p className="text-fintech-graphite-muted text-xs font-black uppercase tracking-widest mb-4 opacity-50">Wait, is this actually a trip?</p>
                     <Button onClick={handleManualOverride} variant="outline" className="w-full bg-surface border-border/60 text-[#1a1a1a] rounded-2xl h-16 hover:bg-[#1a1a1a] hover:text-white transition-all duration-500 font-black text-[11px] uppercase tracking-[0.2em] shadow-sm">
                       <MapIcon className="w-5 h-5 mr-3 text-fintech-graphite-muted group-hover:text-white" /> Yes, let me add the destination
                     </Button>
                  </div>
               </div>
             ) : (
               <div className="px-6 md:px-12 lg:px-20 space-y-6 md:space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2.5">
                      <Label className="text-fintech-graphite-muted text-[10px] md:text-xs font-black uppercase ml-1 tracking-widest opacity-60">📍 Where to?</Label>
                      <Input value={targetDestination} onChange={(e) => setTargetDestination(e.target.value)} placeholder="Enter a City/Place" className="bg-background border-border/40 text-[#1a1a1a] h-14 rounded-xl font-black text-sm md:text-base px-6 focus:border-border/80 shadow-inner" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-fintech-graphite-muted text-[10px] md:text-xs font-black uppercase ml-1 tracking-widest opacity-60">📅 Trip Date</Label>
                      <Input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="bg-background border-border/40 text-[#1a1a1a] h-14 rounded-xl font-black text-sm px-6 focus:border-border/80 shadow-inner appearance-none" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-fintech-graphite-muted text-[10px] md:text-xs font-black uppercase ml-1 tracking-widest opacity-60">👥 Members</Label>
                      <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-background border-border/40 text-[#1a1a1a] h-14 rounded-xl font-black text-sm md:text-base px-6 focus:border-border/80 shadow-inner" />
                    </div>
                    <div className="space-y-2.5 sm:col-span-3">
                      <Label className="text-fintech-graphite-muted text-[10px] md:text-xs font-black uppercase ml-1 tracking-widest opacity-60">💰 Total Budget</Label>
                      <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-background border-border/40 text-[#1a1a1a] h-14 rounded-xl font-black text-sm md:text-base px-6 focus:border-border/80 shadow-inner" />
                    </div>
                 </div>

                 <div className={cn(
                   "flex items-center gap-3 text-xs md:text-sm font-black px-4 py-2 rounded-full border w-fit mx-auto transition-all",
                   isLowBudget ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]" : "bg-fintech-emerald-muted text-fintech-emerald-dark border-fintech-emerald/20"
                 )}>
                   {isLowBudget ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                   {isLowBudget 
                     ? `⚠️ Tight Budget: ₹${perPersonCost}/head. Logic will optimize for value.` 
                     : `👉 Budget Basis: ₹${perPersonCost} per person.`}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 bg-surface border border-border rounded-3xl space-y-2 shadow-sm">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Affordability Score</p>
                     <p className="text-3xl font-bold text-foreground font-mono">{affordability.score}%</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{affordability.level}</p>
                   </div>
                   <div className="p-6 bg-surface border border-border rounded-3xl space-y-2 shadow-sm">
                     <div className="flex justify-between items-start">
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Travel Confidence</p>
                       <Brain className="h-4 w-4 text-text-muted" />
                     </div>
                     <p className="text-3xl font-bold text-foreground font-mono">{travelConfidence.score}%</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{travelConfidence.level}</p>
                   </div>
                 </div>

                 {/* 🌟 PHASE 4: SMART TRAVEL MEMORY */}
                 {targetDestination && (
                   <div className="px-6 py-4 rounded-2xl border bg-background border-border flex items-center gap-4 shadow-inner">
                     <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 shadow-sm">
                       <MapPin className="h-4 w-4 text-text-secondary" />
                     </div>
                     <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">{memoryEngine.text}</p>
                   </div>
                 )}

                 {/* 🌟 PHASE 3: EMOTIONAL INTELLIGENCE & SAVINGS GOAL PANELS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className={cn(
                     "p-6 border rounded-3xl space-y-3 flex flex-col justify-center transition-all shadow-sm",
                     "bg-surface border-border"
                   )}>
                     <div className="flex items-center gap-2.5 mb-1">
                        <Heart className="h-4 w-4 text-text-secondary" />
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Vibe Check</p>
                     </div>
                     <p className="text-[12px] font-bold text-foreground leading-snug uppercase tracking-tight">{emotionalIntelligence.sentiment}</p>
                   </div>
                   
                   {savingsGoal ? (
                     <div className="p-6 bg-surface border border-border rounded-3xl space-y-2 flex flex-col justify-center shadow-sm">
                       <div className="flex items-center gap-2.5 mb-1">
                         <Target className="h-4 w-4 text-text-secondary" />
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Savings Goal</p>
                       </div>
                       <p className="text-2xl font-bold text-foreground font-mono tracking-tighter">₹{savingsGoal.monthlyTarget}<span className="text-[11px] text-text-secondary font-bold ml-1.5 uppercase">/mo</span></p>
                       <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-text-muted mt-2 mb-1">
                         <span>Ready</span>
                         <span>{savingsGoal.readinessScore}%</span>
                       </div>
                       <div className="h-1 w-full bg-background rounded-full overflow-hidden border border-border shadow-inner">
                         <div className="h-full bg-foreground transition-all duration-700" style={{ width: `${savingsGoal.readinessScore}%` }} />
                       </div>
                     </div>
                   ) : (
                     <div className="p-6 bg-background border border-border border-dashed rounded-3xl flex flex-col justify-center items-center text-center opacity-60">
                       <Calendar className="h-6 w-6 text-text-muted mb-3" />
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Set Trip Date<br/>for Savings Goal</p>
                     </div>
                   )}
                 </div>

                 <div className="p-6 bg-surface border border-border rounded-3xl space-y-4 shadow-sm">
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">AI Insights</p>
                   <div className="space-y-2">
                     {insightCards.map((insight, idx) => (
                       <p key={idx} className="text-[12px] font-bold text-text-secondary uppercase tracking-tight leading-relaxed">• {insight}</p>
                     ))}
                   </div>
                 </div>

                 <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-16 md:h-20 bg-[#1a1a1a] text-white font-black rounded-2xl md:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all active:scale-[0.97] text-sm md:text-lg uppercase tracking-[0.2em] mt-2 hover:bg-[#111111]">
                   {isGenerating ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Sparkles className="h-6 w-6 mr-4" />}
                   {isGenerating ? "Compiling Blueprint..." : "Deploy Blueprint 🚀"}
                 </Button>

                 {/* 🌟 PHASE 2: AFFILIATE CARDS (PRE-GENERATION) */}
                 {!p && (
                   <div className="pt-10 space-y-6">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] text-center">Evolving Ecosystem</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {AFFILIATE_LINKS.map((link) => (
                         <button 
                           key={link.id}
                           onClick={() => openAffiliateLink(link.url)}
                           className="p-6 bg-surface border border-border rounded-2xl text-left transition-all hover:border-foreground/20 active:scale-[0.98] group shadow-sm"
                         >
                           <div className="flex justify-between items-center mb-4">
                             <link.icon className="h-6 w-6 text-text-secondary group-hover:text-foreground transition-colors" />
                             {!link.url && <div className="px-2 py-0.5 rounded-md bg-background border border-border text-text-muted text-[8px] font-bold uppercase tracking-widest">SOON</div>}
                           </div>
                           <p className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-1.5">{link.name}</p>
                           <p className="text-[10px] text-text-secondary font-medium leading-relaxed">{link.desc}</p>
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* 🌟 PHASE 2: GENERATED BLUEPRINT VIEW */}
          {p && (
            <div className="px-6 md:px-12 lg:px-20 py-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-10">
               
               <div className="p-10 rounded-[40px] bg-[#1a1a1a] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <Sparkles size={140} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                         <h4 className="text-3xl font-black tracking-tighter uppercase leading-tight">Strategic Itinerary</h4>
                         <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mt-2">Executive Level Access</p>
                       </div>
                       <button onClick={() => setTripPlan(null)} className="text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.25em] bg-white/5 px-4 py-2 rounded-lg border border-white/10">Reset Model</button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner group/card hover:bg-white/10 transition-all">
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-3 group-hover/card:text-white/80 transition-colors">Hotel</p>
                        <p className="text-2xl font-black font-mono tracking-tighter tabular-nums leading-none text-white">₹{smartBudget.hotel.toLocaleString()}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner group/card hover:bg-white/10 transition-all">
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-3 group-hover/card:text-white/80 transition-colors">Travel</p>
                        <p className="text-2xl font-black font-mono tracking-tighter tabular-nums leading-none text-white">₹{smartBudget.travel.toLocaleString()}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner group/card hover:bg-white/10 transition-all">
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-3 group-hover/card:text-white/80 transition-colors">Food</p>
                        <p className="text-2xl font-black font-mono tracking-tighter tabular-nums leading-none text-white">₹{smartBudget.food.toLocaleString()}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner group/card hover:bg-white/10 transition-all">
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mb-3 group-hover/card:text-white/80 transition-colors">Reserve</p>
                        <p className="text-2xl font-black font-mono tracking-tighter tabular-nums leading-none text-white">₹{smartBudget.emergency.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-14 space-y-10">
                      <div className="p-10 bg-white rounded-[32px] border border-white/20 shadow-2xl">
                         <div className="flex items-center gap-6 mb-10">
                            {/* Circular Premium Icon Container - Chrono Style */}
                            <div className="h-14 w-14 rounded-full bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
                               <Clock className="h-7 w-7 text-[#DC2626]" />
                            </div>
                            <div>
                               <p className="text-[#1a1a1a] text-lg font-black uppercase tracking-tight leading-none">Sequence Strategy</p>
                               <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Chronological Flow</p>
                            </div>
                         </div>
                         <div className="space-y-8">
                            {p.itinerary?.map((day: any) => (
                              <div key={day.day} className="space-y-5 pb-8 border-b border-border/40 last:border-0 last:pb-0 group/day">
                                <div className="flex items-center gap-4">
                                   <p className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-[0.25em] bg-background border border-border/60 px-4 py-1.5 rounded-full w-fit shadow-sm">Period {day.day}</p>
                                   <p className="text-fintech-graphite-muted text-[13px] font-black uppercase tracking-tight opacity-40 group-hover/day:opacity-80 transition-opacity">
                                     {typeof day.title === 'object' ? (day.title.name || 'Untitled') : (day.title || 'Untitled')}
                                   </p>
                                </div>
                                <div className="space-y-4 pl-2">
                                  {day.activities?.map((act: any, i: number) => (
                                    <div key={i} className="flex gap-8 items-start group/act">
                                      <span className="text-[11px] font-black text-fintech-graphite-muted mt-1 w-18 shrink-0 uppercase tracking-tighter opacity-50 group-hover/act:opacity-100 transition-opacity">{act.time || 'Routine'}</span>
                                      <p className="text-[16px] font-bold text-[#1a1a1a] group-hover/act:translate-x-1 transition-transform duration-500">
                                        {typeof act === 'object' ? (act.desc || act.name || 'Activity') : act}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      {/* 🗺️ LIVE GOOGLE MAP INTEL */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-6 px-4">
                           {/* Circular Premium Icon Container - Map Style */}
                           <div className="h-14 w-14 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
                             <Navigation className="h-7 w-7 text-[#DC2626]" />
                           </div>
                           <div>
                             <p className="text-white text-lg font-black uppercase tracking-tight leading-none">Destination Intel</p>
                             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5">Live Terminal Map</p>
                           </div>
                        </div>
                        <div className="w-full h-64 md:h-96 bg-white rounded-[40px] overflow-hidden border border-white/20 shadow-2xl relative">
                          <iframe 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(1.1) contrast(90%)' }} 
                            loading="lazy" 
                            allowFullScreen 
                            src={`https://maps.google.com/maps?q=$${encodeURIComponent(targetDestination)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                          ></iframe>
                          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[40px]"></div>
                        </div>
                      </section>

                      <div className="p-10 bg-white rounded-[40px] border border-white/20 shadow-2xl">
                         <div className="flex items-center gap-6 mb-8 text-[#1a1a1a]">
                            {/* Circular Premium Icon Container - Logistics Style */}
                            <div className="h-14 w-14 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
                               <MapPin className="h-7 w-7 text-[#DC2626]" />
                            </div>
                            <div>
                               <p className="text-lg font-black uppercase tracking-tight leading-none">Logistics Protocol</p>
                               <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Verified Movement Strategy</p>
                            </div>
                         </div>
                         <div className="grid sm:grid-cols-2 gap-10">
                           <div className="space-y-4">
                             <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] opacity-40">Transit Logic</p>
                             <div className="space-y-2">
                               <p className="text-[16px] font-black text-[#1a1a1a] leading-tight">
                                 ✈️ {typeof p.travelPlan?.flight?.route === 'object' ? (p.travelPlan.flight.route.name || 'Not recommended') : (p.travelPlan?.flight?.route || 'Not recommended')}
                               </p>
                               <p className="text-[14px] font-bold text-fintech-graphite-muted leading-relaxed italic border-l-2 border-border/40 pl-5">
                                 {typeof p.travelPlan?.flight?.postLanding === 'object' ? (p.travelPlan.flight.postLanding.desc || 'Standard arrival protocol') : (p.travelPlan?.flight?.postLanding || 'Standard arrival protocol')}
                               </p>
                               <p className="text-[15px] font-bold text-[#1a1a1a] opacity-80 mt-4">
                                 🚆 {typeof p.travelPlan?.train?.route === 'object' ? (p.travelPlan.train.route.name || 'Checking alternatives...') : (p.travelPlan?.train?.route || 'Checking alternatives...')}
                               </p>
                             </div>
                           </div>
                           <div className="space-y-4">
                             <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] opacity-40">Asset Strategy</p>
                             <div className="bg-background p-6 rounded-[28px] border border-border/40 shadow-sm">
                               <p className="text-[15px] font-black text-[#1a1a1a] mb-2 uppercase tracking-tight leading-none">
                                 📍 {typeof p.stayStrategy?.location === 'object' ? (p.stayStrategy.location.name || 'Selection active') : (p.stayStrategy?.location || 'Selection active')}
                               </p>
                               <p className="text-[12px] font-bold text-fintech-graphite-muted uppercase tracking-widest opacity-60 leading-tight">
                                 Zones: {typeof p.stayStrategy?.areas === 'object' ? (p.stayStrategy.areas.name || 'Optimized coverage') : (p.stayStrategy?.areas || 'Optimized coverage')}
                               </p>
                               <div className="mt-5 space-y-2">
                                 {p.stayStrategy?.hotels?.map((h: any, idx: number) => (
                                   <p key={idx} className="text-[13px] font-black text-[#1a1a1a] opacity-80 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] opacity-30" /> 
                                     {typeof h === 'object' ? (h.name || 'Hotel') : h}
                                   </p>
                                 ))}
                               </div>
                             </div>
                           </div>
                         </div>
                      </div>

                      <div className="p-10 bg-white rounded-[40px] border border-white/20 shadow-2xl">
                         <div className="flex items-center gap-6 mb-8 text-[#1a1a1a]">
                            {/* Circular Premium Icon Container - Risk Style */}
                            <div className="h-14 w-14 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
                               <Zap className="h-7 w-7 text-[#DC2626]" />
                            </div>
                            <div>
                               <p className="text-lg font-black uppercase tracking-tight leading-none">Strategic Risk Controls</p>
                               <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Forensic Contingency Plan</p>
                            </div>
                         </div>
                         <div className="space-y-5">
                           {p.riskManagement?.contingency?.map((c: any, i: number) => (
                             <div key={i} className="flex items-center gap-5 text-[15px] font-bold text-[#1a1a1a] group/risk bg-background p-5 rounded-[24px] border border-border/40 shadow-sm hover:border-border/80 transition-all duration-500">
                               <div className="h-3 w-3 rounded-full bg-[#DC2626] opacity-20 shrink-0 group-hover/risk:opacity-100 transition-opacity" />
                               {typeof c === 'object' ? (c.desc || c.name || 'Precaution active') : (c || 'Precaution active')}
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          <div className="px-6 md:px-12 lg:px-20 mt-12 space-y-6">
            <div className="p-10 bg-surface border border-border/40 rounded-[40px] text-center shadow-sm">
                <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.4em] mb-4 opacity-60">Integrity Disclaimer</p>
                <p className="text-xs text-[#525252] leading-relaxed uppercase tracking-widest max-w-sm mx-auto font-bold opacity-80">BachatKaro Analysis is advisory. Verify all logistics and pricing independently. Financial responsibility remains with user entities.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-background border-t border-border/40 shrink-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row gap-5">
            <Button onClick={() => openAffiliateLink(`https://www.google.com/maps/search/${encodeURIComponent(targetDestination || 'Trip')}+hotels`)} variant="outline" className="flex-1 bg-surface border-border/60 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white h-18 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-sm transition-all active:scale-95 duration-500 group/btn">
              <Globe className="w-6 w-6 mr-3 text-fintech-graphite-muted group-hover/btn:text-white transition-colors" /> Google Maps Intel
            </Button>
            <Button onClick={() => window.open(activeUrl, '_blank')} className="flex-1 bg-[#1a1a1a] text-white h-18 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:bg-[#111111] transition-all active:scale-95 duration-500">
              <ExternalLink className="w-6 w-6 mr-3" /> External Terminal
            </Button>
          </div>
          
          <div className="mt-8 p-5 rounded-2xl bg-surface border border-border/40 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-fintech-emerald animate-pulse" />
               <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em] opacity-60">Active Terminal Connection</p>
            </div>
            <p className="text-[10px] font-black text-[#1a1a1a] truncate max-w-[200px] uppercase tracking-tighter opacity-40">{activeUrl || 'Handshake Pending'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 🌟 PHASE 2: IN-APP WEBVIEW CONTINUITY DIALOG */}
    <Dialog open={webViewOpen} onOpenChange={setWebViewOpen}>
      <DialogContent className="fixed top-0 left-0 w-screen h-screen max-w-none p-0 bg-background border-none z-[110] flex flex-col animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 border-b border-border/40 flex items-center justify-between px-8 bg-surface shadow-sm">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setWebViewOpen(false)} className="h-12 w-12 text-[#1a1a1a] hover:bg-background border border-transparent hover:border-border/60 rounded-full transition-all">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] opacity-60">Partner Resource</p>
              <p className="text-sm font-black text-[#1a1a1a] truncate max-w-[280px] uppercase tracking-tighter">{activeUrl}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(activeUrl, '_blank')} className="bg-background border-border/60 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white rounded-xl text-[10px] uppercase font-black tracking-widest h-11 px-6 shadow-sm transition-all duration-500">
            Open in Browser <ExternalLink className="h-4 w-4 ml-3" />
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
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center text-center p-12 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-background/95">
            <div className="max-w-md space-y-8">
              <div className="p-8 bg-surface rounded-[40px] border border-border/60 w-fit mx-auto shadow-sm">
                <Globe className="h-16 w-16 text-fintech-graphite-muted opacity-40" />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter">Secure Connection</h4>
                <p className="text-base text-fintech-graphite-muted font-bold leading-relaxed uppercase tracking-widest opacity-60">Site security policies may restrict in-app rendering. Use the button above to launch in your native browser.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default TripAdvisor;
