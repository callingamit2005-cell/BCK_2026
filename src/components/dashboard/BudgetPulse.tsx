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

const BudgetPulse = ({ spent, budget, className }: BudgetPulseProps) => {
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
      {/* Main Container: Deep Void Glass */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] p-6 border transition-all duration-700 backdrop-blur-[32px]",
        "bg-[#0a0014]/94 border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]",
        isDanger && "border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
      )}>
        
        {/* Heartbeat Pulse - GPU Optimized */}
        {budget > 0 && (
          <div className="absolute top-6 right-6">
            <div className="relative flex h-4 w-4">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 transform-gpu will-change-[transform,opacity]",
                isDanger ? "animate-pulse bg-rose-500 duration-1000" : "bg-emerald-500 opacity-40 shadow-[0_0_15px_#10b981]"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-4 w-4 transition-colors duration-500",
                isDanger ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]" : "bg-emerald-500"
              )} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-5">
          {/* Status Icon Badge */}
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-500 transform-gpu active:scale-[0.965]",
            health.status === 'safe' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            health.status === 'danger' || health.status === 'critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "",
            health.status === 'neutral' && "bg-slate-500/10 text-slate-400 border border-white/5"
          )}>
            <Icon className={cn("h-6 w-6 will-change-transform", isDanger && "animate-bounce")} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-2">
              <h4 className={cn(
                "font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-colors",
                health.status === 'safe' && "text-emerald-400",
                health.status === 'danger' || health.status === 'critical' ? "text-rose-400" : "text-slate-400"
              )}>
                {health.label}
              </h4>
              <span className="font-mono text-[10px] font-black text-white/40">
                {Math.round(percentage)}%
              </span>
            </div>

            {/* Micro-Progress Bar */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-butter-soft transform-gpu will-change-[width]",
                  health.status === 'safe' && "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                  health.status === 'danger' || health.status === 'critical' ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]" : "bg-slate-500"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Insight Overlay */}
        <div className="mt-5 flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
          <div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t('common.spent', 'Spent')}</p>
            <p className="text-sm font-black text-white font-mono">{formatCurrency(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t('common.budget', 'Monthly Limit')}</p>
            <p className="text-sm font-black text-pink-500 font-mono">{formatCurrency(budget)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPulse;
