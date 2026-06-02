/**
 * MonthlySnapshotCard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Monthly Financial Audit.
 * 🛡️ LOGIC LOCK: Financial snapshot data binding and date logic 100% untouched.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart, LayoutDashboard } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';

interface MonthlySnapshotCardProps {
  totalInflow: number;
  budgetVal: number;
  totalOutflow: number;
  netSaved: number;
  t: (key: string, defaultValue?: string) => string;
  premiumSurface?: string;
}

// Institutional Financial Palette mapped to CSS variables
const statConfig = [
  {
    key: 'income',
    accentColor: 'text-income',
    bgColor: 'bg-income/5',
    borderColor: 'border-income/20',
  },
  {
    key: 'budget',
    accentColor: 'text-investment',
    bgColor: 'bg-investment/5',
    borderColor: 'border-investment/20',
  },
  {
    key: 'spent',
    accentColor: 'text-expense',
    bgColor: 'bg-expense/5',
    borderColor: 'border-expense/20',
  },
  {
    key: 'saved',
    accentColor: 'text-savings',
    bgColor: 'bg-savings/5',
    borderColor: 'border-savings/20',
  },
] as const;

export const MonthlySnapshotCard: React.FC<MonthlySnapshotCardProps> = React.memo(({
  totalInflow,
  budgetVal,
  totalOutflow,
  netSaved,
  t,
}) => {
  const stats = [
    { label: t('common.monthlyIncome', 'Monthly Inflow'),  value: totalInflow,  cfg: statConfig[0] },
    { label: t('common.monthlyBudget', 'Plan Budget'),    value: budgetVal,    cfg: statConfig[1] },
    { label: t('common.totalSpent',    'Total Burn'),      value: totalOutflow, cfg: statConfig[2] },
    { label: t('common.netSaved',      'Net Retained'),    value: netSaved,     cfg: statConfig[3] },
  ];

  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {t('monthlySnapshot.title', 'Monthly Snapshot')}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Financial Pulse: {format(new Date(), 'MMMM yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map(({ label, value, cfg }) => (
            <div
              key={label}
              className={cn(
                "border border-border/40 rounded-2xl p-6 transition-all duration-300 shadow-sm group",
                cfg.bgColor,
                "hover:border-primary/20"
              )}
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 truncate opacity-80 group-hover:opacity-100 transition-opacity">
                {label}
              </p>
              <p className={cn(
                "text-2xl sm:text-3xl font-bold font-mono tracking-tighter leading-none tabular-nums",
                cfg.key === 'saved' && value < 0 ? 'text-expense' : cfg.accentColor
              )}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-8 text-muted-foreground/30">
          Institutional Grade Snapshot · Verified Audit
        </p>
      </CardContent>
    </Card>
  );
});

MonthlySnapshotCard.displayName = 'MonthlySnapshotCard';
