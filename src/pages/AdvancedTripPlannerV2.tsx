// src/pages/AdvancedTripPlannerV2.tsx
// 🛡️ LOGIC LOCK: Live Map + Clickable Places + GPS Turn-by-Turn Navigation Engine
// 👑 ENTERPRISE PERMISSIONS: Admin (Full Control) | Member (Read-Only Plan + Add Expense) | Guest (View Only)

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { advancedTripService } from '@/services/advancedTripPlanner';
import { SpinWheel } from '@/components/groups/SpinWheel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, MapPin, Share2, MousePointerClick, Navigation, Map as MapIcon, ShieldCheck } from 'lucide-react';

const MOCK_MEMBERS = ['Amit', 'Rahul', 'Priya', 'Neha', 'Rohan'];

export default function AdvancedTripPlannerV2({ isSharedLink = false }: { isSharedLink?: boolean }) {
  const { user } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  
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
  const canEditPlan = isAdmin && !isGuest; // Sirf Admin plan change/generate kar sakta hai

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
      toast({ title: "Access Denied", description: "Sirf Admin naya plan generate kar sakta hai.", variant: "destructive" });
      return;
    }

    if (!destination.trim() || !origin.trim()) {
      toast({ title: "Details Missing", description: "Bhai, Origin aur Destination dono daalo!", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      // 🛡️ TASK 6: ID SAFETY GUARD
      if (!groupId) {
        toast({ title: "Invalid Group", description: "Bhai, pehle group select karo ya create karo!", variant: "destructive" });
        return;
      }

      if (!user?.id) {
        toast({ title: "Session Error", description: "Bhai, login session check karo!", variant: "destructive" });
        return;
      }

      const result = await advancedTripService.generatePlan({
        destination, origin, members: parseInt(members) || 1, totalBudget: parseInt(totalBudget) || 0,
        language, groupId: groupId, userId: user.id
      });
      
      setPlan(result);
      setActiveMapQuery(destination); 
      toast({ title: "Plan Generated!", className: "bg-emerald-600 text-white" });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
      if(!plan || !plan.plan_data) return;
      
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
          created_by: userId
        });

        if (insertError) {
          console.error("❌ [Share] Token Insertion Failed:", insertError);
          toast({ title: "Invite Error", description: "Failed to secure an invite link. Please try again.", variant: "destructive" });
          return;
        }

        const text = plan.plan_data.whatsapp_share_text + `\n\n👉 Join Trip:\n${window.location.origin}/join?token=${token}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } catch (e: any) {
        console.error("❌ [Share] System Error:", e);
        toast({ title: "Invite Error", description: "Could not generate a secure link.", variant: "destructive" });
      }
  };

  // 🚗 GPS LIVE NAVIGATION ENGINE (Deep Linking to Native Maps)
  const startLiveNavigation = (targetPlace: string) => {
    if (!targetPlace) return;
    
    if (navigator.geolocation) {
        toast({ title: "GPS Tracking... 🛰️", description: "Aapki live location nikal rahe hain...", className: "bg-blue-600 border-none text-white" });
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // Standard Google Maps Deep Link for Navigation
                const navUrl = `https://www.google.com/maps/dir/?api=1&origin=$${lat},${lng}&destination=${encodeURIComponent(targetPlace)}&travelmode=driving&dir_action=navigate`;
                window.open(navUrl, '_blank');
            },
            (error) => {
                toast({ title: "GPS Error ❌", description: "Bhai location permission off hai! Default map khol raha hoon.", variant: "destructive" });
                // Fallback if GPS is blocked by user
                const navUrl = `https://www.google.com/maps/dir/?api=1&destination=$${encodeURIComponent(targetPlace)}&travelmode=driving&dir_action=navigate`;
                window.open(navUrl, '_blank');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        toast({ title: "Error", description: "Aapka browser GPS support nahi karta bhai.", variant: "destructive" });
    }
  };

  const currentMapQuery = activeMapQuery || destination;

  return (
    <div className="min-h-screen bg-[#0D0D0E] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8 text-white">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-tight" style={{ textShadow: "0 0 20px rgba(236,72,153,0.3)" }}>
             Advanced Trip Engine V2
          </h1>
          <p className="text-[#666666] font-bold uppercase tracking-widest text-xs">AI Powered Budget Planner</p>
          
          {/* 🛡️ Smart Badges */}
          <div className="flex justify-center gap-2 mt-2">
            {isGuest && <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold">Guest: Read-Only Mode</span>}
            {isMember && <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Member: Read-Only Plan</span>}
            {isAdmin && <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-bold flex items-center gap-1">👑 Admin: Full Control</span>}
          </div>
        </div>

        {/* 🚀 Hide Form entirely for Guests, Show as Disabled for Members, Full for Admin */}
        {!isGuest && !plan && (
            <div className="p-6 md:p-8 bg-surface border border-border rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
                
                {/* Visual Lock for Members */}
                {!canEditPlan && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                    <ShieldCheck className="h-12 w-12 text-[#111111]/50 mb-2" />
                    <p className="text-[#111111]/70 font-bold tracking-widest uppercase text-sm">Only Admin can modify trip settings</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-0">
                  <div className="space-y-2">
                    <Label className="text-[#666666] text-xs font-black uppercase ml-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Kahan Se? (Origin)</Label>
                    <Input disabled={!canEditPlan} value={origin} onChange={(e) => setOrigin(e.target.value)} className="bg-background border-border text-[#111111] h-14 rounded-2xl font-bold text-lg px-4 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#666666] text-xs font-black uppercase ml-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-pink-400"/> Kahan Tak? (Destination)</Label>
                    <Input disabled={!canEditPlan} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Goa, Ayodhya" className="bg-pink-500/10 border-pink-500/30 text-[#111111] h-14 rounded-2xl font-bold text-lg px-4 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#666666] text-xs font-black uppercase ml-1">👥 Members</Label>
                    <Input disabled={!canEditPlan} type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="bg-background border-border text-[#111111] h-14 rounded-2xl font-bold text-lg px-4 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#666666] text-xs font-black uppercase ml-1">💰 Total Budget</Label>
                    <Input disabled={!canEditPlan} type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="bg-background border-border text-[#111111] h-14 rounded-2xl font-bold text-lg px-4 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[#666666] text-xs font-black uppercase ml-1">🗣️ Output Language</Label>
                    <div className="flex gap-2 h-14">
                      {['English', 'Hindi', 'Hinglish'].map((lang: any) => (
                        <Button key={lang} disabled={!canEditPlan} variant={language === lang ? 'default' : 'outline'} onClick={() => setLanguage(lang)}
                          className={`flex-1 h-full rounded-2xl font-bold disabled:opacity-50 ${language === lang ? 'bg-purple-600 text-white border-0' : 'bg-background border-border text-[#666666]'}`}>
                          {lang}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={handleGeneratePlan} disabled={isGenerating || !canEditPlan} className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl text-lg uppercase relative z-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGenerating ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Sparkles className="h-6 w-6 mr-3" />}
                    {isGenerating ? "Analyzing Tiers & Logistics..." : "Generate Smart Plan 🚀"}
                </Button>
            </div>
        )}

        {plan && plan.plan_data && (
          <div className="space-y-6 animate-in fade-in duration-500">
             
             {/* 🗺️ LIVE INTERACTIVE MAP & GPS */}
             <div className="p-4 md:p-6 bg-surface rounded-[2rem] border border-border shadow-[0_0_30px_rgba(59,130,246,0.1)] space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <MapIcon className="h-4 w-4" /> Live Explorer Map
                    </h4>
                    {activeMapQuery !== destination && (
                       <span className="text-xs text-[#666666] animate-pulse flex items-center gap-1">
                         <MousePointerClick className="w-3 h-3" /> Showing: {activeMapQuery.replace(` in ${destination}`, '')}
                       </span>
                    )}
                 </div>
                 
                 <div className="w-full h-64 md:h-80 bg-black/50 rounded-2xl md:rounded-3xl overflow-hidden border border-border relative">
                    <iframe 
                      width="100%" height="100%" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                      loading="lazy" allowFullScreen 
                      src={`https://maps.google.com/maps?q=$${encodeURIComponent(currentMapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                 </div>

                 {/* 🚗 NEW: GPS NAVIGATION BUTTON */}
                 <Button 
                    onClick={() => startLiveNavigation(currentMapQuery)} 
                    className="w-full h-14 md:h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 text-sm md:text-lg tracking-wide uppercase"
                 >
                    <Navigation className="mr-2 h-5 w-5 animate-pulse" />
                    Start Live GPS Navigation
                 </Button>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
               <div className="p-6 bg-surface rounded-3xl border border-border">
                 <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4">💰 Budget Limits</h3>
                 <p className="text-2xl font-black mb-1">₹{plan.plan_data.budget_breakdown?.per_person} <span className="text-sm text-[#666666]">/ person</span></p>
                 <p className="text-sm mb-2 mt-4 text-[#111111]/80"><span className="font-bold text-[#111111]">Intercity:</span> {plan.plan_data.transport_plan?.intercity}</p>
                 <p className="text-sm mb-4 text-[#111111]/80"><span className="font-bold text-[#111111]">Local:</span> {plan.plan_data.transport_plan?.local}</p>
                 <p className="text-[10px] text-emerald-400/50 uppercase font-bold flex items-center gap-1"><MousePointerClick className="w-3 h-3"/> Click any place below to Map it</p>
               </div>

               <div className="p-6 bg-surface rounded-3xl border border-indigo-500/30">
                 <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4">🏨 Verified Stays (3+ Stars)</h3>
                 <ul className="space-y-2">
                   {plan.plan_data.stay_options?.map((stay: any, i: number) => (
                     <li key={i}>
                        <button onClick={() => setActiveMapQuery((typeof stay.name === 'object' ? stay.name.name : stay.name) + ' in ' + destination)} className="w-full text-left bg-background hover:bg-indigo-500/20 text-indigo-100 text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-colors border border-border group">
                           <span className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform"/> 
                             {typeof stay.name === 'object' ? (stay.name.name || 'Hotel') : (stay.name || 'Hotel')}
                           </span>
                           <span className="text-xs text-indigo-300">₹{typeof stay.cost_per_night === 'object' ? stay.cost_per_night.amount : stay.cost_per_night}/nt</span>
                        </button>
                     </li>
                   ))}
                 </ul>
               </div>
             </div>

             <div className="p-6 bg-surface rounded-3xl border border-orange-500/30">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">🍽️ Food Recommendations</h3>
                <div className="grid md:grid-cols-2 gap-3">
                   {plan.plan_data.food_plan?.suggestions?.map((food: any, i: number) => (
                     <button key={i} onClick={() => setActiveMapQuery((typeof food.name === 'object' ? food.name.name : food.name) + ' restaurant in ' + destination)} className="text-left bg-background hover:bg-orange-500/20 text-orange-100 text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-between border border-border">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-400"/> 
                          {typeof food.name === 'object' ? (food.name.name || 'Local Food') : (food.name || 'Local Food')}
                        </span>
                        <span className="text-xs text-orange-300">₹{typeof food.cost === 'object' ? food.cost.amount : food.cost}</span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-sm font-black text-pink-400 uppercase tracking-widest ml-2">📅 Action Plan</h3>
                {plan.plan_data.daywise_plan?.map((day: any, i: number) => (
                  <div key={i} className="p-5 bg-surface border-l-2 border-pink-500 rounded-r-2xl">
                    <h4 className="font-black text-lg mb-3">Day {day.day}: {typeof day.title === 'object' ? day.title.name : day.title}</h4>
                    <div className="space-y-2">
                      {day.activities?.map((act: any, idx: number) => (
                        <button key={idx} onClick={() => setActiveMapQuery((typeof act.desc === 'object' ? act.desc.name : (act.desc || act)) + ' in ' + destination)} className="w-full text-left bg-background hover:bg-pink-500/10 p-3 rounded-xl flex gap-3 text-sm transition-colors border border-transparent hover:border-pink-500/20">
                          <span className="text-xl">{act.emoji || '📍'}</span>
                          <div>
                            <p className="font-bold text-[#111111]/90">
                              {typeof act.time === 'object' ? act.time.name : (act.time || 'Routine')} - {typeof act.desc === 'object' ? (act.desc.name || act.desc.desc) : (act.desc || act)}
                            </p>
                            <p className="text-pink-400 font-bold text-xs mt-0.5">Estimated Cost: ₹{typeof act.cost === 'object' ? act.cost.amount : act.cost}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-10 border-t border-border pt-10">
          <div className="p-6 bg-surface rounded-3xl border border-border">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">💸 Expense Splitting</h3>
              <p className="text-xs text-[#666666] mb-4 bg-background p-3 rounded-xl border border-border">{plan?.plan_data?.expense_split_logic || "Add members to calculate dynamic splits."}</p>
              
              {/* 🛡️ PERMISSION LOCK: Guests cannot add expenses, but Members & Admins CAN! */}
              {!isGuest && (
                <Button variant="outline" className="w-full border-border text-[#111111] hover:bg-background rounded-xl h-12 font-bold transition-all">
                  + Add New Expense
                </Button>
              )}
          </div>
          <SpinWheel members={MOCK_MEMBERS} />
        </div>

        {/* Both Members and Admins can share the blueprint, but Guests cannot */}
        {!isGuest && plan && (
            <div className="pt-6 pb-12">
              <Button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] h-16 text-lg rounded-2xl font-black shadow-lg shadow-[#25D366]/20 transition-all active:scale-95">
                  <Share2 className="mr-2" /> Share Blueprint on WhatsApp
              </Button>
            </div>
        )}

      </div>
    </div>
  );
}
