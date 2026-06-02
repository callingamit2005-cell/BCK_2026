import { formatCurrency } from '@/utils/currencyFormatter';

interface Props {
  currentMonthTotal: number;
  previousMonthTotal: number;
  // null = no prior period data exists (new user or first month); 0 = genuine no change
  percentChange: number | null;
}

export const MonthlyComparison = ({ currentMonthTotal, previousMonthTotal, percentChange }: Props) => {
  // null-safe: arrow and color are only rendered when percentChange !== null
  const arrow = (percentChange ?? 0) >= 0 ? "▲" : "▼";

  // 95/5 Color Rule: Micro-accent for delta
  // Spending UP = overspending = destructive red. Spending DOWN = good = green.
  const color = (percentChange ?? 0) >= 0 ? "text-red-500 font-black" : "text-green-500 font-black";

  return (
    <div className="bg-surface rounded-modal p-10 shadow-premium border border-border/40 transition-all duration-700 hover:shadow-institutional group">
      <h3 className="text-[10px] font-black mb-8 text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-institutional-blue opacity-60" />
        Forensic Month Comparison
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="bg-background/40 p-8 rounded-2xl border border-border/40 shadow-inner transition-all duration-700 hover:bg-background/60">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Current Period</p>
          <p className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tighter leading-none">{formatCurrency(currentMonthTotal)}</p>
        </div>
        <div className="bg-background/40 p-8 rounded-2xl border border-border/40 shadow-inner transition-all duration-700 hover:bg-background/60">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Previous Period</p>
          <p className="text-3xl font-black text-foreground font-mono tabular-nums tracking-tighter leading-none">{formatCurrency(previousMonthTotal)}</p>
        </div>
      </div>
      <div className="mt-10 text-center bg-background py-5 rounded-2xl border border-border/40 shadow-inner relative overflow-hidden group/delta">
        <div className="absolute inset-0 bg-institutional-blue/5 opacity-0 group-hover/delta:opacity-100 transition-opacity duration-700" />
        {percentChange === null ? (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60 relative z-10">
            No Prior Period
          </span>
        ) : (
          <>
            <span className={`text-lg font-black font-mono tracking-tighter relative z-10 ${color}`}>
              {arrow} {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-4 opacity-60 relative z-10">Variance vs Previous</span>
          </>
        )}
      </div>
    </div>
  );
};
