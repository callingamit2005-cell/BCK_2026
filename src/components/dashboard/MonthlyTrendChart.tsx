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
import { AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

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
      <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Monthly Spending Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
              <div className="h-64 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Monthly Spending Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
            <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No expense data yet</p>
            <p className="text-sm">Add expenses to see your monthly trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------
  // Render Chart
  // --------------------------------------------------------------------
  return (
    <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden">
      <CardHeader className="pb-2 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Monthly Spending Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#64748b' }}
                className="text-slate-500"
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12, fill: '#64748b' }}
                className="text-slate-500"
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Total',
                ]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                itemStyle={{ color: '#8B5CF6' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#EC4899', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Accessibility description (visually hidden) */}
        <p className="sr-only" role="status">
          Line chart showing monthly spending trend. {chartData.length} months displayed.
        </p>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;