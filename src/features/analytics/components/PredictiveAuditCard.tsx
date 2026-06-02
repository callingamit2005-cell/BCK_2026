import { formatCurrency } from '@/utils/currencyFormatter';
import { PredictiveData } from '@/types/analytics';
import { TrendingUp, TrendingDown, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: PredictiveData;
}

export const PredictiveAuditCard = ({ data }: Props) => {
  const confidencePercent = Math.round(data.confidenceScore * 100);
  
  // Status-based colors
  const isHighVariance = data.insight.isOverspending;
  
  return (
    <div className="bg-surface rounded-modal p-10 shadow-premium border border-border/40 mb-12 relative overflow-hidden group transition-all duration-700 hover:shadow-institutional">
      <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform duration-1000 group-hover:scale-110 pointer-events-none">
        <ShieldCheck className="w-40 h-40 text-institutional-blue" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-institutional-blue" />
              Advanced Predictive Audit
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tighter">
              Projected Liability
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-4xl sm:text-5xl font-black text-foreground font-mono tabular-nums tracking-tighter leading-none">
              {formatCurrency(data.projectedTotal)}
            </p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-3 opacity-60">
              Estimated Month-End Spend
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Confidence Score */}
          <div className="bg-background/40 p-8 rounded-2xl border border-border/40 shadow-inner">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Data Confidence</span>
              <span className="text-xs font-black font-mono tabular-nums">{confidencePercent}%</span>
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/40 p-[1px]">
              <div 
                className="h-full bg-institutional-blue rounded-full transition-all duration-1000 ease-butter-soft" 
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-text-secondary mt-4 uppercase tracking-[0.1em] opacity-60">
              {confidencePercent > 80 ? 'High precision dataset' : 'Analyzing temporal trends'}
            </p>
          </div>

          {/* Burn Rate Insight */}
          <div className="bg-background/40 p-8 rounded-2xl border border-border/40 shadow-inner lg:col-span-2">
            <div className="flex items-start gap-5">
              <div className={cn(
                "p-4 rounded-xl border shrink-0 transition-all duration-700",
                isHighVariance ? "bg-foreground text-surface border-foreground shadow-institutional" : "bg-background border-border/60 text-institutional-blue shadow-sm"
              )}>
                {isHighVariance ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-tight mb-2">
                  Burn Rate Variance: {data.insight.status}
                </p>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em] leading-relaxed opacity-70">
                  {isHighVariance 
                    ? `Velocity anomaly detected. Current trajectory exceeds historical baseline by ${formatCurrency(data.insight.variancePaise)}.` 
                    : "Spending velocity remains within established statistical boundaries."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Audits */}
        {data.categoryPredictions.some(p => p.anomaly) && (
          <div className="mt-10 pt-8 border-t border-border/40">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-institutional-blue" />
              Category Specific Anomalies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.categoryPredictions.filter(p => p.anomaly).map((pred, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-background/20 border border-border/40 transition-all hover:bg-background/40 hover:border-border/80">
                  <span className="text-[10px] font-black text-foreground uppercase truncate pr-3 tracking-tight">{pred.category}</span>
                  <span className="text-[10px] font-black font-mono bg-foreground text-surface px-2.5 py-1 rounded-lg shadow-sm">
                    +{Math.round((pred.projected / pred.current - 1) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
