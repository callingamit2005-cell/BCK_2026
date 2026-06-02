/**
 * AIInsightsCard.tsx - BachatKaro Premium Fintech Edition
 * UI: Professional AI-Driven Intelligence Terminal.
 * 🛡️ LOGIC LOCK: AI Advice, Alerts, and Prediction logic 100% untouched.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, TrendingUp, TrendingDown, Info, ShieldCheck } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/utils/currencyFormatter';

interface AIInsightsCardProps {
  aiAdvice: {
    insights: string;
    projection: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  } | null;
  aiAlerts: string[];
  aiPrediction: {
    predictedTotal: number;
    trend: string;
  };
  t: (key: string, defaultValue?: string) => string;
  premiumSurface?: string;
}

// Institutional Confidence Palette
const confidenceConfig = {
  HIGH:   { label: 'High Integrity',   className: 'bg-primary/5 text-primary border-primary/20 shadow-sm' },
  MEDIUM: { label: 'Stable Analysis', className: 'bg-warning/5 text-warning border-warning/20' },
  LOW:    { label: 'Initializing',    className: 'bg-muted text-muted-foreground border-border' },
} as const;

export const AIInsightsCard: React.FC<AIInsightsCardProps> = React.memo(({
  aiAdvice,
  aiAlerts,
  aiPrediction,
  t,
}) => {
  const isTrendingUp = aiPrediction.trend.toLowerCase().includes('up');
  const TrendIcon = isTrendingUp ? TrendingUp : TrendingDown;

  return (
    <Card className="fintech-card p-6 sm:p-8 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {t('dashboard.aiInsights', 'AI Insights')}
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Personalized Pattern Analysis
            </p>
          </div>
        </div>

        {aiAdvice?.confidence && (
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
            confidenceConfig[aiAdvice.confidence].className
          )}>
            <ShieldCheck className="h-3 w-3" />
            {confidenceConfig[aiAdvice.confidence].label}
          </div>
        )}
      </div>

      <div className="space-y-8">

        {/* Primary Insight */}
        <div className="bg-muted/30 p-6 rounded-2xl border border-border/60 relative group hover:border-primary/20 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 text-primary/10 group-hover:text-primary/20 transition-colors">
            <Info size={40} />
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-base font-bold text-foreground leading-relaxed">
              {aiAdvice?.insights || t('dashboard.analyzingCycles', 'Analyzing recent spending patterns…')}
            </p>
            {aiAdvice?.projection && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                  "{aiAdvice.projection}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {aiAlerts.length > 0 && (
          <div className="space-y-5 pt-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
              {t('dashboard.spendingAlerts', 'Critical Pulses')}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {aiAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-expense/5 border border-expense/20 rounded-xl group hover:bg-expense/8 transition-all">
                  <div className="h-8 w-8 rounded-full bg-surface border border-expense/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Zap className="h-4 w-4 text-expense" />
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug pt-1.5">
                    {alert}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction Footer */}
        <div className="pt-8 border-t border-border/50 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('dashboard.projectedMonthEnd', 'Projected Month-End Volume')}
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground font-mono tracking-tighter leading-none tabular-nums">
              {formatCurrency(aiPrediction.predictedTotal)}
            </p>
          </div>
          
          <div className={cn(
            "flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all shadow-sm",
            isTrendingUp ? "bg-expense/5 border-expense/20" : "bg-income/5 border-income/20"
          )}>
            <div className={cn(
              "p-1.5 rounded-lg",
              isTrendingUp ? "bg-expense/10" : "bg-income/10"
            )}>
              <TrendIcon className={cn(
                "h-4 w-4",
                isTrendingUp ? "text-expense" : "text-income"
              )} />
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isTrendingUp ? "text-expense" : "text-income"
            )}>
              {aiPrediction.trend}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-10 text-muted-foreground/30">
        BachatKaro Intelligence · Automated Audit
      </p>
    </Card>
  );
});

AIInsightsCard.displayName = 'AIInsightsCard';
export default AIInsightsCard;
