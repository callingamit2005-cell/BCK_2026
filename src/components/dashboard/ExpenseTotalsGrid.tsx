/**
 * ExpenseTotalsGrid.tsx - BachatKaro Premium Fintech Edition
 * UI: Clean Institutional Design with Primary Teal Accents.
 * 🛡️ LOGIC LOCK: Formatter, Props, & Calculations 100% untouched.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';

// ----------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------
interface ExpenseTotalsGridProps {
  todayTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  loading: boolean;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
const ExpenseTotalsGrid = React.memo(
  ({ todayTotal, weeklyTotal, monthlyTotal, loading }: ExpenseTotalsGridProps) => {
    const { t } = useLanguage();

    // ==================== PREMIUM INSTITUTIONAL UI ====================
    const premiumCard = "fintech-card fintech-card-hover group relative overflow-hidden";
    const labelStyle = "text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1.5 text-muted-foreground group-hover:text-primary transition-colors";
    const amountStyle = "text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono tabular-nums";

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        
        {/* ================= TODAY CARD ================= */}
        <Card className={premiumCard}>
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.today', 'Today')}
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-28 mt-1" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(todayTotal)}
                  </p>
                )}
              </div>
              <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                <Calendar className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS WEEK CARD ================= */}
        <Card className={premiumCard}>
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.thisWeek', 'This Week')}
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-28 mt-1" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(weeklyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                <CalendarDays className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS MONTH CARD ================= */}
        <Card className={premiumCard}>
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.thisMonth', 'This Month')}
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-28 mt-1" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(monthlyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                <CalendarRange className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ExpenseTotalsGrid.displayName = 'ExpenseTotalsGrid';

export default ExpenseTotalsGrid;
