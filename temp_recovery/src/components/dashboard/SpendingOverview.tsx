import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet } from 'lucide-react';

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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Spending Overview</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm"><CardContent className="h-64 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="h-64 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></CardContent></Card>
        </div>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Spending Overview</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No spending data yet</p>
            <p className="text-sm">Add expenses to see your overview</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">Spending Overview</h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart – Category Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ChartContainer config={categoryChartConfig} className="h-52 w-52 flex-shrink-0">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
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
                          <span className="font-medium">₹{Number(value).toLocaleString()}</span>
                        )}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              <div className="flex-1 space-y-2 w-full">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{item.value.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {((item.value / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart – Payment Mode Totals (replaces Category Totals) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Payment Mode Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentChartConfig} className="h-64 w-full">
              <BarChart
                data={paymentModeData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-border" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  className="text-xs fill-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium">₹{Number(value).toLocaleString()}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
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