import React, { useMemo } from "react";
import { Zap, AlertTriangle, CheckCircle2, TrendingDown, IndianRupee } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyFormatter";

/**
 * BudgetPulse.tsx - Native-Grade Financial Health Indicator
 * UI DNA: Deep Void base (#0a0014) + 6% refraction + Heartbeat Pulse
 */

interface BudgetPulseProps {
  spent: number;
  budget: number;
  className?: string;
}

const BudgetPulse = React.memo(({ spent, budget, className }: BudgetPulseProps) => {
  const { t } = useLanguage();
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isDanger = percentage >= 85;
  
  // Health Logic Engine
  const health = useMemo(() => {
    if (budget === 0) return { status: 'neutral', icon: Zap, label: t('budgetPulse.noLimit', 'Limit Not Set') };
    if (percentage >= 100) return { status: 'critical', icon: AlertTriangle, label: t('budgetPulse.exhausted', 'You’ve crossed your planned limit for this category.') };
    if (percentage >= 85) return { status: 'danger', icon: AlertTriangle, label: t('budgetPulse.alert', 'Your spending is approaching the planned limit.') };
    return { status: 'safe', icon: CheckCircle2, label: t('budgetPulse.stable', 'Your financial rhythm is stable.') };
  }, [percentage, budget, t]);

  const Icon = health.icon;

  return (
    <div className={cn(
      "w-full max-w-[95%] md:max-w-xl mx-auto transition-all duration-700 ease-butter-soft transform-gpu",
      className
    )}>
      {/* Main Container: Premium Surface */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] p-8 border transition-all duration-1000",
        "bg-surface border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)]",
        isDanger && "border-fintech-rose-dark/20 bg-fintech-rose-muted/30 shadow-[0_8px_30px_rgba(159,18,57,0.05)]"
      )}>
        
        {/* Heartbeat Pulse - Emotionally Intelligent Breathing Animation */}
        {budget > 0 && (
          <div className="absolute top-8 right-8">
            <div className="relative flex h-6 w-6">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-30 transform-gpu will-change-[transform,opacity]",
                isDanger ? "animate-[pulse_3s_ease-in-out_infinite] bg-[#DC2626]" : "bg-fintech-graphite-muted opacity-10"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-6 w-6 transition-colors duration-1000 shadow-sm",
                isDanger ? "bg-[#DC2626]" : "bg-fintech-graphite-muted/20"
              )} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Circular Premium Icon Container - Reference Style */}
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-700 transform-gpu active:scale-95 border shrink-0 shadow-sm",
            isDanger ? "bg-[#FEE2E2] border-[#FECACA]" : "bg-background border-border/60"
          )}>
            <Icon className={cn(
              "h-7 w-7 transition-all duration-700 ease-butter-soft",
              isDanger ? "text-[#DC2626] animate-[pulse_4s_ease-in-out_infinite]" : "text-[#1a1a1a]"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-3">
              <h4 className={cn(
                "font-black text-[11px] sm:text-[12px] tracking-[0.05em] transition-colors duration-700 leading-snug",
                isDanger ? "text-[#DC2626]" : "text-fintech-graphite-muted"
              )}>
                {health.label}
              </h4>
              <span className="font-mono text-[12px] font-black text-fintech-graphite-muted opacity-60">
                {Math.round(percentage)}%
              </span>
            </div>

            {/* Micro-Progress Bar - Premium Weight */}
            <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-border/40 p-[2px]">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-butter-soft transform-gpu will-change-[width]",
                  isDanger ? "bg-[#DC2626]" : "bg-[#1a1a1a]"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Insight Overlay - Refined spacing */}
        <div className="mt-6 sm:mt-8 flex justify-between items-center bg-background/50 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-border/40 shadow-inner">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-1.5 sm:mb-2 truncate">{t('common.spent', 'Spent')}</p>
            <p className="text-lg sm:text-xl font-black text-[#1a1a1a] font-mono tracking-tighter leading-none tabular-nums truncate">{formatCurrency(spent)}</p>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[9px] sm:text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-1.5 sm:mb-2 truncate">{t('common.budget', 'Limit')}</p>
            <p className="text-lg sm:text-xl font-black text-fintech-graphite-muted font-mono tracking-tighter leading-none tabular-nums truncate">{formatCurrency(budget)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BudgetPulse;
