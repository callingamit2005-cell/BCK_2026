import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ----------------------------------------------------------------------
// Helper: safely format numbers (handle NaN, undefined, etc.)
// ----------------------------------------------------------------------
const safeFormat = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return '0';
  return value.toLocaleString();
};

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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today Card */}
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('expenseTotals.today')}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-rose-600">
                    ₹{safeFormat(todayTotal)}
                  </p>
                )}
              </div>
              <div className="p-2 bg-rose-100 rounded-full">
                <Calendar className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('expenseTotals.thisWeek')}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{safeFormat(weeklyTotal)}
                  </p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('expenseTotals.thisMonth')}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">
                    ₹{safeFormat(monthlyTotal)}
                  </p>
                )}
              </div>
              <div className="p-2 bg-emerald-100 rounded-full">
                <CalendarRange className="h-5 w-5 text-emerald-600" />
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