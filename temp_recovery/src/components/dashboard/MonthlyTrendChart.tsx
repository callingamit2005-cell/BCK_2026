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
import { AlertCircle } from 'lucide-react';

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
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)); // sort by year-month

    return data;
  }, [expenses]);

  // --------------------------------------------------------------------
  // Loading & Empty States
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p>No expense data yet</p>
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
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Total']}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4, fill: '#16a34a' }}
                activeDot={{ r: 6 }}
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