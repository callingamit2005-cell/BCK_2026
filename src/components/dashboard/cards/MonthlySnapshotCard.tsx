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

export const MonthlySnapshotCard: React.FC<MonthlySnapshotCardProps> = ({
  totalInflow,
  budgetVal,
  totalOutflow,
  netSaved,
  t,
  neonGlass,
}) => {
  return (
    <Card className={cn(neonGlass, "border-0 shadow-[0_0_50px_-12px_rgba(255,15,123,0.3)]")}>
      <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 to-[#ff0f7b]" />
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
          <PieChart className="h-7 w-7 text-[#ff0f7b]" /> {t('monthlySnapshot.title', 'Monthly Snapshot')}
        </CardTitle>
        <CardDescription className="text-[#b3b3b3] text-[10px] font-bold uppercase tracking-[0.2em] ml-11">{t('common.liveAudit', 'Live Audit')} · {format(new Date(), 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-6 sm:p-8 pt-4">
        {[
          { label: t('common.monthlyIncome', "Monthly Income"), value: totalInflow, color: 'text-purple-400' },
          { label: t('common.monthlyBudget', "Monthly Budget"), value: budgetVal, color: 'text-blue-400' },
          { label: t('common.totalSpent', "Total Spent"), value: totalOutflow, color: 'text-rose-400' },
          { label: t('common.netSaved', "Net Saved"), value: netSaved, color: 'text-emerald-400' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-[28px] p-6 hover:border-[#ff0f7b]/30 transition-all duration-500">
            <p className="text-[9px] font-black text-[#b3b3b3] uppercase tracking-widest mb-1">{item.label}</p>
            <p className={cn("text-2xl font-black font-mono", item.color)}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
