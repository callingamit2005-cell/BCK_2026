import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap } from 'lucide-react';
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
  premiumSurface: string;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = React.memo(({
  aiAdvice,
  aiAlerts,
  aiPrediction,
  t,
  premiumSurface,
}) => {
  return (
    <Card className={cn(premiumSurface, "p-5 sm:p-10 relative border-border/40 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft")}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h3 className="text-fintech-graphite-muted text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Intelligence Feed</h3>
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-background border border-border/60 rounded-full shadow-sm shrink-0">
          <div className="h-4 w-4 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-pulse" />
          </div>
          <span className="text-[9px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em]">Forensic Logic</span>
        </div>
      </div>

      <div className="space-y-8 sm:space-y-12">
        <div className="min-w-0">
          <div className="flex justify-between items-center mb-6">
             {aiAdvice?.confidence && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-lg border shadow-sm transition-all duration-700",
                aiAdvice.confidence === 'HIGH' ? "text-fintech-emerald-dark border-fintech-emerald/20 bg-fintech-emerald-muted" : "text-fintech-graphite-muted border-border/40 bg-background"
              )}>
                Integrity: {aiAdvice.confidence}
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
               <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700">
                 <Sparkles className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#DC2626]" />
               </div>
               <p className="text-[#1a1a1a] text-[15px] sm:text-[16px] font-black leading-snug pt-0.5">
                 {aiAdvice?.insights || 'Analyzing your recent financial cycles...'}
               </p>
            </div>
            <p className="text-fintech-graphite-muted text-[13px] sm:text-[14px] font-bold italic leading-relaxed pl-10 sm:pl-12 opacity-80 border-l-2 border-border/20 ml-5 sm:ml-6">
              {aiAdvice?.projection}
            </p>
          </div>
        </div>

        {aiAlerts.length > 0 && (
          <div className="pt-6 sm:pt-10 border-t border-border/40">
            <h3 className="text-fintech-graphite-muted text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-60">Critical Nudges</h3>
            <div className="space-y-5 sm:space-y-6">
              {aiAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-4 sm:gap-5">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#DC2626]" />
                  </div>
                  <p className="text-[#1a1a1a] text-[14px] sm:text-[15px] font-bold pt-1">
                    {alert}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 sm:pt-10 border-t border-border/40 flex items-center justify-between px-1">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="text-fintech-graphite-muted text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">Cycle Prediction</h3>
            <p className="text-[#1a1a1a] text-xl sm:text-3xl font-black font-mono tracking-tighter leading-none tabular-nums truncate">{formatCurrency(aiPrediction.predictedTotal)}</p>
          </div>
          <div className="text-right shrink-0">
            <h3 className="text-fintech-graphite-muted text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">Momentum</h3>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-xl border shadow-sm transition-all duration-700",
              aiPrediction.trend.toLowerCase().includes('up') ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]" : "bg-fintech-emerald-muted text-fintech-emerald-dark border-fintech-emerald/10"
            )}>
              {aiPrediction.trend}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
});
