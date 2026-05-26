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
    if (percentage >= 100) return { status: 'critical', icon: AlertTriangle, label: t('budgetPulse.exhausted', 'Budget Exhausted') };
    if (percentage >= 85) return { status: 'danger', icon: AlertTriangle, label: t('budgetPulse.alert', 'Heartbeat Alert') };
    return { status: 'safe', icon: CheckCircle2, label: t('budgetPulse.stable', 'Financial Health: Stable') };
  }, [percentage, budget, t]);

  const Icon = health.icon;

  return (
    <div className={cn(
      "w-full max-w-[95%] md:max-w-xl mx-auto transition-all duration-500 ease-butter-soft transform-gpu",
      className
    )}>
      {/* Main Container: Premium Surface */}
      <div className={cn(
        "relative overflow-hidden rounded-[24px] p-6 border transition-all duration-700",
        "bg-surface border-border shadow-sm",
        isDanger && "border-red-500/50"
      )}>
        
        {/* Heartbeat Pulse - GPU Optimized */}
        {budget > 0 && (
          <div className="absolute top-6 right-6">
            <div className="relative flex h-4 w-4">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 transform-gpu will-change-[transform,opacity]",
                isDanger ? "animate-pulse bg-red-500" : "bg-white opacity-20"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-4 w-4 transition-colors duration-500",
                isDanger ? "bg-red-500" : "bg-white/40"
              )} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-5">
          {/* Status Icon Badge */}
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-500 transform-gpu active:scale-[0.98]",
            "bg-white/5 border border-white/5 text-white/40"
          )}>
            <Icon className={cn("h-6 w-6 will-change-transform")} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-2">
              <h4 className={cn(
                "font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-colors",
                isDanger ? "text-red-400" : "text-white/60"
              )}>
                {health.label}
              </h4>
              <span className="font-mono text-[10px] font-bold text-white/40">
                {Math.round(percentage)}%
              </span>
            </div>

            {/* Micro-Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-butter-soft transform-gpu will-change-[width]",
                  isDanger ? "bg-red-500" : "bg-white"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Insight Overlay */}
        <div className="mt-5 flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
          <div>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{t('common.spent', 'Spent')}</p>
            <p className="text-sm font-black text-white font-mono tracking-tighter">{formatCurrency(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{t('common.budget', 'Limit')}</p>
            <p className="text-sm font-black text-white/60 font-mono tracking-tighter">{formatCurrency(budget)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BudgetPulse;
