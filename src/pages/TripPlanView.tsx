/**
 * TripPlanView.tsx (TripAdvisor) - BachatKaro Premium Fintech Edition
 * UI: High-Precision Institutional Planning Terminal.
 * 🛡️ LOGIC LOCK: Smart Destination Detector, Map Links & AI Generation untouched.
 * 📱💻 RESPONSIVE MASTERCLASS: Mobile-first (Compact) -> Desktop-optimized (Spacious).
 */

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Share2, Sparkles, CheckCircle2, AlertTriangle, Map as MapIcon, Navigation, Info } from 'lucide-react';
import { tripPlannerService } from '@/services/tripPlanner';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";

// 🌍 100+ Top Destinations to auto-detect a valid trip (Locked)
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

// 🛑 Strict Blacklist for expenses (Locked)
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

  // 🧠 SMART DETECTOR LOGIC (Locked)
  const isTravelGroup = useMemo(() => {
    if (manualOverride) return true; 
    const lowerName = groupName.toLowerCase();
    if (BLACKLIST.some(k => lowerName.includes(k))) return false;
    const hasPlace = KNOWN_PLACES.some(place => lowerName.includes(place));
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
      toast({ title: "Trip plan ready!", className: "bg-surface border-primary text-foreground shadow-premium" });
    } catch (error: any) { 
      toast({ title: "Error", description: error.message, variant: 'destructive' }); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  // 🚀 VIRAL WHATSAPP SHARE LOGIC (Locked)
  const handleWhatsAppShare = async () => {
    if (!p) return;
    try {
      const token = crypto.randomUUID();
      const { error: insertError } = await supabase.from("group_share_links").insert({
        group_id: groupId,
        token: token,
        created_at: new Date().toISOString(),
        used: false,
        created_by: user?.id
      });

      if (insertError) {
        if (process.env.NODE_ENV === 'development') console.error("❌ [Share] Token Insertion Failed:", insertError);
        toast({ title: "Invite Error", description: "Failed to secure an invite link. Please try again.", variant: "destructive" });
        return;
      }

      const appUrl = `${window.location.origin}/join?token=${token}`;
      const getMapLink = (query: string) => `https://maps.google.com/?q=$${encodeURIComponent(query + ' ' + targetDestination)}`;
      
      const msg = `✈️ *TRIP PLAN: ${targetDestination.toUpperCase()} TRIP* 🌴

Hey team! Check out our smart trip plan generated via BachatKaro App:

1️⃣ 📊 *Overview*
Smart trip plan for ${targetDestination}.
✔ Balanced: fun + adventure + relax
✔ Covered: budget + time + comfort
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
      if (process.env.NODE_ENV === 'development') console.error("❌ [Share] System Error:", e);
      toast({ title: "Invite Error", description: "Could not generate a secure link.", variant: "destructive" });
    }
  };

  const handleManualOverride = () => {
    setManualOverride(true);
    setTargetDestination(''); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-[50%] translate-x-[-50%] translate-y-0 w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 bg-background rounded-modal border border-border shadow-institutional z-50 flex flex-col outline-none overflow-hidden"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 70px)', maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 140px)' }}
      >
        
        <DialogTitle className="sr-only">Trip Planner</DialogTitle>
        <DialogDescription className="sr-only">Plan your next trip and calculate budget.</DialogDescription>

        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary z-20" />

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 md:pb-12">
          
          <div className="relative pt-10 pb-6 md:pt-12 md:pb-8 bg-surface border-b border-border/50">
             <div className="text-center px-6">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Destination Intelligence</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground truncate">
                  {targetDestination || groupName}
                </h2>
             </div>

             {/* 🛑 BLOCKED EXPENSE UI */}
             {!isTravelGroup ? (
               <div className="px-6 md:px-12 py-10 text-center animate-in fade-in">
                  <div className="bg-muted/20 border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm max-w-md mx-auto">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-foreground font-bold text-lg md:text-xl tracking-tight mb-2">No valid trip destination detected.</p>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest leading-relaxed">Proceed to manage group settlements.</p>
                  </div>
                  
                  {/* 🌍 FALLBACK: Manual Override Button */}
                  <div className="mt-8 pt-6 border-t border-border/50 max-w-sm mx-auto">
                     <p className="text-muted-foreground text-[10px] font-bold mb-3 uppercase tracking-widest">Wait, is this actually a trip?</p>
                     <Button onClick={handleManualOverride} variant="outline" className="w-full bg-surface border-border text-foreground rounded-xl h-12 hover:bg-muted font-bold uppercase text-[11px] tracking-widest shadow-sm active:scale-95 transition-all">
                       <MapIcon className="w-4 h-4 mr-2 text-primary" /> Yes, set destination
                     </Button>
                  </div>
               </div>
             ) : (
               /* ✈️ TRAVEL PLANNER UI */
               <div className="px-6 md:px-12 lg:px-20 space-y-5 md:space-y-6 mt-6 md:mt-8">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest flex items-center gap-1.5">
                        <MapIcon size={12} className="text-primary/60" /> Target
                      </Label>
                      <Input value={targetDestination} onChange={(e) => setTargetDestination(e.target.value)} placeholder="e.g. Goa, Manali" className="bg-muted/20 border-border/50 text-foreground h-12 md:h-14 rounded-xl font-bold text-sm md:text-base px-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest">Members</Label>
                      <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-muted/20 border-border/50 text-foreground h-12 md:h-14 rounded-xl font-bold font-mono text-sm md:text-base px-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest">Total Budget</Label>
                      <div className="relative group">
                        <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-muted/20 border-border/50 text-foreground h-12 md:h-14 rounded-xl font-bold font-mono text-sm md:text-base pl-9 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-sm" />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground group-focus-within:text-primary">₹</span>
                      </div>
                    </div>
                 </div>

                 <div className={cn(
                   "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border w-fit mx-auto transition-all shadow-sm",
                   isLowBudget
                     ? "bg-warning/5 text-warning border-warning/20"
                     : "bg-income/5 text-income border-income/20"
                 )}>
                   {isLowBudget ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                   {isLowBudget
                     ? `Tight Allocation · ₹${perPersonCost.toLocaleString()}/person`
                     : `₹${perPersonCost.toLocaleString()} per person`}
                 </div>
                 <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 md:h-14 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest rounded-xl shadow-premium active:scale-[0.98] transition-all hover:opacity-90 mt-2 disabled:opacity-50">
                   {isGenerating ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />}
                   {isGenerating ? "Analyzing Logistics…" : "Generate Intelligence"}
                 </Button>
               </div>
             )}
          </div>

          {/* ✨ GENERATED PLAN */}
          {p && (
            <div className="px-6 md:px-12 lg:px-20 space-y-6 md:space-y-8 mt-6 md:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground">
               
               {/* 🗺️ LIVE GOOGLE MAP EMBED */}
               <section className="space-y-3 md:space-y-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5" /> Destination Map
                  </h4>
                  <div className="w-full h-48 md:h-72 bg-muted/20 rounded-2xl overflow-hidden border border-border/50 relative shadow-inner">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      loading="lazy" 
                      allowFullScreen 
                      src={`https://maps.google.com/maps?q=$${encodeURIComponent(targetDestination)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/50 rounded-2xl"></div>
                  </div>
               </section>

               {/* 1 & 2: Overview & Assumptions */}
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm hover:border-primary/20 transition-colors group">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest">1. Overview</h4>
                   <ul className="text-sm space-y-2 font-medium text-foreground leading-relaxed">
                     <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-income" /> Balanced: fun + adventure + relax</li>
                     <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary" /> Duration: {typeof p.overview?.duration === 'object' ? (p.overview.duration.name || 'TBD') : (p.overview?.duration || 'TBD')}</li>
                     <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary" /> Best Fit: {typeof p.overview?.bestFit === 'object' ? (p.overview.bestFit.name || 'TBD') : (p.overview?.bestFit || 'TBD')}</li>
                   </ul>
                 </div>
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm hover:border-primary/20 transition-colors group">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest">2. Parameters</h4>
                   <ul className="text-sm space-y-2 font-medium text-foreground leading-relaxed">
                     <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary" /> Group: {typeof p.assumptions?.group === 'object' ? (p.assumptions.group.name || 'TBD') : (p.assumptions?.group || 'TBD')}</li>
                     <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary" /> Target: {typeof p.assumptions?.budgetTarget === 'object' ? (p.assumptions.budgetTarget.name || 'TBD') : (p.assumptions?.budgetTarget || 'TBD')}</li>
                     <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary" /> Mode: {typeof p.assumptions?.travelMode === 'object' ? (p.assumptions.travelMode.name || 'TBD') : (p.assumptions?.travelMode || 'TBD')}</li>
                   </ul>
                 </div>
               </div>

               {/* 3 & 4: Travel & Stay */}
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest">3. Logistics</h4>
                   <p className="text-sm font-bold tracking-tight">Flight: {typeof p.travelPlan?.flight?.route === 'object' ? (p.travelPlan.flight.route.name || 'TBD') : (p.travelPlan?.flight?.route || 'TBD')}</p>
                   <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-widest mt-0.5">{typeof p.travelPlan?.flight?.postLanding === 'object' ? (p.travelPlan.flight.postLanding.desc || 'Standard arrival') : (p.travelPlan?.flight?.postLanding || 'Standard arrival')}</p>
                   <p className="text-sm font-bold tracking-tight pt-3 border-t border-border/40">Train: {typeof p.travelPlan?.train?.route === 'object' ? (p.travelPlan.train.route.name || 'TBD') : (p.travelPlan?.train?.route || 'TBD')}</p>
                 </div>
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest">4. Accommodation</h4>
                   <p className="text-sm font-bold tracking-tight">Location: {typeof p.stayStrategy?.location === 'object' ? (p.stayStrategy.location.name || 'TBD') : (p.stayStrategy?.location || 'TBD')}</p>
                   <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-widest mt-0.5">Zones: {typeof p.stayStrategy?.areas === 'object' ? (p.stayStrategy.areas.name || 'Covered') : (p.stayStrategy?.areas || 'Covered')}</p>
                   <div className="mt-3 pt-3 border-t border-border/40">
                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Recommendations</p>
                     <p className="text-xs font-semibold leading-relaxed">{p.stayStrategy?.hotels?.map((h: any) => (typeof h === 'object' ? (h.name || 'Hotel') : h)).join(', ') || 'Processing'}</p>
                   </div>
                 </div>
               </div>

               {/* 5: Itinerary */}
               <div className="space-y-4">
                 <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">5. Itinerary Matrix</h4>
                 <div className="grid gap-3">
                   {p.itinerary?.map((d: any, i: number) => (
                     <div key={i} className="p-5 bg-surface border-l-[3px] border-primary rounded-r-2xl shadow-sm">
                       <h5 className="text-sm font-bold mb-3 tracking-tight">Day {d.day} — {d.title}</h5>
                       <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 font-medium">
                         {d.activities?.map((act: any, idx: number) => (
                           <li key={idx} className="flex items-start gap-2"><span className="text-primary/40">•</span> <span className="flex-1">{typeof act === 'object' ? (act.desc || act.name || 'Activity') : act}</span></li>
                         ))}
                       </ul>
                       <div className="inline-flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/50">
                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Allocation</span>
                         <span className="text-xs font-bold font-mono text-foreground">{d.dailyBudget}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 6, 7 & 8: Transport, Food, Cost */}
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">6. Transit</h4>
                   <p className="text-sm font-medium leading-relaxed">{typeof p.transportStrategy?.bestOption === 'object' ? (p.transportStrategy.bestOption.name || p.transportStrategy.bestOption.desc) : (p.transportStrategy?.bestOption || 'TBD')}</p>
                 </div>
                 <div className="p-5 bg-surface rounded-2xl border border-border/60 shadow-sm">
                   <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">7. Culinary</h4>
                   <p className="text-sm font-medium leading-relaxed">{p.foodStrategy?.mustTry?.map((f: any) => (typeof f === 'object' ? f.name : f)).join(', ') || 'Local recommendations'}</p>
                 </div>
                 <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl shadow-sm flex flex-col justify-center">
                   <h4 className="text-[10px] font-bold text-primary uppercase mb-2 tracking-widest">8. Total Estimate</h4>
                   <p className="text-2xl font-bold font-mono tracking-tighter tabular-nums leading-none text-foreground">{typeof p.costBreakdown?.total === 'object' ? p.costBreakdown.total.amount : (p.costBreakdown?.total || 'TBD')}</p>
                 </div>
               </div>

               {/* 10: Checklist */}
               <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 shadow-inner">
                 <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">Pre-Execution Protocol</h4>
                 <div className="space-y-2.5">
                   {p.checklist?.map((c: string, i: number) => (
                     <div key={i} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                       <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> 
                       <span className="leading-snug">{c}</span>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="pt-6 pb-4">
                 <Button onClick={handleWhatsAppShare} className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-premium active:scale-95 transition-all">
                   <Share2 className="h-4 w-4" /> Share WhatsApp Briefing
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
