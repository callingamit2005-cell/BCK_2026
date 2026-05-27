/**
 * ExpenseTotalsGrid.tsx - BachatKaro Neon Enterprise Edition
 * UI: Premium Dark Neon Glass with Signature Purple/Pink Gradients.
 * 🛡️ LOGIC LOCK: Formatter, Props, & Calculations 100% untouched.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CalendarDays, CalendarRange, TrendingUp, Zap } from 'lucide-react';
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

    // ==================== PREMIUM LIGHT UI SYSTEM ====================
    const premiumCard = "bg-surface border border-border shadow-sm rounded-[24px] overflow-hidden transform-gpu transition-all duration-300 hover:border-foreground/20 group relative";
    const labelStyle = "text-[11px] font-bold uppercase tracking-[0.2em] mb-2 text-text-secondary group-hover:text-foreground transition-colors";
    const amountStyle = "text-2xl sm:text-3xl font-bold tracking-tighter text-foreground font-mono";

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
        
        {/* ================= TODAY CARD ================= */}
        <Card className={premiumCard}>
          <CardContent className="p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.today', 'Today')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-background" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(todayTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-background border border-border rounded-2xl group-hover:border-foreground/20 transition-all">
                <Calendar className="h-6 w-6 text-text-secondary group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-background rounded-full overflow-hidden border border-border">
               <div className="h-full bg-foreground w-1/3 opacity-20 group-hover:opacity-40 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS WEEK CARD ================= */}
        <Card className={premiumCard}>
          <CardContent className="p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.thisWeek', 'This Week')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-background" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(weeklyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-background border border-border rounded-2xl group-hover:border-foreground/20 transition-all">
                <CalendarDays className="h-6 w-6 text-text-secondary group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-background rounded-full overflow-hidden border border-border">
               <div className="h-full bg-foreground w-1/2 opacity-20 group-hover:opacity-40 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS MONTH CARD ================= */}
        <Card className={premiumCard}>
          <CardContent className="p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={labelStyle}>
                  {t('dashboard.expenseTotals.thisMonth', 'This Month')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-background" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(monthlyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-background border border-border rounded-2xl group-hover:border-foreground/20 transition-all">
                <CalendarRange className="h-6 w-6 text-text-secondary group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-background rounded-full overflow-hidden border border-border">
               <div className="h-full bg-foreground w-3/4 opacity-20 group-hover:opacity-40 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ExpenseTotalsGrid.displayName = 'ExpenseTotalsGrid';

export default ExpenseTotalsGrid;