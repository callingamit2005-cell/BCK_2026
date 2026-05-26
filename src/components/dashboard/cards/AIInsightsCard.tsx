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
  neonGlass: string;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = React.memo(({
  aiAdvice,
  aiAlerts,
  aiPrediction,
  t,
  neonGlass,
}) => {
  return (
    <Card className={cn(neonGlass, "p-8 relative border-border shadow-sm")}>
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
        <span className="w-1.5 h-1.5 bg-white rounded-full opacity-40" />
        <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">ANALYSIS</span>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em]">AI Analysis</h3>
            {aiAdvice?.confidence && (
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                "text-text-secondary border-white/10 bg-white/5"
              )}>
                Confidence: {aiAdvice.confidence}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-white text-sm font-bold flex items-start gap-2 leading-relaxed">
              <Sparkles className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
              {aiAdvice?.insights || 'Analyzing your patterns...'}
            </p>
            <p className="text-text-muted text-xs font-medium italic leading-relaxed">
              {aiAdvice?.projection}
            </p>
          </div>
        </div>

        {aiAlerts.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Smart Alerts</h3>
            <div className="space-y-3">
              {aiAlerts.map((alert, idx) => (
                <p key={idx} className="text-white/80 text-sm font-bold flex items-start gap-2">
                  <Zap className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
                  {alert}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Spend Prediction</h3>
            <p className="text-white text-lg font-bold font-mono tracking-tighter">{formatCurrency(aiPrediction.predictedTotal)}</p>
          </div>
          <div className="text-right">
            <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Trend</h3>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-white/5 border-white/10 text-text-muted"
            )}>
              {aiPrediction.trend}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
});
