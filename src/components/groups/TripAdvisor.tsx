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
  LUXURY:    { label: '✨ Luxury Traveler',  color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20' },
  BUDGET:    { label: '🎒 Budget Explorer',  color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-500/10',   border: 'border-green-200 dark:border-green-500/20' },
  FAMILY:    { label: '👨‍👩‍👧 Family Planner',  color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/20'  },
  SPIRITUAL: { label: '🕊️ Soul Seeker',      color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20' },
  ROMANTIC:  { label: '💑 Romantic Nomad',   color: 'text-rose-700 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-200 dark:border-rose-500/20'  },
  ADVENTURE: { label: '⚡ Thrill Seeker',    color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' }
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

// ── FINANCIAL COLOR SYSTEM ──────────────────────────────────
// Transport: blue, Food: green, Hotel: purple, Activities: amber, Emergency: red
const BUDGET_CARD_COLORS = {
  hotel:     { label: 'Hotel & Stay',    color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.2)'  },
  travel:    { label: 'Transport',       color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)'   },
  food:      { label: 'Food',            color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)'   },
  emergency: { label: 'Emergency Fund',  color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.2)'   },
};

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
      toast({ title: "Trip Plan Ready!", className: "bg-foreground text-surface shadow-xl" });
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
    
    const msg = `✈️ *TRIP PLAN: ${targetDestination.toUpperCase()} TRIP* 🌴\n\n1️⃣ *OVERVIEW*\n• Duration: ${p.overview?.duration || 'TBD'}\n• Best Fit: ${p.overview?.bestFit || 'TBD'}\n\n2️⃣ *TRIP DETAILS*\n• Budget: ${p.assumptions?.budgetTarget || 'TBD'}\n• Members: ${members}\n\n3️⃣ *WHERE TO STAY*\n${p.stayStrategy?.hotels?.map((h: any) => `• ${h.name} (${h.budget})\n  📍 Map: ${getMapLink(h.mapQuery || h.name)}`).join('\n')}\n\n4️⃣ *COST BREAKDOWN*\n• Total: ${p.costBreakdown?.total || 'TBD'}\n\n🔗 Generated via BachatKaro App`;

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
      <DialogContent 
        className="fixed left-[50%] translate-x-[-50%] w-[95vw] max-w-[720px] p-0 overflow-hidden bg-background rounded-modal border border-border/40 shadow-institutional z-[110] flex flex-col outline-none transform-gpu"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 84px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 184px)',
        }}
      >
        
        <DialogTitle className="sr-only">Trip Planner</DialogTitle>
        <DialogDescription className="sr-only">Plan your trip based on an exact budget calculation.</DialogDescription>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground/10 rounded-full z-20 md:hidden" />

        {/* ── HERO SECTION: Vibrant Neon Typography (Fixed) ── */}
        <div className="relative pt-10 pb-4 px-6 text-center overflow-hidden shrink-0 bg-surface/50 backdrop-blur-md border-b border-border/40">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,#0F766E_0%,transparent_70%)] animate-pulse" />
          </div>
          
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-none bg-gradient-to-r from-[#F97316] via-[#EC4899] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(236,72,153,0.3)] animate-in fade-in zoom-in-95 duration-700 uppercase">
              {targetDestination || groupName}
            </h2>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground/70 leading-relaxed drop-shadow-sm">
              Trip Intelligence Platform 🚀
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-8 md:pb-12">
          
          <div className="relative py-8 bg-surface">
             <div className="text-center mb-10 md:mb-12 px-4">

                {/* 🌟 PHASE 5: PERSONALITY & JOURNEY HEADER */}
                <div className="flex flex-col items-center gap-4">
                   <div className={cn(
                     "px-4 py-1.5 rounded-full border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 shadow-sm",
                     travelPersonality.bg, travelPersonality.border, travelPersonality.color
                   )}>
                     {travelPersonality.label}
                   </div>
                   
                   <div className="w-full max-w-[240px] space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-muted-foreground px-1">
                        <span>{journeyStage.label}</span>
                        <span>{journeyStage.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/40 shadow-inner">
                        <div 
                          className="h-full bg-institutional-blue transition-all duration-1000 ease-butter-soft"
                          style={{ width: `${journeyStage.score}%` }}
                        />
                      </div>
                   </div>
                </div>
                
                {/* 🌟 PHASE 2: COUNTDOWN BANNER */}
                {countdownDays !== null && (
                  <div className="mt-6 inline-flex items-center gap-2.5 px-6 py-2 bg-background border border-border/40 rounded-full shadow-sm">
                    <Calendar className="h-4 w-4 text-institutional-blue" />
                    <span className="text-xs font-medium text-foreground">
                      {countdownDays === 0 ? "Traveling Today! 🚀" : countdownDays < 0 ? "Trip Completed ✅" : `${countdownDays} days to go`}
                    </span>
                  </div>
                )}
             </div>

             {!isTravelGroup ? (
               <div className="px-6 md:px-12 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-background border border-border/40 rounded-premium p-8 md:p-12 shadow-inner">
                    <p className="text-foreground font-bold text-lg md:text-2xl italic mb-3 tracking-tight">No trip plan detected.</p>
                    <p className="text-muted-foreground text-sm">Manage your group expenses wisely.</p>
                  </div>
                  
                  {/* 🌍 FALLBACK: Manual Override Button */}
                  <div className="mt-10 pt-8 border-t border-border/40 max-w-sm mx-auto">
                     <p className="text-muted-foreground text-sm mb-4">Wait, is this actually a trip?</p>
                     <Button onClick={handleManualOverride} variant="outline" className="w-full bg-surface border-border/40 text-foreground rounded-xl h-14 hover:bg-background hover:border-institutional-blue/40 transition-all duration-500 font-medium text-sm shadow-sm">
                       <MapIcon className="w-5 h-5 mr-3 text-institutional-blue" /> Yes, let me add the destination
                     </Button>
                  </div>
               </div>
             ) : (
               <div className="px-6 md:px-12 lg:px-20 space-y-6 md:space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs font-medium ml-1">📍 Where to?</Label>
                      <Input value={targetDestination} onChange={(e) => setTargetDestination(e.target.value)} placeholder="Enter a City/Place" className="bg-background border-border/40 text-foreground h-14 rounded-xl font-medium text-sm md:text-base px-5 focus:border-institutional-blue shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs font-medium ml-1">📅 Trip Date</Label>
                      <Input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="bg-background border-border/40 text-foreground h-14 rounded-xl font-medium text-sm px-5 focus:border-institutional-blue shadow-inner appearance-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs font-medium ml-1">👥 Members</Label>
                      <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-background border-border/40 text-foreground h-14 rounded-xl font-medium text-sm md:text-base px-5 focus:border-institutional-blue shadow-inner" />
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                      <Label className="text-muted-foreground text-xs font-medium ml-1">💰 Total Budget</Label>
                      <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-background border-border/40 text-foreground h-14 rounded-xl font-medium text-sm md:text-base px-5 focus:border-institutional-blue shadow-inner" />
                    </div>
                 </div>

                 <div className={cn(
                   "flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border w-fit mx-auto transition-all",
                   isLowBudget
                     ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                     : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                 )}>
                   {isLowBudget
                     ? <AlertTriangle className="h-3.5 w-3.5" />
                     : <CheckCircle2 className="h-3.5 w-3.5" />}
                   {isLowBudget
                     ? `Tight budget · ₹${perPersonCost.toLocaleString()}/person`
                     : `₹${perPersonCost.toLocaleString()} per person`}
                 </div>

                 {/* Score cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 bg-surface border border-border/40 rounded-premium space-y-3 shadow-premium">
                     <p className="text-xs font-medium text-muted-foreground">Affordability</p>
                     <p className={cn("text-3xl font-black font-mono tracking-tighter", affordability.level === 'HIGH' ? "text-green-600 dark:text-green-400" : affordability.level === 'MEDIUM' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>{affordability.score}%</p>
                     <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/40">
                       <div className={cn("h-full transition-all duration-700", affordability.level === 'HIGH' ? "bg-green-500" : affordability.level === 'MEDIUM' ? "bg-amber-400" : "bg-red-500")} style={{ width: `${affordability.score}%` }} />
                     </div>
                   </div>
                   <div className="p-6 bg-surface border border-border/40 rounded-premium space-y-2 shadow-premium">
                     <div className="flex justify-between items-start">
                       <p className="text-xs font-medium text-muted-foreground">Travel Confidence</p>
                       <Brain className="h-4 w-4 text-institutional-blue opacity-40" />
                     </div>
                     <p className="text-3xl font-black text-foreground font-mono tracking-tighter">{travelConfidence.score}%</p>
                     <p className="text-xs font-medium text-muted-foreground">{travelConfidence.level}</p>
                   </div>
                 </div>

                 {/* 🌟 PHASE 4: SMART TRAVEL MEMORY */}
                 {targetDestination && (
                   <div className="px-5 py-4 rounded-xl border bg-background border-border/40 flex items-center gap-4 shadow-inner">
                     <div className="h-8 w-8 rounded-full bg-surface border border-border/40 flex items-center justify-center shrink-0 shadow-premium">
                       <MapPin className="h-4 w-4 text-institutional-blue" />
                     </div>
                     <p className="text-sm text-muted-foreground leading-relaxed">{memoryEngine.text}</p>
                   </div>
                 )}

                 {/* 🌟 PHASE 3: EMOTIONAL INTELLIGENCE & SAVINGS GOAL PANELS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 border rounded-premium space-y-3 flex flex-col justify-center transition-all shadow-premium bg-surface border-border/40">
                     <div className="flex items-center gap-2.5 mb-1">
                        <Heart className="h-4 w-4 text-institutional-blue" />
                        <p className="text-xs font-semibold text-muted-foreground">Vibe Check</p>
                     </div>
                     <p className="text-sm font-medium text-foreground leading-snug italic opacity-80">"{emotionalIntelligence.sentiment}"</p>
                   </div>
                   
                   {savingsGoal ? (
                     <div className="p-6 bg-surface border border-border/40 rounded-premium space-y-2 flex flex-col justify-center shadow-premium">
                       <div className="flex items-center gap-2.5 mb-1">
                         <Target className="h-4 w-4 text-institutional-blue" />
                         <p className="text-xs font-semibold text-muted-foreground">Monthly Savings Target</p>
                       </div>
                       <p className="text-2xl font-black text-foreground font-mono tracking-tighter">₹{savingsGoal.monthlyTarget}<span className="text-xs text-muted-foreground font-medium ml-1.5">/month</span></p>
                       <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mt-2 mb-1">
                         <span>Readiness</span>
                         <span>{savingsGoal.readinessScore}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/40 shadow-inner">
                         <div className="h-full bg-institutional-blue transition-all duration-700" style={{ width: `${savingsGoal.readinessScore}%` }} />
                       </div>
                     </div>
                   ) : (
                     <div className="p-6 bg-background border border-border/40 border-dashed rounded-premium flex flex-col justify-center items-center text-center opacity-60 shadow-inner">
                       <Calendar className="h-6 w-6 text-muted-foreground mb-3 opacity-40" />
                       <p className="text-xs font-medium text-muted-foreground">Set a trip date to see your savings goal</p>
                     </div>
                   )}
                 </div>

                 {/* AI Insights */}
                 <div className="p-6 bg-surface border border-border/40 rounded-premium space-y-4 shadow-premium">
                   <p className="text-xs font-semibold text-muted-foreground">Smart Insights</p>
                   <div className="space-y-3">
                     {insightCards.map((insight, idx) => (
                       <p key={idx} className="text-sm text-muted-foreground leading-relaxed flex gap-3 items-start">
                         <span className="text-institutional-blue mt-0.5">•</span> {insight}
                       </p>
                     ))}
                   </div>
                 </div>

                 {/* [UI] Generate button — human copy, no "Deploy Blueprint 🚀" */}
                 <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-16 md:h-20 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] rounded-xl md:rounded-premium shadow-institutional transition-all active:scale-[0.97] text-xs md:text-sm mt-2 hover:opacity-95">
                   {isGenerating ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Sparkles className="h-5 w-5 mr-3" />}
                   {isGenerating ? "Planning your trip…" : "Create My Trip Plan"}
                 </Button>

                 {/* 🌟 PHASE 2: AFFILIATE CARDS (PRE-GENERATION) — only show when URLs are available */}
                 {!p && AFFILIATE_LINKS.some(l => l.url) && (
                   <div className="pt-8 space-y-5">
                     <p className="text-xs font-medium text-muted-foreground text-center">Partner resources</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {AFFILIATE_LINKS.filter(l => l.url).map((link) => (
                         <button
                           key={link.id}
                           onClick={() => openAffiliateLink(link.url)}
                           className="p-5 bg-surface border border-border/40 rounded-xl text-left transition-all hover:border-institutional-blue/20 active:scale-[0.98] group shadow-sm"
                         >
                           <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-institutional-blue transition-colors mb-3" />
                           <p className="text-sm font-semibold text-foreground mb-1">{link.name}</p>
                           <p className="text-xs text-muted-foreground leading-tight">{link.desc}</p>
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* 🌟 PHASE 2: GENERATED PLAN VIEW */}
          {p && (
            <div className="px-6 md:px-12 lg:px-20 py-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-10">
               
               <div className="p-8 sm:p-10 rounded-modal bg-surface border border-border/40 text-foreground space-y-10 shadow-institutional relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Sparkles size={140} className="text-institutional-blue" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                         {/* [UI] "Strategic Itinerary" → "Trip Plan" */}
                         <h4 className="text-3xl font-black tracking-tighter leading-tight">Trip Plan</h4>
                         <p className="text-xs text-muted-foreground font-medium mt-1.5">{targetDestination} · {members} people</p>
                       </div>
                       <button onClick={() => setTripPlan(null)} className="text-muted-foreground hover:text-foreground transition-all text-xs font-medium bg-background px-4 py-2 rounded-lg border border-border/40">Start over</button>
                    </div>

                    {/* [UI] Budget cards — financial color coded */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { key: 'hotel',     value: smartBudget.hotel },
                        { key: 'travel',    value: smartBudget.travel },
                        { key: 'food',      value: smartBudget.food },
                        { key: 'emergency', value: smartBudget.emergency },
                      ].map((item) => {
                        const meta = BUDGET_CARD_COLORS[item.key as keyof typeof BUDGET_CARD_COLORS];
                        return (
                          <div
                            key={item.key}
                            className="p-5 rounded-xl border transition-all"
                            style={{
                              background: meta.bg,
                              borderColor: meta.border,
                            }}
                          >
                            <p className="text-xs font-medium mb-2" style={{ color: meta.color }}>{meta.label}</p>
                            <p className="text-xl font-black font-mono tracking-tighter text-foreground">₹{item.value.toLocaleString()}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-14 space-y-10">
                      {/* [UI] "Sequence Strategy / Chronological Flow" → "Day-by-Day Plan / Daily Schedule" */}
                      <div className="p-6 sm:p-10 bg-background rounded-premium border border-border/40 shadow-inner w-full max-w-full overflow-hidden">
                         <div className="flex items-center gap-5 mb-8">
                            <div className="h-12 w-12 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 shadow-premium">
                               <Clock className="h-6 w-6 text-institutional-blue" />
                            </div>
                            <div>
                               <p className="text-foreground text-base font-semibold leading-none">Day-by-Day Plan</p>
                               <p className="text-muted-foreground text-xs font-medium mt-1">Daily Schedule</p>
                            </div>
                         </div>
                         <div className="space-y-8">
                            {p.itinerary?.map((day: any) => (
                              <div key={day.day} className="space-y-5 pb-8 border-b border-border/40 last:border-0 last:pb-0 group/day">
                                <div className="flex items-center gap-4">
                                   <p className="text-xs font-semibold text-foreground bg-surface border border-border/40 px-4 py-1.5 rounded-full w-fit shadow-sm">Day {day.day}</p>
                                   <p className="text-muted-foreground text-sm font-medium group-hover/day:text-foreground transition-colors">
                                     {typeof day.title === 'object' ? (day.title.name || 'Untitled') : (day.title || 'Untitled')}
                                   </p>
                                </div>
                                <div className="space-y-4 pl-2">
                                  {day.activities?.map((act: any, i: number) => (
                                    <div key={i} className="flex gap-6 items-start group/act">
                                      <span className="text-xs font-medium text-institutional-blue mt-1 w-16 shrink-0 opacity-60 group-hover/act:opacity-100 transition-opacity">{act.time || ''}</span>
                                      <p className="text-sm font-medium text-foreground group-hover/act:translate-x-0.5 transition-transform duration-300">
                                        {typeof act === 'object' ? (act.desc || act.name || 'Activity') : act}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      {/* 🗺️ MAP VIEW — [UI] "Destination Intel / Live Terminal Map" → "Map View" */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-5 px-2">
                           <div className="h-12 w-12 rounded-full bg-surface border border-border/40 flex items-center justify-center shrink-0 shadow-premium">
                             <Navigation className="h-6 w-6 text-institutional-blue" />
                           </div>
                           <div>
                             <p className="text-foreground text-base font-semibold leading-none">Map View</p>
                             <p className="text-muted-foreground text-xs font-medium mt-1">{targetDestination}</p>
                           </div>
                        </div>
                        <div className="w-full h-64 md:h-96 bg-surface rounded-modal overflow-hidden border border-border/40 shadow-institutional relative">
                          {/* [UNTOUCHED] iframe src and all attributes */}
                          <iframe 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(1.1) contrast(90%)' }} 
                            loading="lazy" 
                            allowFullScreen 
                            src={`https://maps.google.com/maps?q=$${encodeURIComponent(targetDestination)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                          ></iframe>
                          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/20 rounded-modal"></div>
                        </div>
                      </section>

                      {/* [UI] "Logistics Protocol / Verified Movement Strategy" → "Getting Around / Transport Plan" */}
                      {/* [UI] "Transit Logic" → "Getting Around" | "Asset Strategy" → "Where to Stay" */}
                      <div className="p-6 sm:p-10 bg-surface rounded-modal border border-border/40 shadow-institutional w-full max-w-full overflow-hidden">
                         <div className="flex items-center gap-5 mb-8 text-foreground">
                            <div className="h-12 w-12 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
                               <MapPin className="h-6 w-6 text-institutional-blue" />
                            </div>
                            <div>
                               <p className="text-base font-semibold leading-none">Getting Around</p>
                               <p className="text-muted-foreground text-xs font-medium mt-1">Transport Plan</p>
                            </div>
                         </div>
                         <div className="grid sm:grid-cols-2 gap-8">
                           <div className="space-y-4">
                             {/* Transport color: blue */}
                             <p className="text-xs font-medium text-muted-foreground" style={{ color: '#2563EB' }}>How to get there</p>
                             <div className="space-y-2">
                               <p className="text-sm font-semibold text-foreground leading-tight">
                                 ✈️ {typeof p.travelPlan?.flight?.route === 'object' ? (p.travelPlan.flight.route.name || 'Not recommended') : (p.travelPlan?.flight?.route || 'Not recommended')}
                               </p>
                               <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border/40 pl-4">
                                 {typeof p.travelPlan?.flight?.postLanding === 'object' ? (p.travelPlan.flight.postLanding.desc || 'Standard arrival') : (p.travelPlan?.flight?.postLanding || 'Standard arrival')}
                               </p>
                               <p className="text-sm font-medium text-foreground mt-3">
                                 🚆 {typeof p.travelPlan?.train?.route === 'object' ? (p.travelPlan.train.route.name || 'Checking alternatives...') : (p.travelPlan?.train?.route || 'Checking alternatives...')}
                               </p>
                             </div>
                           </div>
                           <div className="space-y-4">
                             {/* Hotel color: purple */}
                             <p className="text-xs font-medium" style={{ color: '#7C3AED' }}>Where to stay</p>
                             <div className="bg-background p-5 rounded-xl border border-border/40 shadow-inner">
                               <p className="text-sm font-semibold text-foreground mb-1.5">
                                 📍 {typeof p.stayStrategy?.location === 'object' ? (p.stayStrategy.location.name || 'Selection active') : (p.stayStrategy?.location || 'Selection active')}
                               </p>
                               <p className="text-xs text-muted-foreground leading-tight">
                                 Areas: {typeof p.stayStrategy?.areas === 'object' ? (p.stayStrategy.areas.name || 'Optimised coverage') : (p.stayStrategy?.areas || 'Optimised coverage')}
                               </p>
                               <div className="mt-4 space-y-2">
                                 {p.stayStrategy?.hotels?.map((h: any, idx: number) => (
                                   <p key={idx} className="text-sm font-medium text-foreground opacity-70 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-institutional-blue opacity-50 shrink-0" /> 
                                     {typeof h === 'object' ? (h.name || 'Hotel') : h}
                                   </p>
                                 ))}
                               </div>
                             </div>
                           </div>
                         </div>
                      </div>

                      {/* [UI] "Strategic Risk Controls / Forensic Contingency Plan" → "Things to Watch Out For / Backup Plan" */}
                      <div className="p-6 sm:p-10 bg-surface rounded-modal border border-border/40 shadow-institutional w-full max-w-full overflow-hidden">
                         <div className="flex items-center gap-5 mb-8 text-foreground">
                            <div className="h-12 w-12 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
                               <Zap className="h-6 w-6 text-institutional-blue" />
                            </div>
                            <div>
                               <p className="text-base font-semibold leading-none">Things to Watch Out For</p>
                               <p className="text-muted-foreground text-xs font-medium mt-1">Backup Plan</p>
                            </div>
                         </div>
                         <div className="space-y-4">
                           {p.riskManagement?.contingency?.map((c: any, i: number) => (
                             <div key={i} className="flex items-start sm:items-center gap-4 text-sm font-medium text-foreground group/risk bg-background p-4 rounded-xl border border-border/40 shadow-inner hover:border-institutional-blue/20 transition-all duration-300">
                               <div className="h-2 w-2 mt-1 sm:mt-0 rounded-full bg-institutional-blue opacity-30 shrink-0 group-hover/risk:opacity-100 transition-opacity" />
                               <span className="flex-1 min-w-0 break-words whitespace-normal leading-snug">{typeof c === 'object' ? (c.desc || c.name || 'Keep this in mind') : (c || 'Keep this in mind')}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-6 md:px-12 lg:px-20 mt-12 space-y-6">
            <div className="p-8 bg-surface border border-border/40 rounded-modal text-center shadow-premium">
                <p className="text-xs font-medium text-muted-foreground mb-3 opacity-60">Disclaimer</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto opacity-70">BachatKaro trip planning is advisory. Verify all pricing and logistics independently before making bookings.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 🌟 PHASE 2: IN-APP WEBVIEW CONTINUITY DIALOG */}
    <Dialog open={webViewOpen} onOpenChange={setWebViewOpen}>
      <DialogContent className="fixed top-0 left-0 w-screen h-screen max-w-none p-0 bg-background border-none z-[110] flex flex-col animate-in fade-in zoom-in-95 duration-500">
        <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-surface shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setWebViewOpen(false)} className="h-10 w-10 text-foreground hover:bg-background border border-transparent hover:border-border/60 rounded-full transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Partner Resource</p>
              <p className="text-sm font-semibold text-foreground truncate max-w-[240px]">{activeUrl}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(activeUrl, '_blank')} className="bg-background border-border/60 text-foreground hover:bg-surface hover:border-institutional-blue/20 rounded-xl text-xs font-medium h-10 px-5 shadow-sm transition-all">
            Open in Browser <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="flex-1 relative bg-surface">
          <iframe 
            src={activeUrl} 
            className="w-full h-full border-none"
            title="Affiliate Portal"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center text-center p-12 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-background/95">
            <div className="max-w-md space-y-6">
              <div className="p-8 bg-surface rounded-modal border border-border/60 w-fit mx-auto shadow-sm">
                <Globe className="h-16 w-16 text-muted-foreground opacity-40" />
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-foreground">Couldn't load page</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">This site may not allow in-app previews. Use the button above to open it in your browser.</p>
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
