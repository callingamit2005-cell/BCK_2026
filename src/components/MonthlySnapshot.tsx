// src/components/dashboard/MonthlySnapshot.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import React from 'react';
import { useTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/currencyFormatter';
import { TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';

interface MonthlySnapshotProps {
  month: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
}

/**
 * MonthlySnapshot Component
 * Shows a summary of income, expenses, and savings for a given month.
 * 
 * NOTE: The data passed to this component (totalIncome, totalExpense, savings)
 * is assumed to reflect only actual monthly cash flow. Loan principal and total
 * loan values are excluded at the data layer to ensure an accurate cash flow view.
 */
const MonthlySnapshot: React.FC<MonthlySnapshotProps> = ({ month, totalIncome, totalExpense, savings }) => {
  const { t } = useTranslation();

  // Polished UI Classes - Emotionally Premium System
  const cardClass = "bg-surface rounded-3xl border border-border/40 shadow-premium hover:shadow-[0_8px_30_rgb(0,0,0,0.04)] transition-all duration-700 ease-butter-soft";
  const labelClass = "text-xs font-black text-text-muted uppercase tracking-wider";
  const valueClass = "text-2xl font-black text-foreground font-mono tracking-tighter leading-none";

  return (
    <div className={`${cardClass} p-6 relative overflow-hidden group`}>
      {/* Subtle Premium Background Accent - Refined for breathing room */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/[0.01] rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-foreground/[0.03] transition-colors duration-1000" />
      
      {/* Header - Improved whitespace rhythm */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-6">
          {/* Circular Premium Icon Container - Calendar Style */}
          <div className="h-14 w-14 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <Calendar className="h-7 w-7 text-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-tight">
              {t('monthlySnapshot.title', { month })}
            </h3>
            <p className="text-xs text-text-muted font-black uppercase tracking-wider mt-2 opacity-60">
              {t('monthlySnapshot.description', 'Velocity Audit')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium spacing and hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        {/* Income */}
        <div className="bg-background rounded-2xl p-6 border border-transparent hover:border-border transition-all duration-500 flex items-start gap-4 group/item">
          <div className="h-10 w-10 rounded-full bg-surface border border-border/40 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <TrendingUp className="h-5 w-5 text-text-secondary" />
          </div>
          <div className="flex-1">
            <p className={labelClass + " mb-2"}>
              {t('monthlySnapshot.income')}
            </p>
            <p className={valueClass}>
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-background rounded-2xl p-6 border border-transparent hover:border-border transition-all duration-500 flex items-start gap-4 group/item">
          <div className="h-10 w-10 rounded-full bg-surface border border-border/40 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <TrendingDown className="h-5 w-5 text-text-secondary" />
          </div>
          <div className="flex-1">
            <p className={labelClass + " mb-2"}>
              {t('monthlySnapshot.expenses')}
            </p>
            <p className={valueClass}>
              {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-background rounded-2xl p-6 border border-transparent hover:border-border transition-all duration-500 flex items-start gap-4 group/item">
          <div className="h-10 w-10 rounded-full bg-surface border border-border/40 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <PiggyBank className="h-5 w-5 text-text-secondary" />
          </div>
          <div className="flex-1">
            <p className={labelClass + " mb-2"}>
              {t('monthlySnapshot.savings')}
            </p>
            <p className={valueClass}>
              {formatCurrency(savings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySnapshot;
