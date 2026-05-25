import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsData, MonthlyTotal, CategoryTotal } from "@/types/analytics";

export const useAnalyticsData = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!session?.user) throw new Error("Not authenticated");

      // Fetch all expenses for this user using your actual column names
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .eq("user_id", session.user.id)
        .order("expense_date", { ascending: true });

      if (error) throw error;

      // If no expenses, return empty data
      if (!expenses || expenses.length === 0) {
        return {
          monthlyTotals: [],
          categoryTotals: [],
          currentMonthTotal: 0,
          previousMonthTotal: 0,
          percentChange: 0,
        };
      }

      const monthlyMap = new Map<string, number>();
      const categoryMap = new Map<string, number>();

      let currentMonthTotal = 0;
      let previousMonthTotal = 0;

      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 7);

      expenses.forEach((exp) => {
        const amount = exp.amount;
        const cat = exp.category || "Uncategorized";
        // expense_date is like "2026-02-17 00:00:00+00" – slice(0,7) gives "2026-02"
        const month = exp.expense_date.slice(0, 7);

        monthlyMap.set(month, (monthlyMap.get(month) || 0) + amount);
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);

        if (month === currentMonth) currentMonthTotal += amount;
        if (month === prevMonth) previousMonthTotal += amount;
      });

      const monthlyTotals: MonthlyTotal[] = Array.from(monthlyMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const percentChange = previousMonthTotal
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

      return {
        monthlyTotals,
        categoryTotals,
        currentMonthTotal,
        previousMonthTotal,
        percentChange,
      };
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};