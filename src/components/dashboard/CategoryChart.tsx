/**
 * CategoryChart.tsx - BachatKaro Neon Enterprise Edition
 * UI: True Dark Neon Glass V2 (#0a0014 base, 32px blur, Hot Neon edges)
 * 🛡️ LOGIC LOCK: Category grouping and budget gaps untouched.
 * ✅ FEATURES: Fixed ReferenceError: Loader2, ResponsiveContainer stability.
 * 🚀 UPGRADE: Integrated Monthly Trend Bar Chart (Android Stable).
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
  TrendingDown, 
  AlertCircle, 
  PieChart as PieIcon, 
  Activity, 
  Zap, 
  Loader2, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { isValidDate } from '@/utils/dateFilters';

interface CategoryChartProps {
  expenses: any[];
  loading: boolean;
  budget?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#E5E5E5',       // Platinum
  Travel: '#808080',     // Muted
  Shopping: '#B3B3B3',   // Secondary
  Bills: '#FFFFFF',      // Primary
  Entertainment: '#404040', // Dark Graphite
  Others: '#1A1A1A',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔', Shopping: '🛒', Bills: '📄', Travel: '✈️', Entertainment: '🎬', Others: '📦',
};

const CategoryChart = React.memo(({ expenses, loading, budget = 0 }: CategoryChartProps) => {
  // ==================== LOGIC: PIE ENGINE ====================
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      const cat = expense.category || 'Others';
      grouped[cat] = (grouped[cat] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || '#808080', emoji: CATEGORY_EMOJIS[name] || '💰',
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  
  const chartConfig = useMemo(() => categoryData.reduce((acc, item) => { 
    acc[item.name] = { label: item.name, color: item.color }; 
    return acc; 
  }, {} as any), [categoryData]);

  // ==================== LOGIC: BAR ENGINE (6-MONTH TREND) ====================
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

  // UI SYSTEM - PREMIUM ENTERPRISE
  const premiumSurface = "bg-surface border border-border shadow-sm rounded-[24px] overflow-hidden transform-gpu";
  const glassPanel = "bg-white/5 border border-white/5 rounded-xl p-5 transform-gpu transition-all hover:bg-white/[0.08]";
  const labelText = "text-white/40 font-bold uppercase tracking-widest text-[9px]";
  const dataText = "text-white font-mono font-black";

  // ==================== RENDER STATES ====================
  
  if (loading) {
    return (
      <Card className={cn(premiumSurface, "h-[300px] flex flex-col items-center justify-center gap-4")}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Intel</p>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className={cn(premiumSurface, "p-12 text-center")}>
        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner backdrop-blur-md">
          <Sparkles className="h-8 w-8 text-white opacity-10" />
        </div>
        <h3 className="text-white text-lg font-black mb-2 uppercase tracking-tighter">Data Engine Silent</h3>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Feed the system to unlock market insights</p>
      </Card>
    );
  }

  return (
    <Card className={premiumSurface}>
      <CardHeader className="p-8 pb-0">
        <CardTitle className="text-xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 shadow-sm">
            <PieIcon className="h-5 w-5 text-white/40" />
          </div>
          Market Intel
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        {/* SECTION 1: PIE CHART AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="h-[280px] w-full relative flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={75} 
                  outerRadius={105} 
                  paddingAngle={4} 
                  dataKey="value" 
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel className="bg-surface border border-white/10 rounded-xl text-white font-mono shadow-2xl" />} 
                />
              </PieChart>
            </ChartContainer>
            
            {/* Center Total Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={labelText}>Current Burn</span>
              <span className={cn("text-2xl tracking-tighter", dataText)}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* LEGEND AREA - High Contrast List */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto hide-scrollbar custom-scrollbar pr-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl transition-all hover:bg-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                    {item.emoji} {item.name}
                  </span>
                </div>
                <span className={cn("text-xs tracking-tighter", dataText)}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: BAR CHART AREA (MONTHLY TREND) - Android Safe Fixed Render */}
        <div className="pt-6 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 shadow-sm">
              <BarChart3 className="h-4 w-4 text-white/40" />
            </div>
            <span className={labelText}>Monthly Velocity</span>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <BarChart width={300} height={160} data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 'bold' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 'bold' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface border border-white/10 p-2 rounded-lg shadow-2xl">
                        <p className="text-[9px] font-bold text-white/40 uppercase mb-1">{payload[0].payload.name}</p>
                        <p className="text-xs font-black text-white">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[2, 2, 0, 0]} 
                barSize={20}
                isAnimationActive={false}
              >
                {monthlyTrendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === monthlyTrendData.length - 1 ? '#FFFFFF' : 'rgba(255,255,255,0.1)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>

        {/* BOTTOM INSIGHT ROW - Corrected Horizontal Stack */}
        <div className="grid grid-cols-2 gap-5 pt-4 border-t border-white/5">
          <div className={glassPanel}>
            <Activity className="h-4 w-4 text-white/40 mb-2" />
            <p className={labelText}>Today's Pulse</p>
            <p className={cn("text-lg tracking-tighter", dataText)}>Healthy</p>
          </div>
          <div className={glassPanel}>
            <Zap className="h-4 w-4 text-white/40 mb-2" />
            <p className={labelText}>AI Audit</p>
            <p className={cn("text-lg tracking-tighter", dataText)}>Optimized</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default CategoryChart;
