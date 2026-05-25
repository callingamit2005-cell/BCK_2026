import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { isToday, differenceInDays } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  payment_mode: string | null;
  date: string;
}

interface CategoryChartProps {
  expenses: Expense[];
  loading: boolean;
  budget?: number; // monthly budget (if set)
}

// Colourful colours for each slice of the pie
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',        // orange
  Shopping: '#ec4899',    // pink
  Bills: '#3b82f6',       // blue
  Travel: '#8b5cf6',      // purple
  Entertainment: '#a855f7', // purple
  Others: '#6b7280',      // grey
};

// Friendly names with emojis
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔',
  Shopping: '🛒',
  Bills: '📄',
  Travel: '✈️',
  Entertainment: '🎬',
  Others: '📦',
};

const CategoryChart = ({ expenses, loading, budget = 0 }: CategoryChartProps) => {
  // ========== GROUP EXPENSES BY CATEGORY ==========
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((expense) => {
      const cat = expense.category;
      grouped[cat] = (grouped[cat] || 0) + expense.amount;
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Others,
      emoji: CATEGORY_EMOJIS[name] || '💰',
    }));
  }, [expenses]);

  const total = useMemo(
    () => categoryData.reduce((sum, item) => sum + item.value, 0),
    [categoryData]
  );

  // ========== TODAY'S SPENDING GAP ==========
  const todaySpending = useMemo(() => {
    return expenses
      .filter((e) => isToday(new Date(e.date)))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const dailyBudget = useMemo(() => {
    if (!budget) return 0;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return budget / daysInMonth;
  }, [budget]);

  const spendingGap = todaySpending - dailyBudget;

  // ========== ANOMALY WATCH ==========
  const otherExpensesCount = useMemo(() => {
    return expenses.filter((e) => e.category === 'Others' || !CATEGORY_COLORS[e.category]).length;
  }, [expenses]);

  const lastExpenseDate = useMemo(() => {
    if (expenses.length === 0) return null;
    return new Date(Math.max(...expenses.map((e) => new Date(e.date).getTime())));
  }, [expenses]);

  const daysSinceLastExpense = useMemo(() => {
    if (!lastExpenseDate) return null;
    return differenceInDays(new Date(), lastExpenseDate);
  }, [lastExpenseDate]);

  // ========== LOADING / EMPTY STATES ==========
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Where did your money go?</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading picture...</div>
        </CardContent>
      </Card>
    );
  }

  if (categoryData.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Where did your money go?</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p>No expenses yet!</p>
            <p className="text-sm">Add your first expense to see the magic ✨</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========== RENDER ==========
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Where did your money go? 🪙</CardTitle>
      </CardHeader>

      <CardContent>
        {/* PIE CHART + LEGEND */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PIE CHART */}
          <ChartContainer
            config={categoryData.reduce((acc, item) => {
              acc[item.name] = { label: item.name, color: item.color };
              return acc;
            }, {} as any)}
            className="h-64"
          >
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number) => (
                      <span>₹{Number(value).toLocaleString()}</span>
                    )}
                  />
                }
              />
            </PieChart>
          </ChartContainer>

          {/* LEGEND with emojis and percentages */}
          <div className="flex flex-col justify-center space-y-2">
            {categoryData.map((item) => {
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">
                      {item.emoji} {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">₹{item.value.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">({percent}%)</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO HELPER CARDS (super simple language) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TODAY'S SPENDING CARD */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <h4 className="font-semibold text-gray-700">Today's Spending</h4>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                You spent <span className="font-bold">₹{todaySpending.toLocaleString()}</span> today.
              </p>
              {dailyBudget > 0 && (
                <p className="text-sm">
                  Your daily limit is <span className="font-bold">₹{dailyBudget.toFixed(0)}</span>.
                </p>
              )}
              {dailyBudget > 0 && (
                <div className="mt-2">
                  {spendingGap <= 0 ? (
                    <p className="text-green-600 text-sm flex items-center gap-1">
                      👍 Great! You saved ₹{Math.abs(spendingGap).toFixed(0)} today.
                    </p>
                  ) : (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      ⚠️ Oops! You spent ₹{spendingGap.toFixed(0)} more than your limit.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ANOMALY WATCH CARD */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔍</span>
              <h4 className="font-semibold text-gray-700">Little Things to Notice</h4>
            </div>
            <div className="space-y-2 text-sm">
              {otherExpensesCount > 0 ? (
                <p className="flex items-center gap-1">
                  📦 You have {otherExpensesCount} expense(s) in "Others".  
                  Maybe you forgot to name them?
                </p>
              ) : (
                <p className="flex items-center gap-1 text-green-600">
                  ✅ All your expenses are nicely labeled!
                </p>
              )}
              {lastExpenseDate && (
                <p className="flex items-center gap-1">
                  🕒 Last time you spent: {lastExpenseDate.toLocaleDateString()}
                </p>
              )}
              {daysSinceLastExpense && daysSinceLastExpense > 2 && (
                <p className="text-amber-600 text-xs">
                  ⏰ You haven't spent in {daysSinceLastExpense} days. Saving money? 😊
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;