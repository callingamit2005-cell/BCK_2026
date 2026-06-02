/**
 * AdvancedTripPlannerV2.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Travel Logistics Terminal.
 * 🛡️ LOGIC LOCK: Live Map + GPS Turn-by-Turn Navigation Engine untouched.
 * 👑 ENTERPRISE PERMISSIONS: Admin (Full Control) | Member (Read-Only Plan) | Guest (View Only)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { advancedTripService } from '@/services/advancedTripPlanner';
import { SpinWheel } from '@/components/groups/SpinWheel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, MapPin, Share2, MousePointerClick, Navigation, Map as MapIcon, ShieldCheck, ArrowLeft } from 'lucide-react';
import { tSafe } from '@/i18n';
import { cn } from "@/lib/utils";

const MOCK_MEMBERS = ['Amit', 'Rahul', 'Priya', 'Neha', 'Rohan'];

export default function AdvancedTripPlannerV2({ isSharedLink = false }: { isSharedLink?: boolean }) {
  const { user } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // 🛡️ PERMISSION ENGINE FETCH
  const { data: userRole } = useQuery({
    queryKey: ['group-role', groupId, user?.id],
    enabled: !!groupId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user?.id)
        .single();
      return data?.role || null;
    }
  });

  // 🔐 Access Flags
  const isGuest = isSharedLink && !user; 
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const canEditPlan = isAdmin && !isGuest; 

  // Form State
  const [origin, setOrigin] = useState('Sultanpur'); 
  const [destination, setDestination] = useState('');
  const [members, setMembers] = useState('4');
  const [totalBudget, setTotalBudget] = useState('25000');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('Hinglish');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  
  // 🗺️ Live Map State
  const [activeMapQuery, setActiveMapQuery] = useState('');

  const handleGeneratePlan = async () => {
    if (!canEditPlan) {
      toast({ title: "Access Denied", description: "Administrator execution required.", variant: "destructive" });
      return;
    }

    if (!destination.trim() || !origin.trim()) {
      toast({ title: "Details Missing", description: "Origin and Destination vectors required.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      if (!groupId) {
        toast({ title: "Invalid Context", description: "Select or initialize a group environment first.", variant: "destructive" });
        return;
      }
      if (!user?.id) {
        toast({ title: "Session Error", description: "Authentication layer failure.", variant: "destructive" });
        return;
      }

      const result = await advancedTripService.generatePlan({
        destination, origin, members: parseInt(members) || 1, totalBudget: parseInt(totalBudget) || 0,
        language, groupId: groupId, userId: user.id
      });
      
      setPlan(result);
      setActiveMapQuery(destination); 
      toast({ title: "Logistics Compiled!", className: "bg-surface border-primary text-foreground shadow-premium" });
    } catch (error: any) {
      toast({ title: "Compilation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
      if(!plan || !plan.plan_data) return;
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
          toast({ title: "Distribution Error", description: "Failed to secure an invite link.", variant: "destructive" });
          return;
        }

        const text = plan.plan_data.whatsapp_share_text + `\n\n👉 Connect to Intelligence Network:\n${window.location.origin}/join?token=${token}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } catch (e: any) {
        if (process.env.NODE_ENV === 'development') console.error("❌ [Share] System Error:", e);
        toast({ title: "Distribution Error", description: "Could not generate a secure link.", variant: "destructive" });
      }
  };

  // 🚗 GPS LIVE NAVIGATION ENGINE 
  const startLiveNavigation = (targetPlace: string) => {
    if (!targetPlace) return;
    
    if (navigator.geolocation) {
        toast({ title: "GPS Initialized", description: "Acquiring coordinates...", className: "bg-surface border-primary text-foreground shadow-premium" });
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const navUrl = `https://www.google.com/maps/dir/?api=1&origin=$${lat},${lng}&destination=${encodeURIComponent(targetPlace)}&travelmode=driving&dir_action=navigate`;
                window.open(navUrl, '_blank');
            },
            () => {
                toast({ title: "GPS Error", description: "Telemetry access denied. Utilizing default routing.", variant: "destructive" });
                const navUrl = `https://www.google.com/maps/dir/?api=1&destination=$${encodeURIComponent(targetPlace)}&travelmode=driving&dir_action=navigate`;
                window.open(navUrl, '_blank');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        toast({ title: "Hardware Error", description: "Device lacks GPS telemetry support.", variant: "destructive" });
    }
  };

  const currentMapQuery = activeMapQuery || destination;
  const inputStyle = "h-14 rounded-xl bg-muted/20 border-border/50 text-foreground font-semibold focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm px-4";

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 antialiased">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 🛡️ Institutional Back Navigation */}
        <div className="flex justify-start mb-2">
           <button 
             onClick={() => navigate(-1)}
             className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-[0.2em] transition-all group"
           >
             <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
             Back to Console
           </button>
        </div>

        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full shadow-sm mb-2">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Logistics Engine V2</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-none">
             Executive <span className="text-primary">Blueprint</span>
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-80">Forensic Budget Logistics · AI Optimized</p>
          
          {/* 🛡️ Smart Badges */}
          <div className="flex justify-center gap-3 mt-6">
            {isGuest && <span className="text-[9px] bg-muted/50 text-muted-foreground px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-border/50 shadow-sm">Guest Mode</span>}
            {isMember && <span className="text-[9px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-primary/20 shadow-sm flex items-center gap-1.5"><ShieldCheck className="w-3 h-3"/> Standard Access</span>}
            {isAdmin && <span className="text-[9px] bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-premium flex items-center gap-1.5">👑 Administrator</span>}
          </div>
        </div>

        {/* 🚀 Planner Form */}
        {!isGuest && !plan && (
            <div className="fintech-card p-6 sm:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                
                {/* Visual Lock for Members */}
                {!canEditPlan && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border/50 flex items-center justify-center shadow-institutional mb-5">
                       <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-foreground font-bold tracking-widest uppercase text-[10px] text-center leading-relaxed">System Locked <br /><span className="text-muted-foreground opacity-80">Admin execution required</span></p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-0">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary/60"/> Origin Vector
                    </Label>
                    <Input disabled={!canEditPlan} value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputStyle} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary"/> Destination Target
                    </Label>
                    <Input disabled={!canEditPlan} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Goa, Ayodhya" className={cn(inputStyle, "focus:border-primary/50")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest">Team Size</Label>
                    <Input disabled={!canEditPlan} type="number" value={members} onChange={(e) => setMembers(e.target.value)} className={inputStyle} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest">Max Allocation (₹)</Label>
                    <Input disabled={!canEditPlan} type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className={inputStyle} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase ml-1 tracking-widest">Output Syntax</Label>
                    <div className="flex gap-2 h-14 bg-muted/20 p-1.5 rounded-xl border border-border/50 shadow-inner">
                      {['English', 'Hindi', 'Hinglish'].map((lang: any) => (
                        <button key={lang} disabled={!canEditPlan} onClick={() => setLanguage(lang)}
                          className={cn(
                            "flex-1 h-full rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all",
                            language === lang 
                              ? 'bg-surface text-primary shadow-sm border border-primary/20' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface/50'
                          )}>
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={isGenerating || !canEditPlan} 
                  className="w-full h-16 bg-primary text-primary-foreground font-bold rounded-xl text-[11px] uppercase tracking-[0.2em] relative z-0 shadow-premium hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2.5" /> : <Sparkles className="h-5 w-5 mr-2.5" />}
                    {isGenerating ? "Compiling Logistics..." : "Deploy Blueprint"}
                </Button>
            </div>
        )}

        {/* ✨ GENERATED PLAN */}
        {plan && plan.plan_data && (
          <div className="space-y-8 animate-in fade-in duration-700">
             
             {/* 🗺️ LIVE INTERACTIVE MAP & GPS */}
             <div className="fintech-card p-5 sm:p-8 space-y-5">
                 <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <MapIcon className="h-3.5 w-3.5" /> Live Telemetry
                    </h4>
                    {activeMapQuery !== destination && (
                       <span className="text-[9px] font-bold text-muted-foreground animate-pulse flex items-center gap-1.5 uppercase tracking-widest">
                         <MousePointerClick className="w-3 h-3 text-primary" /> Tracking: {activeMapQuery.split(' in ')[0]}
                       </span>
                    )}
                 </div>
                 
                 <div className="w-full h-64 sm:h-80 bg-muted/20 rounded-xl overflow-hidden border border-border/50 relative shadow-inner">
                    <iframe 
                      width="100%" height="100%" style={{ border: 0 }} 
                      loading="lazy" allowFullScreen 
                      src={`https://maps.google.com/maps?q=$${encodeURIComponent(currentMapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/30 rounded-xl"></div>
                 </div>

                 <Button 
                    onClick={() => startLiveNavigation(currentMapQuery)} 
                    className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl shadow-premium transition-all active:scale-95 text-[11px] tracking-widest uppercase hover:opacity-90"
                 >
                    <Navigation className="mr-2.5 h-4 w-4" />
                    Initialize GPS Protocol
                 </Button>
             </div>

             <div className="grid sm:grid-cols-2 gap-6">
               <div className="fintech-card p-6 space-y-5">
                 <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Budget Matrix</h3>
                 <div className="bg-muted/20 p-5 rounded-xl border border-border/50 shadow-inner">
                    <p className="text-3xl font-bold text-foreground font-mono tracking-tighter mb-1 tabular-nums leading-none">₹{plan.plan_data.budget_breakdown?.per_person}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Verified Per Head</p>
                 </div>
                 <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2">
                        <span>Intercity</span>
                        <span className="text-foreground tracking-tight">{plan.plan_data.transport_plan?.intercity}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2">
                        <span>Local</span>
                        <span className="text-foreground tracking-tight">{plan.plan_data.transport_plan?.local}</span>
                    </div>
                 </div>
               </div>

               <div className="fintech-card p-6 space-y-5">
                 <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Verified Stays</h3>
                 <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                   {plan.plan_data.stay_options?.map((stay: any, i: number) => (
                     <button key={i} onClick={() => setActiveMapQuery((typeof stay.name === 'object' ? stay.name.name : stay.name) + ' in ' + destination)} 
                       className="w-full text-left bg-muted/10 border border-border/50 hover:border-primary/40 text-foreground text-sm font-semibold py-3.5 px-4 rounded-xl flex items-center justify-between transition-all group gap-3 shadow-sm">
                        <span className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0"/> 
                          <span className="truncate uppercase tracking-tight text-xs">{typeof stay.name === 'object' ? (stay.name.name || 'Hotel') : (stay.name || 'Hotel')}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0 font-bold">₹{typeof stay.cost_per_night === 'object' ? stay.cost_per_night.amount : stay.cost_per_night}/nt</span>
                     </button>
                   ))}
                 </div>
               </div>
             </div>

             <div className="fintech-card p-6 space-y-5">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Culinary Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {plan.plan_data.food_plan?.suggestions?.map((food: any, i: number) => (
                     <button key={i} onClick={() => setActiveMapQuery((typeof food.name === 'object' ? food.name.name : food.name) + ' restaurant in ' + destination)} 
                       className="text-left bg-muted/10 border border-border/50 hover:border-primary/40 text-foreground text-sm font-semibold p-4 rounded-xl flex items-center justify-between transition-all group gap-3 shadow-sm">
                        <span className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0"/> 
                          <span className="truncate uppercase tracking-tight text-xs">{typeof food.name === 'object' ? (food.name.name || 'Local Food') : (food.name || 'Local Food')}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0 font-bold">₹{typeof food.cost === 'object' ? food.cost.amount : food.cost}</span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-2">Deployment Schedule</h3>
                {plan.plan_data.daywise_plan?.map((day: any, i: number) => (
                  <div key={i} className="fintech-card p-6 border-l-[3px] border-l-primary">
                    <h4 className="font-bold text-lg mb-4 tracking-tight text-foreground">Day {day.day}: {typeof day.title === 'object' ? day.title.name : day.title}</h4>
                    <div className="space-y-3">
                      {day.activities?.map((act: any, idx: number) => (
                        <button key={idx} onClick={() => setActiveMapQuery((typeof act.desc === 'object' ? act.desc.name : (act.desc || act)) + ' in ' + destination)} 
                          className="w-full text-left bg-muted/10 border border-border/40 hover:border-primary/30 p-4 rounded-xl flex gap-4 text-sm transition-all group shadow-sm">
                          <span className="text-xl shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">{act.emoji || '📍'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground tracking-tight leading-snug mb-1">
                              {typeof act.time === 'object' ? act.time.name : (act.time || 'Routine')} · {typeof act.desc === 'object' ? (act.desc.name || act.desc.desc) : (act.desc || act)}
                            </p>
                            <div className="flex items-center gap-1.5">
                               <IndianRupee className="h-3 w-3 text-primary/60" />
                               <p className="text-muted-foreground font-bold text-[9px] uppercase tracking-widest">Est: ₹{typeof act.cost === 'object' ? act.cost.amount : act.cost}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {plan && (
          <div className="grid md:grid-cols-2 gap-6 mt-12 border-t border-border/50 pt-10 pb-8">
            <div className="fintech-card p-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2.5">
                   <IndianRupee className="h-5 w-5 text-primary" /> Expense Logic
                </h3>
                <div className="bg-muted/20 p-5 rounded-xl border border-border/50 shadow-inner">
                   <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                     {plan?.plan_data?.expense_split_logic || "Establish members to calculate dynamic split distribution protocol."}
                   </p>
                </div>
                {!isGuest && (
                  <Button variant="outline" className="w-full border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-sm">
                    + Track Expense
                  </Button>
                )}
            </div>
            <SpinWheel members={MOCK_MEMBERS} />
          </div>
        )}

        {!isGuest && plan && (
            <div className="pt-2 pb-16">
              <Button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-14 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-premium transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" /> Share Logistics via WhatsApp
              </Button>
            </div>
        )}

      </div>
    </div>
  );
}
