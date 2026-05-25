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

    // ==================== PREMIUM DARK UI SYSTEM ====================
    const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden transform-gpu transition-all duration-300 hover:border-[#ff0f7b]/40 hover:-translate-y-1 group relative";
    const labelStyle = "text-[10px] font-black uppercase tracking-[0.25em] mb-2 drop-shadow-lg opacity-60 group-hover:opacity-100 transition-opacity";
    const amountStyle = "text-2xl sm:text-3xl font-black tracking-tighter text-white font-mono";

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
        
        {/* ================= TODAY CARD ================= */}
        <Card className={neonGlass}>
          {/* Subtle Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CardContent className="p-6 sm:p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={cn(labelStyle, "text-pink-400")}>
                  {t('dashboard.expenseTotals.today', 'Today')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-white/5" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(todayTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-pink-500/10 border border-pink-500/20 rounded-2xl shadow-inner group-hover:bg-pink-500/20 transition-all">
                <Calendar className="h-6 w-6 text-pink-500" />
              </div>
            </div>
            <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-pink-500 w-1/3 opacity-30 group-hover:opacity-60 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS WEEK CARD ================= */}
        <Card className={neonGlass}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CardContent className="p-6 sm:p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={cn(labelStyle, "text-purple-400")}>
                  {t('dashboard.expenseTotals.thisWeek', 'This Week')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-white/5" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(weeklyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-inner group-hover:bg-purple-500/20 transition-all">
                <CalendarDays className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-purple-500 w-1/2 opacity-30 group-hover:opacity-60 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* ================= THIS MONTH CARD ================= */}
        <Card className={neonGlass}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CardContent className="p-6 sm:p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={cn(labelStyle, "text-indigo-400")}>
                  {t('dashboard.expenseTotals.thisMonth', 'This Month')}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-28 mt-1 bg-white/5" />
                ) : (
                  <p className={amountStyle}>
                    {formatCurrency(monthlyTotal)}
                  </p>
                )}
              </div>
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-inner group-hover:bg-indigo-500/20 transition-all">
                <CalendarRange className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
            <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 w-3/4 opacity-30 group-hover:opacity-60 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ExpenseTotalsGrid.displayName = 'ExpenseTotalsGrid';

export default ExpenseTotalsGrid;