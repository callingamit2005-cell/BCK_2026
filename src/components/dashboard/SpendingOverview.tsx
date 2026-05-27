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

// Enterprise‑grade monochrome palette
const MONOCHROME_COLORS = [
  '#111111', // foreground
  '#666666', // text-secondary
  '#999999', // text-muted
  '#333333',
  '#4D4D4D',
  '#808080',
  '#B3B3B3',
  '#CCCCCC',
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
        color: MONOCHROME_COLORS[index % MONOCHROME_COLORS.length],
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
        color: MONOCHROME_COLORS[(index + 3) % MONOCHROME_COLORS.length], // shift index for variety
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Spending Overview
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-surface rounded-2xl shadow-sm border border-border">
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-3/4">
                <div className="h-4 bg-background rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-background rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface rounded-2xl shadow-sm border border-border">
            <CardContent className="h-64 flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-3/4">
                <div className="h-4 bg-background rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-background rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Spending Overview
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Card className="bg-surface rounded-2xl shadow-sm border border-border">
          <CardContent className="py-20 text-center text-text-secondary">
            <Wallet className="h-16 w-16 mx-auto mb-6 text-text-muted" />
            <p className="text-lg font-bold text-foreground mb-1 uppercase tracking-tight">Zero Records</p>
            <p className="text-[11px] font-bold uppercase tracking-widest">Add transactions to generate intelligence</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground">
          Spending Overview
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart – Category Distribution */}
        <Card className="bg-surface rounded-[24px] shadow-sm border border-border overflow-hidden">
          <CardHeader className="pb-4 border-b border-border bg-background">
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">
              Category Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-8">
              <ChartContainer config={categoryChartConfig} className="h-64 w-64 flex-shrink-0">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={96}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={4}
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
                          <span className="font-mono font-bold text-foreground">{formatCurrency(Number(value))}</span>
                        )}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              <div className="flex-1 space-y-4 w-full">
                {categoryData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-sm shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-text-secondary font-bold uppercase tracking-tight">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-foreground font-mono">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-text-muted w-10 text-right">
                        {((item.value / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm font-bold text-foreground uppercase tracking-widest">
                    <span>Aggregate</span>
                    <span className="text-lg font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart – Payment Mode Totals */}
        <Card className="bg-surface rounded-[24px] shadow-sm border border-border overflow-hidden">
          <CardHeader className="pb-4 border-b border-border bg-background">
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">
              Payment Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={paymentChartConfig} className="h-64 w-full">
              <BarChart
                data={paymentModeData}
                layout="vertical"
                margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={true}
                  vertical={false}
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] font-bold fill-text-muted uppercase"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  className="text-[11px] fill-text-secondary font-bold uppercase tracking-tight"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-bold text-foreground">{formatCurrency(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
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