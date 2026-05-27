// src/components/groups/TripAdvisor.tsx
// 🛡️ LOGIC LOCK: 10-Point Executive Blueprint, Smart Destination Detector, Map Links & Warning Fixes.
// 📱💻 RESPONSIVE MASTERCLASS: Mobile-first (Compact) -> Desktop-optimized (Spacious).

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Share2, MapPin, Sparkles, CheckCircle2, AlertTriangle, Map as MapIcon, Navigation, Building, Clock, Star, ExternalLink, Zap } from 'lucide-react';
import { tripPlannerService } from '@/services/tripPlanner';
import { useQuery } from '@tanstack/react-query';

// 🌍 100+ Top Destinations to auto-detect a valid trip
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
  'mahabalipuram', 'kochi', 'trivandrum', 'alleppey', 'sultanpur', 'lucknow', 'kanpur', 'prayagraj', 'patna'
];

// 🛑 Strict Blacklist for expenses
const BLACKLIST = ['rent', 'bill', 'purchase', 'emi', 'salary', 'grocery', 'paid', 'due', 'expense', 'split', 'settle', 'loan', 'fee', 'hisaab', 'kharcha', 'udhaar', 'maid', 'cook', 'petrol', 'amazon', 'flipkart'];

const TripAdvisor = ({ open, onOpenChange, groupId, group: propGroup }: any) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState('5');
  const [totalBudget, setTotalBudget] = useState('25000'); 
  const [targetDestination, setTargetDestination] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [manualOverride, setManualOverride] = useState(false);

  const { data: fetchedGroup } = useQuery({ 
    queryKey: ['group', groupId], 
    queryFn: async () => { const { data } = await supabase.from('groups').select('*').eq('id', groupId).single(); return data; }, 
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

  // 🧠 SMART DETECTOR LOGIC: Place = Plan, No Place = Expense
  const isTravelGroup = useMemo(() => {
    if (manualOverride) return true; 

    const lowerName = groupName.toLowerCase();

    // 1. Direct Block if it contains expense words
    if (BLACKLIST.some(k => lowerName.includes(k))) return false;

    // 2. Check if a valid place exists in the name
    const hasPlace = KNOWN_PLACES.some(place => lowerName.includes(place));

    // 3. If it contains generic words but NO place, BLOCK IT!
    const genericTerms = ['honeymoon', 'friends', 'trip', 'tour', 'vacation', 'holiday', 'weekend', 'party', 'family'];
    const hasGenericTerm = genericTerms.some(term => lowerName.includes(term));

    if (hasPlace) return true; 
    if (hasGenericTerm && !hasPlace) return false; 

    return false; 
  }, [groupName, manualOverride]);

  const perPersonCost = useMemo(() => {
    const mems = parseInt(members) || 1;
    const total = parseInt(totalBudget) || 0;
    return Math.round(total / mems);
  }, [members, totalBudget]);

  const isLowBudget = perPersonCost < 2500;
  const p = useMemo(() => tripPlan?.plan_data, [tripPlan]);

  const handleGenerate = async () => {
    if (!targetDestination.trim() || targetDestination.toLowerCase() === 'honeymoon' || targetDestination.toLowerCase() === 'friends') {
      toast({ title: "Valid Destination Required", description: "Please enter a real place name (e.g. Goa, Manali).", variant: 'destructive' });
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
      toast({ title: "Blueprint Ready!", className: "bg-emerald-600 text-white" });
    } catch (error: any) { 
      toast({ title: "Error", description: error.message, variant: 'destructive' }); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  // 🚀 VIRAL WHATSAPP SHARE LOGIC (With Emojis & Map Links)
  const handleWhatsAppShare = async () => {
    if (!p) return;
    
    try {
      // TASK 1: CREATE TOKEN ON INVITE
      const token = crypto.randomUUID();
      
      if (import.meta.env.DEV) {
        console.log("[NEW TOKEN CREATED]", token);
      }

      const { error: insertError } = await supabase.from("group_share_links").insert({
        group_id: groupId,
        token: token,
        created_at: new Date().toISOString(),
        used: false,
        created_by: user?.id
      });

      if (insertError) {
        console.error("❌ [Share] Token Insertion Failed:", insertError);
        toast({ title: "Invite Error", description: "Failed to secure an invite link. Please try again.", variant: "destructive" });
        return;
      }

      const appUrl = `${window.location.origin}/join?token=${token}`;

      // 🌍 Helper Function: Creates a direct Google Maps search link
      const getMapLink = (query: string) => `https://maps.google.com/?q=$${encodeURIComponent(query + ' ' + targetDestination)}`;
      
      const msg = `✈️ *EXECUTIVE BLUEPRINT: ${targetDestination.toUpperCase()} TRIP* 🌴

Hey team! Check out our smart trip plan generated via BachatKaro App:

1️⃣ 📊 *Executive Overview*
This is a ready-to-execute ${targetDestination} trip blueprint.
✔ Balanced: fun + adventure + relax
✔ Optimized: budget + time + comfort
👉 Ideal Duration: ${p.overview?.duration || 'TBD'}
👉 Best Fit: ${p.overview?.bestFit || 'TBD'}

2️⃣ 👥 *Assumptions*
• Group: ${p.assumptions?.group || 'TBD'}
• Budget Target: ${p.assumptions?.budgetTarget || 'TBD'}
• Travel Mode: ${p.assumptions?.travelMode || 'TBD'}

3️⃣ ✈️ *Travel Plan*
🛫 *Flight:* ${p.travelPlan?.flight?.route || 'TBD'} (Avg Fare: ${p.travelPlan?.flight?.fare || 'TBD'})
👉 ${p.travelPlan?.flight?.postLanding || 'Standard arrival protocol'}
🚆 *Train:* ${p.travelPlan?.train?.route || 'TBD'} (Cost: ${p.travelPlan?.train?.fare || 'TBD'})

4️⃣ 🏨 *Stay Strategy*
📍 ${p.stayStrategy?.location || 'TBD'} (${p.stayStrategy?.areas || 'TBD'})
🛏️ *Hotels:*
${p.stayStrategy?.hotels?.map((h: any) => `• ${typeof h === 'object' ? (h.name || 'Hotel') : h}\n  🗺️ Map: ${getMapLink(typeof h === 'object' ? (h.mapQuery || h.name) : h)}`).join('\n')}
👉 Avg Cost: ${p.stayStrategy?.avgCost || 'TBD'}

5️⃣ 🗺️ *Itinerary Highlights*
${p.itinerary?.map((d: any) => `🔹 *Day ${d.day} — ${d.title}*\n${d.activities?.map((act: any) => `📍 ${typeof act === 'object' ? (act.desc || act.name) : act}\n   🗺️ Map: ${getMapLink(typeof act === 'object' ? (act.mapQuery || act.name || act.desc) : act)}`).join('\n')}\n💰 Daily Budget: ${d.dailyBudget}`).join('\n\n')}

6️⃣ 🚕 *Local Transport*
👉 Best Option: ${p.transportStrategy?.bestOption || 'TBD'}
👉 Backup: ${p.transportStrategy?.backup || 'TBD'}

7️⃣ 🍕 *Food Strategy (Must Try)*
🍛 ${p.foodStrategy?.mustTry?.join(', ') || 'Local cuisine'}
👉 Avg Cost/day: ${p.foodStrategy?.avgCost || 'TBD'}

8️⃣ 📊 *Cost Breakdown*
Travel: ${p.costBreakdown?.travel || 'TBD'} | Stay: ${p.costBreakdown?.stay || 'TBD'} | Food: ${p.costBreakdown?.food || 'TBD'}
👉 *Total: ${p.costBreakdown?.total || 'TBD'}*

🔟 ✅ *Final Execution Checklist*
${p.checklist?.map((c: string) => `✔ ${c}`).join('\n')}

🔗 *Join the group to track expenses:*
${appUrl}`;

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (e: any) {
      console.error("❌ [Share] System Error:", e);
      toast({ title: "Invite Error", description: "Could not generate a secure link.", variant: "destructive" });
    }
  };

  const handleManualOverride = () => {
    setManualOverride(true);
    setTargetDestination(''); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-background rounded-[2.5rem] border border-border shadow-2xl z-50 max-h-[92vh] flex flex-col outline-none">
        
        {/* Radix UI Accessibility Fixes */}
        <DialogTitle className="sr-only">Executive Blueprint Planner</DialogTitle>
        <DialogDescription className="sr-only">Plan your next trip and calculate budget.</DialogDescription>

        {/* 📱 Mobile visual handle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#111111]/20 rounded-full z-20 md:hidden" />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 md:pb-12">
          
          <div className="relative pt-12 pb-6 md:pt-16 md:pb-8 bg-gradient-to-b from-purple-900/10 to-transparent">
             <div className="text-center mb-6 md:mb-8">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#666666] mb-1 md:mb-2">EXECUTIVE BLUEPRINT</h3>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-[#111111] truncate px-4" style={{ textShadow: "0 0 10px #FF007A, 0 0 20px #FF007A" }}>
                  {targetDestination || groupName}
                </h2>
             </div>

             {/* 🛑 BLOCKED EXPENSE UI */}
             {!isTravelGroup ? (
               <div className="px-6 md:px-12 py-10 text-center animate-in fade-in">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 md:p-8">
                    <p className="text-emerald-400 font-black text-lg md:text-2xl italic mb-2 tracking-tighter">No trip plan for this. Enjoy! 🚀</p>
                    <p className="text-[#666666] text-[10px] md:text-xs uppercase font-bold mt-2">Manage your group expenses wisely.</p>
                  </div>
                  
                  {/* 🌍 FALLBACK: Manual Override Button */}
                  <div className="mt-8 pt-6 border-t border-border max-w-sm mx-auto">
                     <p className="text-[#666666] text-xs font-bold mb-3">Wait, is this actually a trip?</p>
                     <Button onClick={handleManualOverride} variant="outline" className="w-full bg-surface border-border text-[#111111] rounded-xl h-12">
                       <MapIcon className="w-4 h-4 mr-2" /> Yes, let me add the destination
                     </Button>
                  </div>
               </div>
             ) : (
               /* ✈️ TRAVEL PLANNER UI */
               <div className="px-6 md:px-12 lg:px-20 space-y-4 md:space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#666666] text-[10px] md:text-xs font-black uppercase ml-1">📍 Where to?</Label>
                      <Input value={targetDestination} onChange={(e) => setTargetDestination(e.target.value)} placeholder="Enter a City/Place" className="bg-surface border-border text-[#111111] h-12 md:h-14 rounded-xl font-bold text-sm md:text-base px-4" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#666666] text-[10px] md:text-xs font-black uppercase ml-1">👥 Members</Label>
                      <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-surface border-border text-[#111111] h-12 md:h-14 rounded-xl font-bold text-sm md:text-base px-4" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#666666] text-[10px] md:text-xs font-black uppercase ml-1">💰 Total Budget</Label>
                      <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-surface border-border text-[#111111] h-12 md:h-14 rounded-xl font-bold text-sm md:text-base px-4" />
                    </div>
                 </div>

                 <div className={`flex items-center gap-2 text-xs md:text-sm font-black px-2 ${isLowBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                   {isLowBudget ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                   {isLowBudget 
                     ? `⚠️ Very Low! Just ₹${perPersonCost}/head. Bhai budget badao ya dharamshala mein ruko!` 
                     : `👉 Great! Per Person Budget: ₹${perPersonCost}`}
                 </div>

                 <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 md:h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 text-sm md:text-lg uppercase tracking-tight mt-2">
                   {isGenerating ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : <Sparkles className="h-4 w-4 md:h-6 md:w-6 mr-2 md:mr-3" />}
                   {isGenerating ? "Generating Blueprint..." : "Create Blueprint 🚀"}
                 </Button>
               </div>
             )}
          </div>

          {/* ✨ 10-POINT EXECUTIVE UI */}
          {p && (
            <div className="px-6 md:px-12 lg:px-20 space-y-6 md:space-y-8 mt-4 md:mt-8 animate-in fade-in duration-500 text-[#111111]/90">
               
               {/* 🗺️ LIVE GOOGLE MAP EMBED */}
               <section className="space-y-3 md:space-y-5">
                  <h4 className="text-[10px] md:text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="h-3 w-3 md:h-5 md:w-5" /> Destination Map
                  </h4>
                  <div className="w-full h-48 md:h-72 bg-surface rounded-2xl md:rounded-3xl overflow-hidden border border-border relative">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                      loading="lazy" 
                      allowFullScreen 
                      src={`https://maps.google.com/maps?q=$${encodeURIComponent(targetDestination)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border rounded-2xl md:rounded-3xl"></div>
                  </div>
               </section>

               {/* 1 & 2: Overview & Assumptions */}
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="p-5 bg-surface rounded-2xl border border-border">
                   <h4 className="text-xs font-black text-pink-400 uppercase mb-3">1️⃣ Executive Overview</h4>
                   <ul className="text-sm space-y-2">
                     <li>✔ Balanced: fun + adventure + relax</li>
                     <li>👉 Duration: {typeof p.overview?.duration === 'object' ? (p.overview.duration.name || 'TBD') : (p.overview?.duration || 'TBD')}</li>
                     <li>👉 Best Fit: {typeof p.overview?.bestFit === 'object' ? (p.overview.bestFit.name || 'TBD') : (p.overview?.bestFit || 'TBD')}</li>
                   </ul>
                 </div>
                 <div className="p-5 bg-surface rounded-2xl border border-border">
                   <h4 className="text-xs font-black text-pink-400 uppercase mb-3">2️⃣ Assumptions</h4>
                   <ul className="text-sm space-y-2">
                     <li>• Group: {typeof p.assumptions?.group === 'object' ? (p.assumptions.group.name || 'TBD') : (p.assumptions?.group || 'TBD')}</li>
                     <li>• Target: {typeof p.assumptions?.budgetTarget === 'object' ? (p.assumptions.budgetTarget.name || 'TBD') : (p.assumptions?.budgetTarget || 'TBD')}</li>
                     <li>• Mode: {typeof p.assumptions?.travelMode === 'object' ? (p.assumptions.travelMode.name || 'TBD') : (p.assumptions?.travelMode || 'TBD')}</li>
                   </ul>
                 </div>
               </div>

               {/* 3 & 4: Travel & Stay */}
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="p-5 bg-surface rounded-2xl border border-border">
                   <h4 className="text-xs font-black text-indigo-400 uppercase mb-3">3️⃣ Travel Plan</h4>
                   <p className="text-sm font-bold">✈️ Flight Route: {typeof p.travelPlan?.flight?.route === 'object' ? (p.travelPlan.flight.route.name || 'TBD') : (p.travelPlan?.flight?.route || 'TBD')}</p>
                   <p className="text-xs text-[#666666] mb-2">{typeof p.travelPlan?.flight?.postLanding === 'object' ? (p.travelPlan.flight.postLanding.desc || 'Standard arrival protocol') : (p.travelPlan?.flight?.postLanding || 'Standard arrival protocol')}</p>
                   <p className="text-sm font-bold">🚆 Train Route: {typeof p.travelPlan?.train?.route === 'object' ? (p.travelPlan.train.route.name || 'TBD') : (p.travelPlan?.train?.route || 'TBD')}</p>
                 </div>
                 <div className="p-5 bg-surface rounded-2xl border border-border">
                   <h4 className="text-xs font-black text-indigo-400 uppercase mb-3">4️⃣ Stay Strategy</h4>
                   <p className="text-sm font-bold">🟡 {typeof p.stayStrategy?.location === 'object' ? (p.stayStrategy.location.name || 'TBD') : (p.stayStrategy?.location || 'TBD')}</p>
                   <p className="text-xs text-[#666666] mb-2">Areas: {typeof p.stayStrategy?.areas === 'object' ? (p.stayStrategy.areas.name || 'Optimized') : (p.stayStrategy?.areas || 'Optimized')}</p>
                   <p className="text-xs font-bold text-indigo-300">Hotels: {p.stayStrategy?.hotels?.map((h: any) => (typeof h === 'object' ? (h.name || 'Hotel') : h)).join(', ') || 'Selection active'}</p>
                 </div>
               </div>
               {/* 5: Itinerary */}
               <div className="space-y-4">
                 <h4 className="text-xs font-black text-emerald-400 uppercase">5️⃣ Day-Wise Premium Itinerary</h4>
                 <div className="grid gap-4">
                   {p.itinerary?.map((d: any, i: number) => (
                     <div key={i} className="p-4 bg-surface border-l-2 border-emerald-500 rounded-r-2xl">
                       <h5 className="text-sm font-black mb-2">🔹 Day {d.day} — {d.title}</h5>
                       <ul className="text-xs text-[#666666] space-y-1 mb-2">
                         {d.activities?.map((act: any, idx: number) => (
                           <li key={idx}>• {typeof act === 'object' ? (act.desc || act.name || 'Activity') : act}</li>
                         ))}
                       </ul>
                       <p className="text-[10px] font-bold text-emerald-400 uppercase">👉 Budget: {d.dailyBudget}</p>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 6, 7 & 8: Transport, Food, Cost */}
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="p-4 bg-surface rounded-2xl">
                   <h4 className="text-[10px] font-black text-yellow-400 uppercase mb-2">6️⃣ Transport</h4>
                   <p className="text-xs">• {typeof p.transportStrategy?.bestOption === 'object' ? (p.transportStrategy.bestOption.name || p.transportStrategy.bestOption.desc) : (p.transportStrategy?.bestOption || 'TBD')}</p>
                 </div>
                 <div className="p-4 bg-surface rounded-2xl">
                   <h4 className="text-[10px] font-black text-orange-400 uppercase mb-2">7️⃣ Food</h4>
                   <p className="text-xs">• {p.foodStrategy?.mustTry?.map((f: any) => (typeof f === 'object' ? f.name : f)).join(', ') || 'Local recommendations'}</p>
                 </div>
                 <div className="p-4 bg-surface rounded-2xl border border-pink-500/30 bg-pink-500/10">
                   <h4 className="text-[10px] font-black text-pink-400 uppercase mb-2">8️⃣ Total Cost</h4>
                   <p className="text-sm font-black text-[#111111]">{typeof p.costBreakdown?.total === 'object' ? p.costBreakdown.total.amount : (p.costBreakdown?.total || 'TBD')}</p>
                 </div>
               </div>

               {/* 10: Checklist */}
               <div className="p-5 bg-surface rounded-2xl border border-border">
                 <h4 className="text-xs font-black text-[#111111] uppercase mb-3">🔟 Execution Checklist</h4>
                 <div className="space-y-2">
                   {p.checklist?.map((c: string, i: number) => (
                     <div key={i} className="flex items-center gap-2 text-sm text-[#111111]/80"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {c}</div>
                   ))}
                 </div>
               </div>

               <div className="pt-4 pb-8">
                 <Button onClick={handleWhatsAppShare} className="w-full h-14 md:h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black flex items-center justify-center gap-2 shadow-lg text-sm md:text-lg">
                   <Share2 className="h-5 w-5 md:h-6 md:w-6" /> Copy Blueprint to WhatsApp
                 </Button>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripAdvisor;