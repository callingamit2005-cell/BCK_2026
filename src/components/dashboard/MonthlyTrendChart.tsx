/**
 * MonthlyTrendChart.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Trend Visualization.
 * 🛡️ LOGIC LOCK: Grouping, sorting, and trend logic 100% untouched.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  defs,
  linearGradient,
  stop
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { TrendingUp, Activity, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------
// Types (Locked)
// ----------------------------------------------------------------------
interface Expense {
  id: string;
  amount: number;
  date: string;
}

interface Props {
  expenses: Expense[];
  loading?: boolean;
}

// ----------------------------------------------------------------------
// Helper: group expenses by year-month (Locked)
// ----------------------------------------------------------------------
const groupByMonth = (expenses: Expense[]): Record<string, number> => {
  const grouped: Record<string, number> = {};
  expenses.forEach((expense) => {
    const date = parseISO(expense.date);
    if (!isValid(date)) return;
    const monthKey = format(date, 'yyyy-MM');
    grouped[monthKey] = (grouped[monthKey] || 0) + expense.amount;
  });
  return grouped;
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
const MonthlyTrendChart = ({ expenses, loading = false }: Props) => {
  const { t } = useLanguage();

  const chartData = useMemo(() => {
    const grouped = groupByMonth(expenses);
    return Object.entries(grouped)
      .map(([monthKey, total]) => ({
        monthKey,
        month: format(parseISO(`${monthKey}-01`), 'MMM yyyy'),
        total,
      }))
      .sort((a, b) => String(a.monthKey || "").localeCompare(String(b.monthKey || "")));
  }, [expenses]);

  // --------------------------------------------------------------------
  // Loading & Empty States
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <Card className="fintech-card h-80 flex flex-col justify-center items-center gap-4 bg-muted/20">
        <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analyzing Trends</p>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="fintech-card p-12 text-center">
        <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/50">
          <Activity className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">No Trends Detected</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Add transactions to visualize your trajectory</p>
      </Card>
    );
  }

  // --------------------------------------------------------------------
  // Render Chart
  // --------------------------------------------------------------------
  return (
    <Card className="fintech-card overflow-hidden group">
      <CardHeader className="p-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {t('dashboard.spendingTrend', 'Spending Trajectory')}
        </CardTitle>
        <div className="h-7 px-2.5 bg-surface border border-border rounded-md flex items-center gap-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-foreground font-mono">{chartData.length}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Cycles</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="4 4" 
                stroke="hsl(var(--muted)/0.3)" 
              />
              <XAxis
                dataKey="month"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }} 
                dy={12}
              />
              <YAxis
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface/95 backdrop-blur-md border border-border shadow-premium p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {payload[0].payload.month}
                        </p>
                        <p className="text-lg font-bold text-foreground font-mono tabular-nums tracking-tighter leading-none">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                activeDot={{ 
                  r: 6, 
                  fill: 'hsl(var(--primary))', 
                  stroke: 'hsl(var(--surface))', 
                  strokeWidth: 3,
                  className: "shadow-premium"
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Analytics Footer Insight */}
        <div className="mt-8 pt-5 border-t border-border/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Info className="h-3.5 w-3.5" />
            <span>Time Series Audit</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stable Trend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

MonthlyTrendChart.displayName = 'MonthlyTrendChart';

export default MonthlyTrendChart;
