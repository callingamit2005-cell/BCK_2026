import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';

interface MonthlySnapshotCardProps {
  totalInflow: number;
  budgetVal: number;
  totalOutflow: number;
  netSaved: number;
  t: (key: string, defaultValue?: string) => string;
  neonGlass: string;
}

export const MonthlySnapshotCard: React.FC<MonthlySnapshotCardProps> = React.memo(({
  totalInflow,
  budgetVal,
  totalOutflow,
  netSaved,
  t,
  neonGlass,
}) => {
  return (
    <Card className={cn(neonGlass, "border-border shadow-sm")}>
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-4 uppercase tracking-tight">
          <PieChart className="h-6 w-6 text-text-muted" /> {t('monthlySnapshot.title', 'Monthly Snapshot')}
        </CardTitle>
        <CardDescription className="text-text-muted text-[9px] font-bold uppercase tracking-[0.2em] ml-10">{t('common.liveAudit', 'Live Audit')} · {format(new Date(), 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 pt-4">
        {[
          { label: t('common.monthlyIncome', "Monthly Income"), value: totalInflow },
          { label: t('common.monthlyBudget', "Monthly Budget"), value: budgetVal },
          { label: t('common.totalSpent', "Total Spent"), value: totalOutflow },
          { label: t('common.netSaved', "Net Saved"), value: netSaved }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-2xl font-bold font-mono text-white tracking-tighter">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
