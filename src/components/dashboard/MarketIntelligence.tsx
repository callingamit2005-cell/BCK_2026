import React, { useState, useMemo, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight, ShieldCheck, TrendingUp, Wallet, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { safeJsonParse } from '@/utils/jsonUtils';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface MarketIntelligenceProps {
  transactions: Transaction[];
  currentMonthExpenses: Transaction[];
  advice: {
    growth: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    investmentOptions?: {
      sip: string;
      emergency: string;
      fd: string;
    };
    platforms?: string[];
    personalizedPlan?: {
      sipAmount: number;
      emergencyTarget: number;
      riskProfile: string;
    };
  } | null;
}

const NEON_COLORS = ['#ff0f7b', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'] as const;

const MarketIntelligence = React.memo(({ transactions, currentMonthExpenses, advice }: MarketIntelligenceProps) => {
  const { toast } = useToast();
  const [actionState, setActionState] = useState({
    sipStarted: false,
    emergencyStarted: false,
    streak: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('bachatkaro_invest_actions');
    if (saved) setActionState(safeJsonParse(saved, { sipStarted: false, emergencyStarted: false, streak: 0 }));
  }, []);

  const updateAction = (key: string) => {
    const newState = { ...actionState, [key]: true, streak: actionState.streak + 1 };
    setActionState(newState);
    localStorage.setItem('bachatkaro_invest_actions', JSON.stringify(newState));
    toast({ title: "Plan marked as started ✔", description: "You are building wealth." });
  };

  const totalCurrentMonth = useMemo(() => currentMonthExpenses.reduce((s, t) => s + t.amount, 0), [currentMonthExpenses]);

  return (
    <div className="bg-surface border border-border/40 rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] w-full overflow-hidden relative transform-gpu transition-all duration-700 ease-butter-soft hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          {/* Circular Premium Icon Container - Investment Style */}
          <div className="h-14 w-14 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <Star className="h-6 w-6 text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1a1a1a] tracking-tighter uppercase leading-tight">Growth Intel</h3>
            <p className="text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">Personalized Wealth Builder</p>
          </div>
        </div>
        <div className="bg-background border border-border/60 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-fintech-emerald animate-pulse" />
          <span className="text-[9px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em]">Live Audit</span>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="mb-12 bg-background/[0.02] rounded-[28px] border border-border/40 p-8 shadow-inner">
        <div className="flex justify-between items-center mb-5">
          <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Your Velocity Progress</p>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-border/40 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-fintech-emerald-dark" />
            <span className="text-[#1a1a1a] text-[10px] font-black uppercase tracking-tight">{actionState.streak} Milestone{actionState.streak !== 1 && 's'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className={cn("h-2 flex-1 rounded-full transition-all duration-1000 ease-butter-soft shadow-sm", actionState.sipStarted ? "bg-fintech-emerald" : "bg-border/30")} />
          <div className={cn("h-2 flex-1 rounded-full transition-all duration-1000 ease-butter-soft shadow-sm", actionState.emergencyStarted ? "bg-fintech-emerald" : "bg-border/30")} />
          <div className="h-2 flex-1 rounded-full bg-border/30" />
        </div>
      </div>

      {/* PERSONALIZED PLAN */}
      {advice?.personalizedPlan && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="bg-background/40 border border-border/60 rounded-[32px] p-8 shadow-sm group/plan hover:bg-background transition-all duration-500">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-4 w-4 text-fintech-graphite-muted opacity-40" />
                <p className="text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] opacity-60">Strategic Money Plan</p>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Suggested SIP</p>
                  <p className="text-[#1a1a1a] text-3xl font-black font-mono tracking-tighter tabular-nums leading-none">₹{advice.personalizedPlan.sipAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Risk Appetite</p>
                  <p className="text-fintech-graphite-muted text-[15px] font-black uppercase tracking-tighter">{advice.personalizedPlan.riskProfile}</p>
                </div>
              </div>
              <p className="text-[#525252] text-[15px] font-bold italic leading-relaxed border-l-2 border-border/20 pl-6">
                "{advice.growth}"
              </p>
           </div>
        </div>
      )}

      {/* WHAT TO DO NEXT (ACTION BUTTONS) */}
      <div className="mb-12 space-y-5">
        <p className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.25em] ml-2 opacity-60">Recommended Actions</p>
        
        <button 
          onClick={() => updateAction('sipStarted')}
          disabled={actionState.sipStarted}
          className={cn(
            "w-full group/btn flex items-center justify-between p-6 rounded-[28px] border transition-all duration-500 ease-butter-soft shadow-sm",
            actionState.sipStarted 
              ? "bg-background border-border/40 opacity-70" 
              : "bg-surface border-border/40 hover:border-border/80 hover:bg-background/80 active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-5">
            {/* Circular Premium Icon Container - Action Style */}
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-700 shadow-sm border", 
              actionState.sipStarted ? "bg-[#DCFCE7] border-[#BBF7D0]" : "bg-[#FEE2E2] border-[#FECACA] group-hover/btn:scale-110"
            )}>
              {actionState.sipStarted ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <TrendingUp className="h-6 w-6 text-[#DC2626]" />}
            </div>
            <div className="text-left">
              <p className="text-[#1a1a1a] text-[16px] font-black uppercase tracking-tight">Activate SIP Track</p>
              <p className="text-fintech-graphite-muted text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Small recurring wealth blocks</p>
            </div>
          </div>
          {!actionState.sipStarted && <ArrowRight className="h-5 w-5 text-fintech-graphite-muted opacity-40 group-hover/btn:text-[#1a1a1a] group-hover/btn:translate-x-1 transition-all" />}
        </button>

        <button 
          onClick={() => updateAction('emergencyStarted')}
          disabled={actionState.emergencyStarted}
          className={cn(
            "w-full group/btn flex items-center justify-between p-6 rounded-[28px] border transition-all duration-500 ease-butter-soft shadow-sm",
            actionState.emergencyStarted 
              ? "bg-background border-border/40 opacity-70" 
              : "bg-surface border-border/40 hover:border-border/80 hover:bg-background/80 active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-5">
            {/* Circular Premium Icon Container - Action Style */}
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-700 shadow-sm border", 
              actionState.emergencyStarted ? "bg-[#DCFCE7] border-[#BBF7D0]" : "bg-[#FEE2E2] border-[#FECACA] group-hover/btn:scale-110"
            )}>
              {actionState.emergencyStarted ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ShieldCheck className="h-6 w-6 text-[#DC2626]" />}
            </div>
            <div className="text-left">
              <p className="text-[#1a1a1a] text-[16px] font-black uppercase tracking-tight">Deploy Emergency Fund</p>
              <p className="text-fintech-graphite-muted text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Secure 3-month survival buffer</p>
            </div>
          </div>
          {!actionState.emergencyStarted && <ArrowRight className="h-5 w-5 text-fintech-graphite-muted opacity-40 group-hover/btn:text-[#1a1a1a] group-hover/btn:translate-x-1 transition-all" />}
        </button>
      </div>

      {/* START INVESTING NOW (TRUSTED PLATFORMS) */}
      <div className="mb-12">
          <div className="bg-background border border-dashed border-border/60 rounded-[32px] p-8 text-center shadow-inner">
            <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.3em] mb-8 flex items-center justify-center gap-3 opacity-60">
              <Star className="h-4 w-4 fill-[#DC2626] text-[#DC2626]" /> Institutional On-ramps
            </p>
            <div className="flex justify-center gap-10 mb-8">
              {['Groww', 'Zerodha', 'AngelOne'].map((p, i) => (
                <div key={i} className="group/item cursor-pointer">
                  {/* Circular Premium Icon Container - Goal Style */}
                  <div className="w-16 h-16 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center mb-3 group-hover/item:border-[#93C5FD] group-hover/item:bg-[#EFF6FF] transition-all shadow-sm group-hover/item:scale-110 duration-500">
                    <TrendingUp className="h-6 w-6 text-[#DC2626]" />
                  </div>
                  <p className="text-[10px] font-black text-fintech-graphite-muted uppercase tracking-widest group-hover/item:text-[#1a1a1a] transition-colors opacity-70">{p}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2.5 text-fintech-graphite-muted text-[9px] font-black uppercase tracking-[0.25em] opacity-50">
               <ShieldCheck className="h-4 w-4 text-emerald-600" /> SEBI Regulated Architecture Only
            </div>
          </div>
      </div>

      {/* TRUST ENGINE DISCLAIMER */}
      <div className="bg-background/80 rounded-2xl p-6 flex items-start gap-5 border border-border/40 shadow-sm">
        <div className="mt-1 p-2 bg-white rounded-xl shadow-sm">
          <ShieldCheck className="h-4 w-4 text-fintech-emerald-dark" />
        </div>
        <div className="text-left">
          <p className="text-[#1a1a1a] text-[11px] font-black uppercase tracking-widest mb-1.5">Security Protocol</p>
          <p className="text-[#525252] text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-tight">
            Investments are settled on your preferred institutional platforms. BachatKaro operates as an execution-only planning terminal.
          </p>
        </div>
      </div>

      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-center mt-8 text-fintech-graphite-muted opacity-40">
        Financial Operating System · Institutional Grade
      </p>
    </div>
  );
});

export default MarketIntelligence;