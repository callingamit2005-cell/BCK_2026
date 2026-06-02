import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, Star, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { safeJsonParse } from '@/utils/jsonUtils';
import { useLanguage } from '@/contexts/LanguageContext';

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

const MarketIntelligence = React.memo(({ transactions, currentMonthExpenses, advice }: MarketIntelligenceProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
    toast({ 
      title: t('common.confirm', "Plan marked as started ✔"), 
      description: t('market_intel.wealth_builder', "You are building wealth.") 
    });
  };

  return (
    <div className="fintech-card p-6 sm:p-8 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {t('market_intel.growth_intel', 'Growth Intelligence')}
            </h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              {t('market_intel.wealth_builder', 'Wealth Builder Strategy')}
            </p>
          </div>
        </div>
        <div className="flex self-start sm:self-auto">
          <div className="bg-muted/50 border border-border rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('market_intel.live_audit', 'Live Audit')}
            </span>
          </div>
        </div>
      </div>

      {/* PERSONALIZED PLAN (PRIMARY FOCUS) */}
      {advice?.personalizedPlan && (
        <div className="mb-8 animate-fade-in-up">
           <div className="bg-muted/30 border border-border/60 rounded-2xl p-6 shadow-inner group/plan hover:border-primary/30 transition-all duration-500">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                  {t('market_intel.strategic_plan', 'Strategic Money Plan')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">
                    {t('market_intel.suggested_sip', 'Monthly SIP')}
                  </p>
                  <p className="text-foreground text-3xl font-bold font-mono tracking-tighter tabular-nums leading-none">₹{advice.personalizedPlan.sipAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">
                    {t('market_intel.risk_appetite', 'Risk Profile')}
                  </p>
                  <p className="text-primary text-sm font-bold uppercase tracking-wide">{advice.personalizedPlan.riskProfile}</p>
                </div>
              </div>
              <div className="relative p-4 bg-surface rounded-xl border border-border/50">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-xl" />
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{advice.growth}"
                </p>
              </div>
           </div>
        </div>
      )}

      {/* PROGRESS TRACKER */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            {t('market_intel.velocity_progress', 'Velocity Progress')}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-tight">
            <CheckCircle2 className="h-3 w-3" />
            {actionState.streak} {t('market_intel.milestone', 'Milestone')}{actionState.streak !== 1 && 's'}
          </div>
        </div>
        <div className="flex gap-2 h-1.5">
          <div className={cn("flex-1 rounded-full transition-all duration-700", actionState.sipStarted ? "bg-primary shadow-[0_0_8px_rgba(20,184,166,0.3)]" : "bg-muted")} />
          <div className={cn("flex-1 rounded-full transition-all duration-700", actionState.emergencyStarted ? "bg-primary shadow-[0_0_8px_rgba(20,184,166,0.3)]" : "bg-muted")} />
          <div className="flex-1 rounded-full bg-muted" />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mb-8 space-y-3">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider ml-1">
          {t('market_intel.recommended_actions', 'Recommended Actions')}
        </p>
        
        <button 
          onClick={() => updateAction('sipStarted')}
          disabled={actionState.sipStarted}
          className={cn(
            "w-full group/btn flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
            actionState.sipStarted 
              ? "bg-muted/30 border-border opacity-70" 
              : "bg-surface border-border hover:border-primary/50 hover:shadow-premium active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-500 border", 
              actionState.sipStarted ? "bg-surface border-primary/20" : "bg-muted/50 border-border group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20"
            )}>
              {actionState.sipStarted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
            </div>
            <div className="text-left">
              <p className="text-foreground text-sm font-bold tracking-tight">
                {t('market_intel.activate_sip', 'Activate SIP Track')}
              </p>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {t('market_intel.sip_desc', 'Small recurring wealth blocks')}
              </p>
            </div>
          </div>
          {!actionState.sipStarted && <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />}
        </button>

        <button 
          onClick={() => updateAction('emergencyStarted')}
          disabled={actionState.emergencyStarted}
          className={cn(
            "w-full group/btn flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
            actionState.emergencyStarted 
              ? "bg-muted/30 border-border opacity-70" 
              : "bg-surface border-border hover:border-primary/50 hover:shadow-premium active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-500 border", 
              actionState.emergencyStarted ? "bg-surface border-primary/20" : "bg-muted/50 border-border group-hover/btn:bg-primary/10 group-hover/btn:border-primary/20"
            )}>
              {actionState.emergencyStarted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
            </div>
            <div className="text-left">
              <p className="text-foreground text-sm font-bold tracking-tight">
                {t('market_intel.deploy_emergency', 'Deploy Emergency Fund')}
              </p>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {t('market_intel.emergency_desc', 'Secure survival buffer')}
              </p>
            </div>
          </div>
          {!actionState.emergencyStarted && <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />}
        </button>
      </div>

      {/* INSTITUTIONAL ON-RAMPS */}
      <div className="mb-8">
          <div className="bg-muted/20 border border-dashed border-border rounded-2xl p-6 text-center">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-6">
              {t('market_intel.institutional_onramps', 'Institutional On-ramps')}
            </p>
            <div className="flex justify-center gap-8">
              {['Groww', 'Zerodha', 'AngelOne'].map((p, i) => (
                <div key={i} className="group/item flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-2 group-hover:border-primary/40 group-hover:shadow-sm transition-all duration-300">
                    <div className="w-6 h-6 bg-muted rounded-md group-hover:bg-primary/10 transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/item:text-primary transition-colors">{p}</p>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* SECURITY PROTOCOL */}
      <div className="bg-surface rounded-xl p-4 flex items-start gap-4 border border-border shadow-sm">
        <div className="p-2 bg-muted/50 border border-border rounded-lg">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-foreground">
            {t('market_intel.security_protocol', 'Security Protocol')}
          </p>
          <p className="text-muted-foreground text-[10px] font-medium leading-relaxed">
            {t('market_intel.disclaimer', 'Investments are settled on institutional platforms. BachatKaro operates as an execution-only planning terminal.')}
          </p>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-8 text-muted-foreground/40">
        {t('market_intel.os_footer', 'Financial Operating System · Institutional Grade')}
      </p>
    </div>
  );
});

MarketIntelligence.displayName = 'MarketIntelligence';

export default MarketIntelligence;
