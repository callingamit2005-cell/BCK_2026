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
    <div className="bg-surface border border-white/5 rounded-[32px] p-7 shadow-sm w-full overflow-hidden relative transform-gpu">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Growth Intelligence</p>
          <div className="flex items-center gap-2">
             <Star className="h-3 w-3 text-white/20 fill-white/20" />
             <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Personalized Wealth Builder</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Live Audit</span>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="mb-10 bg-white/5 rounded-[24px] border border-white/10 p-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Your Progress</p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-white" />
            <span className="text-white text-[9px] font-bold">{actionState.streak} Plan Started</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-700", actionState.sipStarted ? "bg-white" : "bg-white/10")} />
          <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-700", actionState.emergencyStarted ? "bg-white" : "bg-white/10")} />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>
      </div>

      {/* PERSONALIZED PLAN */}
      {advice?.personalizedPlan && (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="bg-white/5 border border-white/10 rounded-[28px] p-6">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Your Money Plan
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-white/40 text-[8px] font-bold uppercase">Suggested SIP</p>
                  <p className="text-white text-xl font-bold font-mono">₹{advice.personalizedPlan.sipAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-white/40 text-[8px] font-bold uppercase">Risk Profile</p>
                  <p className="text-white text-sm font-bold uppercase tracking-tighter">{advice.personalizedPlan.riskProfile}</p>
                </div>
              </div>
              <p className="text-white/70 text-xs font-medium italic leading-relaxed">
                "{advice.growth}"
              </p>
           </div>
        </div>
      )}

      {/* WHAT TO DO NEXT (ACTION BUTTONS) */}
      <div className="mb-10 space-y-4">
        <p className="text-text-muted text-[9px] font-bold uppercase tracking-widest ml-1">What to Do Next</p>
        
        <button 
          onClick={() => updateAction('sipStarted')}
          disabled={actionState.sipStarted}
          className={cn(
            "w-full group flex items-center justify-between p-5 rounded-[22px] border transition-all duration-300",
            actionState.sipStarted ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn("p-2.5 rounded-xl border", actionState.sipStarted ? "bg-white text-background border-white" : "bg-white/5 border-white/10 text-white")}>
              {actionState.sipStarted ? <CheckCircle2 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
            </div>
            <div className="text-left">
              <p className="text-white text-[13px] font-bold uppercase tracking-tighter">Start SIP Plan</p>
              <p className="text-white/40 text-[9px] font-bold">Invest small, build big.</p>
            </div>
          </div>
          {!actionState.sipStarted && <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />}
        </button>

        <button 
          onClick={() => updateAction('emergencyStarted')}
          disabled={actionState.emergencyStarted}
          className={cn(
            "w-full group flex items-center justify-between p-5 rounded-[22px] border transition-all duration-300",
            actionState.emergencyStarted ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn("p-2.5 rounded-xl border", actionState.emergencyStarted ? "bg-white text-background border-white" : "bg-white/5 border-white/10 text-white")}>
              {actionState.emergencyStarted ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="text-left">
              <p className="text-white text-[13px] font-bold uppercase tracking-tighter">Build Emergency Fund</p>
              <p className="text-white/40 text-[9px] font-bold">Safe backup for 3 months.</p>
            </div>
          </div>
          {!actionState.emergencyStarted && <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />}
        </button>
      </div>

      {/* START INVESTING NOW (TRUSTED PLATFORMS) */}
      <div className="mb-10">
          <div className="bg-white/5 border border-dashed border-white/20 rounded-[28px] p-6 text-center">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-2">
              <Star className="h-3 w-3 fill-white/40 text-white/40" /> Start Investing Now
            </p>
            <div className="flex justify-center gap-8 mb-6">
              {['Groww', 'Zerodha', 'Paytm'].map((p, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:border-white/40 group-hover:bg-white/10 transition-all">
                    <TrendingUp className="h-5 w-5 text-white/20 group-hover:text-white" />
                  </div>
                  <p className="text-[9px] font-bold text-white/40 group-hover:text-white transition-colors">{p}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 text-white/20 text-[8px] font-bold uppercase tracking-widest">
               <ShieldCheck className="h-3 w-3" /> SEBI Trusted Platforms Only
            </div>
          </div>
      </div>

      {/* TRUST ENGINE DISCLAIMER */}
      <div className="bg-white/5 rounded-2xl p-4 flex items-start gap-3 border border-white/5">
        <div className="mt-1 p-1.5 bg-white/5 rounded-lg">
          <ShieldCheck className="h-3 w-3 text-white/40" />
        </div>
        <div className="text-left">
          <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Why this is safe</p>
          <p className="text-white/30 text-[8px] font-medium leading-relaxed">
            Investment direct aapke choice ke platform pe hota hai. BachatKaro sirf calculation aur plan dikhata hai.
          </p>
        </div>
      </div>

      <p className="text-[7px] text-white/10 font-bold uppercase tracking-[0.2em] text-center mt-6">
        This is a planning tool. Investments are made on external platforms.
      </p>
    </div>
  );
});

export default MarketIntelligence;
