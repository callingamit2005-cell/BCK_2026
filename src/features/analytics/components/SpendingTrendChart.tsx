import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MonthlyTotal } from "@/types/analytics";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  data: MonthlyTotal[];
}

export const SpendingTrendChart = ({ data }: Props) => {
  const { t } = useLanguage();
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border/40 rounded-premium p-10 h-[400px] flex flex-col items-center justify-center text-center shadow-premium">
        <h3 className="text-foreground text-2xl font-black mb-4 uppercase tracking-tighter">
          {t('charts.noTrendsDetected', 'No Trends Detected')}
        </h3>
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
          {t('charts.addDataToVisualize', 'Add data to visualize your financial trajectory')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border/40 rounded-premium p-8 h-[400px] shadow-premium relative overflow-hidden group transition-all duration-700 hover:shadow-institutional">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-institutional-blue animate-pulse" />
             {t('dashboard.spendingTrends', 'Spending Trends')}
          </h3>
          <p className="text-xl font-black text-foreground uppercase tracking-tighter">
            {t('charts.validatedTimeSeries', 'Validated Time Series')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">
             {t('charts.forensicPatternDetection', 'Forensic Pattern Detection')}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--text-muted))" }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: "16px", padding: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
            itemStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(var(--foreground))" }}
            labelStyle={{ display: "none" }}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="hsl(var(--institutional-blue))" 
            strokeWidth={4} 
            dot={{ r: 0 }} 
            activeDot={{ r: 8, fill: "hsl(var(--institutional-blue))", stroke: "hsl(var(--surface))", strokeWidth: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
