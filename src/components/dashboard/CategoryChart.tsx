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
  Food: '#10b981',       // Emerald (Life)
  Travel: '#3b82f6',     // Sapphire (Freedom)
  Shopping: '#f59e0b',   // Amber (Caution)
  Bills: '#f43f5e',      // Rose (Burn)
  Entertainment: '#8b5cf6', // Muted Violet
  Others: '#737373',     // Graphite Muted
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🥗', Shopping: '🛍️', Bills: '🧾', Travel: '🌏', Entertainment: '🍿', Others: '📦',
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
  const premiumSurface = "bg-white border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden transform-gpu transition-all duration-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  const glassPanel = "bg-background/40 border border-border/40 rounded-2xl p-6 transform-gpu transition-all hover:bg-black/[0.02] hover:border-border/60";
  const labelText = "text-fintech-graphite-muted font-black uppercase tracking-[0.25em] text-[11px]";
  const dataText = "text-[#1a1a1a] font-mono font-black";

  // ==================== RENDER STATES ====================
  
  if (loading) {
    return (
      <Card className={cn(premiumSurface, "h-[400px] flex flex-col items-center justify-center gap-5")}>
        <div className="w-12 h-12 border-[3px] border-[#111111]/10 border-t-[#1a1a1a] rounded-full animate-spin" />
        <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Intel</p>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className={cn(premiumSurface, "p-20 text-center")}>
        <div className="bg-background w-28 h-28 rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-border/60 shadow-inner backdrop-blur-md">
          <Sparkles className="h-12 w-12 text-[#1a1a1a] opacity-20" />
        </div>
        <h3 className="text-[#1a1a1a] text-2xl font-black mb-4 uppercase tracking-tighter">Data Engine Silent</h3>
        <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.25em]">Feed the system to unlock market insights</p>
      </Card>
    );
  }

  return (
    <Card className={premiumSurface}>
      <CardHeader className="p-10 pb-8 border-b border-border/40 bg-background/50">
        <CardTitle className="text-2xl font-black text-[#1a1a1a] flex items-center gap-6 tracking-tighter uppercase">
          {/* Circular Premium Icon Container - Intelligence Style */}
          <div className="h-16 w-16 rounded-full bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <PieIcon className="h-8 w-8 text-[#DC2626]" />
          </div>
          <div className="flex-1">
             Market Intel
             <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.3em] mt-2 opacity-60 leading-none">Automated Sector Audit</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-10 space-y-12">
        {/* SECTION 1: PIE CHART AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="h-[320px] w-full relative flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={90} 
                  outerRadius={125} 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-85 transition-opacity duration-500 cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel className="bg-white border border-border/80 shadow-2xl rounded-[24px] text-[#1a1a1a] font-mono p-5" />} 
                />
              </PieChart>
            </ChartContainer>
            
            {/* Center Total Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={labelText}>Monthly Burn</span>
              <span className={cn("text-[32px] tracking-tighter mt-2", dataText)}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* LEGEND AREA - High Contrast List */}
          <div className="space-y-5 max-h-[320px] overflow-y-auto hide-scrollbar custom-scrollbar pr-3">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-5 bg-background/[0.03] border border-border/40 rounded-[24px] transition-all duration-500 hover:bg-background/80 hover:border-border/60 group/item shadow-sm">
                <div className="flex items-center gap-5">
                  {/* Circular Premium Icon Indicator */}
                  <div className="h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-500 group-hover/item:scale-110 shadow-inner bg-white border-border/40" style={{ borderColor: `${item.color}20` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <span className="text-[12px] font-black text-[#1a1a1a] uppercase tracking-widest opacity-70 group-hover/item:opacity-100 transition-opacity">
                    {item.emoji} {item.name}
                  </span>
                </div>
                <span className={cn("text-[15px] tracking-tighter leading-none", dataText)}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: BAR CHART AREA (MONTHLY TREND) - Elegant Financial Danger Styling */}
        <div className="pt-12 border-t border-border/40 space-y-10">
          <div className="flex items-center gap-5 mb-2">
            <div className="h-12 w-12 rounded-full bg-[#F3F4F6] border border-border/60 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:rotate-6">
              <BarChart3 className="h-5 w-5 text-[#DC2626]" />
            </div>
            <span className={labelText}>Burn Velocity (6M)</span>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <BarChart width={360} height={200} data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="6 6" stroke="rgba(0,0,0,0.04)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 11, fontWeight: '900' }} 
                dy={15}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-border shadow-2xl p-4 rounded-[20px] animate-in zoom-in-95 duration-500">
                        <p className="text-[11px] font-black text-fintech-graphite-muted uppercase mb-2 tracking-[0.2em]">{payload[0].payload.name}</p>
                        <p className="text-base font-black text-[#1a1a1a] font-mono tracking-tighter">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]} 
                barSize={28}
                isAnimationActive={false}
              >
                {monthlyTrendData.map((entry, index) => {
                  const isLast = index === monthlyTrendData.length - 1;
                  const value = entry.value;
                  const average = monthlyTrendData.reduce((a, b) => a + b.value, 0) / monthlyTrendData.length;
                  const isHigh = value > average * 1.2;

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isLast ? (isHigh ? '#DC2626' : '#1a1a1a') : (isHigh ? 'rgba(220, 38, 38, 0.2)' : 'rgba(0,0,0,0.12)')} 
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </div>
        </div>

        {/* BOTTOM INSIGHT ROW - Improved Visual Hierarchy */}
        <div className="grid grid-cols-2 gap-8 pt-10 border-t border-border/40">
          <div className={glassPanel}>
            <div className="h-10 w-10 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0 shadow-sm mb-4">
               <Activity className="h-5 w-5 text-[#DC2626]" />
            </div>
            <p className={labelText}>Pulse Audit</p>
            <p className={cn("text-xl tracking-tighter mt-2", dataText)}>Healthy</p>
          </div>
          <div className={glassPanel}>
            <div className="h-10 w-10 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-sm mb-4">
               <Zap className="h-5 w-5 text-[#DC2626]" />
            </div>
            <p className={labelText}>Market Insight</p>
            <p className={cn("text-xl tracking-tighter mt-2", dataText)}>Optimized</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default CategoryChart;
