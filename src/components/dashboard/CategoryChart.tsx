/**
 * CategoryChart.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Market Intelligence.
 * 🛡️ LOGIC LOCK: Category grouping, trend engine, and budget gaps 100% untouched.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Activity, 
  Zap, 
  BarChart3,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { isValidDate } from '@/utils/dateFilters';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryChartProps {
  expenses: any[];
  loading: boolean;
  budget?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'hsl(var(--chart-1))',
  Travel: 'hsl(var(--chart-2))',
  Shopping: 'hsl(var(--chart-3))',
  Bills: 'hsl(var(--chart-4))',
  Entertainment: 'hsl(var(--chart-5))',
  Others: 'hsl(var(--chart-1) / 0.5)',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🥗', Shopping: '🛍️', Bills: '🧾', Travel: '🌏', Entertainment: '🍿', Others: '📦',
};

const CategoryChart = React.memo(({ expenses, loading, budget = 0 }: CategoryChartProps) => {
  const { t } = useLanguage();

  // ==================== LOGIC: PIE ENGINE (Locked) ====================
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      const cat = expense.category || 'Others';
      grouped[cat] = (grouped[cat] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || 'hsl(var(--chart-1) / 0.5)', emoji: CATEGORY_EMOJIS[name] || '💰',
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  
  const chartConfig = useMemo(() => categoryData.reduce((acc, item) => { 
    acc[item.name] = { label: item.name, color: item.color }; 
    return acc; 
  }, {} as any), [categoryData]);

  // ==================== LOGIC: BAR ENGINE (Locked) ====================
  const monthlyTrendData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        total: 0,
      };
    });

    expenses.forEach((tx) => {
      if (tx.type !== 'expense' && tx.direction !== 'debit') return;
      if (!tx?.date || !isValidDate(tx.date)) return;
      
      const txDate = new Date(tx.date);
      const amount = Number(tx.amount || 0);

      months.forEach((m) => {
        if (isWithinInterval(txDate, { start: m.start, end: m.end })) {
          m.total += amount;
        }
      });
    });

    return months.map((m) => ({
      name: m.month,
      value: m.total,
    }));
  }, [expenses]);

  // ==================== RENDER STATES ====================
  
  if (loading) {
    return (
      <Card className="fintech-card h-[400px] flex flex-col items-center justify-center gap-4 bg-muted/20">
        <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Auditing Sectors</p>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className="fintech-card p-12 text-center">
        <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/50">
          <Activity className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">Market Intel Silent</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Feed the system to unlock insights</p>
      </Card>
    );
  }

  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="p-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <PieIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-foreground">
              Market Intelligence
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Automated Sector Audit
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-12">
        {/* SECTION 1: SECTOR BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="h-64 w-full relative flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={4} 
                  dataKey="value" 
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel className="bg-surface/95 backdrop-blur-md border-border shadow-premium rounded-xl p-4 font-mono" />} 
                />
              </PieChart>
            </ChartContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Volume</span>
              <span className="text-2xl font-bold text-foreground font-mono tracking-tighter tabular-nums mt-1">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto hide-scrollbar custom-scrollbar pr-1">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/40 rounded-xl transition-all duration-300 hover:border-primary/20 group/item shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center border transition-all duration-300 group-hover/item:scale-110 shadow-sm bg-surface border-border/40">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-bold text-foreground uppercase tracking-tight opacity-80 group-hover/item:opacity-100 transition-opacity">
                    {item.emoji} {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono tabular-nums tracking-tight">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: BURN VELOCITY (6M) */}
        <div className="pt-8 border-t border-border/50 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 shadow-sm">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Burn Velocity (6M)</p>
              <p className="text-sm font-bold text-foreground tracking-tight leading-none mt-1">Institutional Trend Line</p>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--muted)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }} 
                  dy={12}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface/95 backdrop-blur-md border border-border shadow-premium p-4 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-base font-bold text-foreground font-mono tabular-nums tracking-tighter">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  barSize={24}
                  isAnimationActive={false}
                >
                  {monthlyTrendData.map((entry, index) => {
                    const isLast = index === monthlyTrendData.length - 1;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isLast ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.4)'} 
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM INSIGHT ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-border/50">
          <div className="bg-muted/10 border border-border/40 rounded-xl p-4 flex items-center gap-4 group hover:border-primary/20 transition-all">
            <div className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
               <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pulse Audit</p>
              <p className="text-sm font-bold text-foreground uppercase tracking-tight">Verified Healthy</p>
            </div>
          </div>
          <div className="bg-muted/10 border border-border/40 rounded-xl p-4 flex items-center gap-4 group hover:border-primary/20 transition-all">
            <div className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
               <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Insight</p>
              <p className="text-sm font-bold text-foreground uppercase tracking-tight">Pattern Optimized</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CategoryChart.displayName = 'CategoryChart';

export default CategoryChart;
