// src/features/analytics/SpendingOverview.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Expense {
  id: string;
  amount: number;
  category: string;
  payment_mode: string | null;
  date: string;
}

interface SpendingOverviewProps {
  expenses: Expense[];
  loading: boolean;
}

// Enterprise‑grade gradient colors (purple/pink family)
const GRADIENT_COLORS = [
  '#8b5cf6', // purple-600
  '#ec4899', // pink-500
  '#a855f7', // purple-500
  '#f43f5e', // rose-500
  '#6366f1', // indigo-500
  '#d946ef', // fuchsia-500
  '#c084fc', // purple-400
  '#f472b6', // pink-400
];

const SpendingOverview = ({ expenses, loading }: SpendingOverviewProps) => {
  // 1. Category data for pie chart
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        color: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value); // sort descending
  }, [expenses]);

  // 2. Payment mode data for bar chart
  const paymentModeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((e) => {
      const mode = e.payment_mode || 'Other';
      grouped[mode] = (grouped[mode] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        color: GRADIENT_COLORS[(index + 3) % GRADIENT_COLORS.length], // shift index for variety
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Chart configs for tooltip (needed by ChartContainer)
  const categoryChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    categoryData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.color };
    });
    return config;
  }, [categoryData]);

  const paymentChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    paymentModeData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.color };
    });
    return config;
  }, [paymentModeData]);

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Spending Overview
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100">
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse space-y-3 w-3/4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-slate-100 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100">
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse space-y-3 w-3/4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-slate-100 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Spending Overview
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100">
          <CardContent className="py-16 text-center text-slate-400">
            <Wallet className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No spending data yet</p>
            <p className="text-sm">Add expenses to see your overview</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Spending Overview
        </h2>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie Chart – Category Distribution */}
        <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-base font-bold text-slate-700">
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <ChartContainer config={categoryChartConfig} className="h-56 w-56 flex-shrink-0">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono font-bold">{formatCurrency(Number(value))}</span>
                        )}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              <div className="flex-1 space-y-3 w-full">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-xs font-mono text-slate-400 w-10 text-right">
                        {((item.value / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-base">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart – Payment Mode Totals */}
        <Card className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-base font-bold text-slate-700">
              Payment Mode Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ChartContainer config={paymentChartConfig} className="h-64 w-full">
              <BarChart
                data={paymentModeData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  className="stroke-slate-200"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  className="text-xs fill-slate-400"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  className="text-xs fill-slate-600 font-medium"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-bold">{formatCurrency(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {paymentModeData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpendingOverview;