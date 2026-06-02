/**
 * SpendingOverview.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Data Visualization.
 * 🛡️ LOGIC LOCK: Data aggregation, sorting, and chart logic 100% untouched.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Wallet, PieChart as PieChartIcon, BarChart3, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { cn } from '@/lib/utils';

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

// Institutional Chart Palette mapped to CSS variables
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SpendingOverview = ({ expenses, loading }: SpendingOverviewProps) => {
  // 1. Category data for pie chart (Locked)
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((e) => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // 2. Payment mode data for bar chart (Locked)
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
        color: CHART_COLORS[(index + 2) % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Chart configs (Locked)
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
          <h2 className="text-xl font-bold text-foreground tracking-tight">Spending Overview</h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="fintech-card h-80 animate-pulse bg-muted/20" />
          <Card className="fintech-card h-80 animate-pulse bg-muted/20" />
        </div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Spending Overview</h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <Card className="fintech-card">
          <CardContent className="py-20 text-center">
            <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/50">
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-bold text-foreground mb-1">No Spending Data</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Add transactions to generate intelligence</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Spending Overview</h2>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart – Category Distribution */}
        <Card className="fintech-card overflow-hidden">
          <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon className="h-3.5 w-3.5 text-primary" />
              Category Matrix
            </CardTitle>
            <div className="h-7 px-2.5 bg-surface border border-border rounded-md flex items-center gap-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-foreground font-mono">{categoryData.length}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Sectors</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col xl:flex-row items-center gap-8">
              <div className="relative h-64 w-64 flex-shrink-0">
                <ChartContainer config={categoryChartConfig} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="bg-surface/95 backdrop-blur-md border-border shadow-premium rounded-xl"
                          formatter={(value) => (
                            <span className="font-mono font-bold text-foreground">{formatCurrency(Number(value))}</span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                  <span className="text-xl font-bold text-foreground font-mono tracking-tighter">
                    ₹{(total / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3.5 w-full">
                {categoryData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-foreground font-mono tabular-nums">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-muted-foreground/60 w-8 text-right">
                        {((item.value / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-muted-foreground font-medium">
                     <Info className="h-3.5 w-3.5" />
                     <span>Net Volume</span>
                   </div>
                   <span className="font-bold text-foreground font-mono tracking-tight">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart – Payment Mode Totals */}
        <Card className="fintech-card overflow-hidden">
          <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Payment Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={paymentChartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentModeData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, bottom: 5, left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    horizontal={true}
                    vertical={false}
                    className="stroke-muted/30"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    className="text-[10px] font-bold fill-muted-foreground font-mono"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    className="text-[10px] fill-muted-foreground font-bold uppercase tracking-tight"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="bg-surface/95 backdrop-blur-md border-border shadow-premium rounded-xl"
                        formatter={(value) => (
                          <span className="font-mono font-bold text-foreground">{formatCurrency(Number(value))}</span>
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
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpendingOverview;
