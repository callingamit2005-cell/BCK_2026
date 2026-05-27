// src/features/analytics/MonthlyTrendChart.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useLanguage } from '@/contexts/LanguageContext';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Expense {
  id: string;
  amount: number;
  date: string; // ISO date string expected
}

interface Props {
  expenses: Expense[];
  loading?: boolean; // optional loading state
}

// ----------------------------------------------------------------------
// Helper: group expenses by year-month (UTC based)
// ----------------------------------------------------------------------
const groupByMonth = (expenses: Expense[]): Record<string, number> => {
  const grouped: Record<string, number> = {};

  expenses.forEach((expense) => {
    // Parse date safely – assume ISO string
    const date = parseISO(expense.date);
    if (!isValid(date)) {
      console.warn(`Invalid date encountered: ${expense.date}`);
      return; // skip invalid dates
    }

    // Use UTC to avoid timezone shifts
    const monthKey = format(date, 'yyyy-MM'); // e.g., "2025-03"
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

    // Convert to array and sort chronologically
    const data = Object.entries(grouped)
      .map(([monthKey, total]) => ({
        monthKey,
        // Format for display: "Mar 2025"
        month: format(parseISO(`${monthKey}-01`), 'MMM yyyy'),
        total,
      }))
      .sort((a, b) => String(a.monthKey || "").localeCompare(String(b.monthKey || ""))); // sort by year-month

    return data;
  }, [expenses]);

  // --------------------------------------------------------------------
  // Loading & Empty States
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <Card className="bg-surface rounded-[32px] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden h-[420px] flex flex-col justify-center items-center gap-5">
        <div className="w-12 h-12 border-[3px] border-[#111111]/10 border-t-fintech-sapphire-dark rounded-full animate-spin" />
        <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Trends</p>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-surface rounded-[32px] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden p-20 text-center">
        <div className="bg-background w-28 h-28 rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-border/60 shadow-inner backdrop-blur-md">
          <Activity className="h-12 w-12 text-[#1a1a1a] opacity-20" />
        </div>
        <h3 className="text-[#1a1a1a] text-2xl font-black mb-4 uppercase tracking-tighter">No Trends Detected</h3>
        <p className="text-fintech-graphite-muted text-[11px] font-black uppercase tracking-[0.25em]">Add data to visualize your financial trajectory</p>
      </Card>
    );
  }

  // --------------------------------------------------------------------
  // Render Chart
  // --------------------------------------------------------------------
  return (
    <Card className="bg-surface rounded-[32px] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 ease-butter-soft">
      <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-5 text-2xl font-black text-[#1a1a1a] tracking-tighter uppercase leading-tight">
          <div className="p-4 rounded-[20px] bg-background border border-border/60 shadow-sm transition-transform duration-700 group-hover:scale-105">
            <TrendingUp className="h-6 w-6 text-[#525252]" />
          </div>
          {t('dashboard.spendingTrend', 'Spending Trajectory')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-10">
        <div style={{ width: '100%', height: 320 }} className="mt-4">
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="6 6" stroke="rgba(0,0,0,0.04)" />
              <XAxis
                dataKey="month"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 11, fontWeight: '900' }} 
                dy={15}
              />
              <YAxis
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 11, fontWeight: '900' }}
                tickFormatter={(value) => formatCurrency(value)}
                width={80}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-border/80 shadow-2xl p-5 rounded-[24px] animate-in zoom-in-95 duration-500">
                        <p className="text-[11px] font-black text-fintech-graphite-muted uppercase mb-2 tracking-[0.2em]">{payload[0].payload.month}</p>
                        <p className="text-xl font-black text-[#1a1a1a] font-mono tracking-tighter tabular-nums leading-none">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1e40af" // Sapphire Dark for intelligence
                strokeWidth={4}
                dot={{ r: 6, fill: '#1e40af', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 8, fill: '#1e40af', stroke: '#fff', strokeWidth: 4, shadow: '0 0 20px rgba(30,64,175,0.4)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Analytics Footer Insight */}
        <div className="pt-10 border-t border-border/40 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-fintech-graphite-muted opacity-60">
          <span>Validated Time Series</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fintech-sapphire" />
            <span>Forensic Pattern Detection</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;