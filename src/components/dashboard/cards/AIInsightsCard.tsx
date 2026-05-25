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

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  aiAdvice,
  aiAlerts,
  aiPrediction,
  t,
  neonGlass,
}) => {
  return (
    <Card className={cn(neonGlass, "p-8 relative border-[#ff0f7b]/35 shadow-[0_0_40px_-10px_rgba(255,15,123,0.3)]")}>
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-[#ff0f7b]/20 border border-[#ff0f7b]/40 rounded-full">
        <span className="w-1.5 h-1.5 bg-[#ff0f7b] rounded-full animate-pulse shadow-[0_0_8px_#ff0f7b]" />
        <span className="text-[8px] font-black text-[#ff0f7b] uppercase tracking-widest">ANALYSIS</span>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.3em]">AI Analysis</h3>
            {aiAdvice?.confidence && (
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                aiAdvice.confidence === 'HIGH' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                aiAdvice.confidence === 'MEDIUM' ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                "text-rose-400 border-rose-400/30 bg-rose-400/10"
              )}>
                Confidence: {aiAdvice.confidence}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-white text-sm font-bold flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#ff0f7b] shrink-0 mt-0.5" />
              {aiAdvice?.insights || 'Analyzing your patterns...'}
            </p>
            <p className="text-white/60 text-xs font-medium italic">
              {aiAdvice?.projection}
            </p>
          </div>
        </div>

        {aiAlerts.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Smart Alerts</h3>
            <div className="space-y-3">
              {aiAlerts.map((alert, idx) => (
                <p key={idx} className="text-rose-400 text-sm font-bold flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                  {alert}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Spend Prediction</h3>
            <p className="text-white text-lg font-black font-mono">{formatCurrency(aiPrediction.predictedTotal)}</p>
          </div>
          <div className="text-right">
            <h3 className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Trend</h3>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
              aiPrediction.trend === 'increasing' ? "text-rose-400 border-rose-400/30 bg-rose-400/10" :
              aiPrediction.trend === 'decreasing' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
              "text-blue-400 border-blue-400/30 bg-blue-400/10"
            )}>
              {aiPrediction.trend}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
