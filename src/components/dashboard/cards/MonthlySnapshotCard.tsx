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
  premiumSurface: string;
}

export const MonthlySnapshotCard: React.FC<MonthlySnapshotCardProps> = React.memo(({
  totalInflow,
  budgetVal,
  totalOutflow,
  netSaved,
  t,
  premiumSurface,
}) => {
  return (
    <Card className={cn(premiumSurface, "border-border/40 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)]")}>
      <CardHeader className="p-6 sm:p-10 pb-5 sm:pb-8 border-b border-border/40 bg-background/50">
        <CardTitle className="text-xl sm:text-2xl font-black text-[#1a1a1a] flex items-center gap-5 sm:gap-6 uppercase tracking-tighter">
          {/* Circular Premium Icon Container - Snapshot Style */}
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-[#DC2626]" />
          </div>
          <div className="flex-1">
             {t('monthlySnapshot.title', 'Monthly Snapshot')}
             <CardDescription className="text-fintech-graphite-muted text-[9px] sm:text-[11px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] mt-1.5 opacity-60 leading-none">
               {t('common.liveAudit', 'Verified Cycle')} · {format(new Date(), 'MMMM yyyy')}
             </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 p-6 sm:p-10">
        {[
          { label: t('common.monthlyIncome', "Monthly Income"), value: totalInflow, color: 'text-[#1a1a1a]', iconBg: 'bg-[#DCFCE7]', iconBorder: 'border-[#BBF7D0]' },
          { label: t('common.monthlyBudget', "Monthly Budget"), value: budgetVal, color: 'text-fintech-graphite-muted', iconBg: 'bg-[#F3F4F6]', iconBorder: 'border-border/40' },
          { label: t('common.totalSpent', "Total Spent"), value: totalOutflow, color: 'text-[#DC2626]', iconBg: 'bg-[#FEE2E2]', iconBorder: 'border-[#FECACA]' },
          { label: t('common.netSaved', "Net Saved"), value: netSaved, color: 'text-fintech-emerald-dark', iconBg: 'bg-[#DCFCE7]', iconBorder: 'border-[#BBF7D0]' }
        ].map((item, idx) => (
          <div key={idx} className="bg-background/[0.02] border border-border/40 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 hover:bg-background/40 hover:border-border/60 transition-all duration-500 shadow-sm group/item flex items-center gap-5 sm:gap-6 min-w-0">
            <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border shrink-0 transition-transform duration-700 group-hover/item:scale-110 shadow-inner", item.iconBg, item.iconBorder)}>
               <div className="w-2 w-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#DC2626] opacity-20 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.25em] mb-1.5 sm:mb-2 group-hover/item:text-[#1a1a1a] transition-colors opacity-70 truncate">{item.label}</p>
              <p className={cn("text-2xl sm:text-3xl font-black font-mono tracking-tighter leading-none tabular-nums truncate px-1", item.color)}>{formatCurrency(item.value)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
