/**
 * CategoryChart.tsx - BachatKaro Neon Enterprise Edition
 * UI: True Dark Neon Glass V2 (#0a0014 base, 32px blur, Hot Neon edges)
 * 🛡️ LOGIC LOCK: Category grouping and budget gaps untouched.
 * ✅ FEATURES: Fixed ReferenceError: Loader2, ResponsiveContainer stability.
 * 🚀 UPGRADE: Integrated Monthly Trend Bar Chart (Android Stable).
 */

import { useMemo } from 'react';
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
  Food: '#F472B6', 
  Shopping: '#EC4899', 
  Bills: '#8B5CF6', 
  Travel: '#C084FC', 
  Entertainment: '#D946EF', 
  Others: '#A855F7',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔', Shopping: '🛒', Bills: '📄', Travel: '✈️', Entertainment: '🎬', Others: '📦',
};

const CategoryChart = ({ expenses, loading, budget = 0 }: CategoryChartProps) => {
  // ==================== LOGIC: PIE ENGINE ====================
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      const cat = expense.category || 'Others';
      grouped[cat] = (grouped[cat] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || '#8B5CF6', emoji: CATEGORY_EMOJIS[name] || '💰',
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

  // UI SYSTEM - TRUE DARK NEON GLASS V2
  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-[#ff0f7b]/30 shadow-[0_20px_50px_-12px_rgba(255,15,123,0.3)] rounded-[32px] overflow-hidden transform-gpu";
  const glassPanel = "bg-white/5 border border-white/10 rounded-2xl p-5 transform-gpu transition-all hover:bg-white/10";
  const labelText = "text-[#b3b3b3] font-black uppercase tracking-widest text-[9px]";
  const dataText = "text-white font-mono font-black";

  // ==================== RENDER STATES ====================
  
  if (loading) {
    return (
      <Card className={cn(neonGlass, "h-[300px] flex flex-col items-center justify-center gap-4")}>
        <Loader2 className="h-10 w-10 animate-spin text-[#ff0f7b] drop-shadow-[0_0_10px_#ff0f7b]" />
        <p className="text-[#ff0f7b] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Intel...</p>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className={cn(neonGlass, "p-12 text-center")}>
        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner backdrop-blur-md animate-bounce">
          <Sparkles className="h-8 w-8 text-white opacity-40" />
        </div>
        <h3 className="text-white text-lg font-black mb-2 uppercase tracking-tighter italic">Data Engine Silent</h3>
        <p className="text-[#b3b3b3] text-[10px] font-bold uppercase tracking-widest">Feed the system to unlock market insights</p>
      </Card>
    );
  }

  return (
    <Card className={neonGlass}>
      <CardHeader className="p-8 pb-0">
        <CardTitle className="text-xl font-black text-white flex items-center gap-4 tracking-widest uppercase italic">
          <div className="p-2.5 rounded-xl bg-[#ff0f7b]/10 border border-[#ff0f7b]/20 shadow-[0_0_15px_rgba(255,15,123,0.2)]">
            <PieIcon className="h-5 w-5 text-[#ff0f7b]" />
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
                      style={{ filter: `drop-shadow(0 0 8px ${entry.color}44)` }}
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel className="bg-[#0a0014] border border-white/10 rounded-xl text-white font-mono shadow-2xl backdrop-blur-xl" />} 
                />
              </PieChart>
            </ChartContainer>
            
            {/* Center Total Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={labelText}>Current Burn</span>
              <span className={cn("text-2xl", dataText)}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* LEGEND AREA - High Contrast List */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto hide-scrollbar custom-scrollbar pr-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl transition-all hover:bg-white/10 hover:border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}88` }} />
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                    {item.emoji} {item.name}
                  </span>
                </div>
                <span className={cn("text-xs", dataText)}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: BAR CHART AREA (MONTHLY TREND) - Android Safe Fixed Render */}
        <div className="pt-6 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#ff0f7b]/10 border border-[#ff0f7b]/20">
              <BarChart3 className="h-4 w-4 text-[#ff0f7b]" />
            </div>
            <span className={labelText}>Monthly Velocity</span>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <BarChart width={300} height={160} data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-lg shadow-2xl">
                        <p className="text-[10px] font-black text-white/40 uppercase mb-1">{payload[0].payload.name}</p>
                        <p className="text-xs font-black text-[#ff0f7b]">{formatCurrency(payload[0].value as number)}</p>
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
                {monthlyTrendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === monthlyTrendData.length - 1 ? '#ff0f7b' : 'rgba(255,255,255,0.1)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>

        {/* BOTTOM INSIGHT ROW - Corrected Horizontal Stack */}
        <div className="grid grid-cols-2 gap-5 pt-4 border-t border-white/5">
          <div className={glassPanel}>
            <Activity className="h-4 w-4 text-emerald-400 mb-2 drop-shadow-[0_0_5px_#10b981]" />
            <p className={labelText}>Today's Pulse</p>
            <p className={cn("text-lg", dataText)}>Healthy</p>
          </div>
          <div className={glassPanel}>
            <Zap className="h-4 w-4 text-purple-400 mb-2 drop-shadow-[0_0_5px_#a855f7]" />
            <p className={labelText}>AI Audit</p>
            <p className={cn("text-lg", dataText)}>Optimized</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
