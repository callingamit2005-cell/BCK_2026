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
  // Polished UI Classes - Emotionally Premium System
  const cardClass = "bg-surface rounded-[32px] border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 ease-butter-soft";
  const labelClass = "text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em]";
  const valueClass = "text-[28px] font-black text-[#1a1a1a] font-mono tracking-tighter leading-none";

  return (
    <div className={`${cardClass} p-8 relative overflow-hidden group`}>
      {/* Subtle Premium Background Accent - Refined for breathing room */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#111111]/[0.01] rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-[#111111]/[0.03] transition-colors duration-1000" />
      
      {/* Header - Improved whitespace rhythm */}
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center gap-6">
          {/* Circular Premium Icon Container - Calendar Style */}
          <div className="h-16 w-16 rounded-full bg-[#F3F4F6] border border-border/60 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <Calendar className="h-8 w-8 text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-tight">
              {t('monthlySnapshot.title', { month })}
            </h3>
            <p className="text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.3em] mt-2 opacity-60">
              {t('monthlySnapshot.description', 'Velocity Audit')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium spacing and hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
        {/* Income */}
        <div className="bg-background/[0.02] rounded-[32px] p-8 border border-transparent hover:bg-background/40 hover:border-border/40 transition-all duration-500 flex items-start gap-6 group/item">
          <div className="h-12 w-12 rounded-full bg-[#F3F4F6] border border-border/40 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <TrendingUp className="h-5 w-5 text-[#525252]" />
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
        <div className="bg-background/[0.02] rounded-[32px] p-8 border border-transparent hover:bg-red-50/[0.02] hover:border-red-100/30 transition-all duration-500 flex items-start gap-6 group/item">
          <div className="h-12 w-12 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <TrendingDown className="h-5 w-5 text-[#DC2626]" />
          </div>
          <div className="flex-1">
            <p className={labelClass + " mb-2"}>
              {t('monthlySnapshot.expenses')}
            </p>
            <p className="text-[28px] font-black text-[#DC2626] font-mono tracking-tighter leading-none">
              {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-background/[0.02] rounded-[32px] p-8 border border-transparent hover:bg-emerald-50/[0.02] hover:border-emerald-100/30 transition-all duration-500 flex items-start gap-6 group/item">
          <div className="h-12 w-12 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
            <PiggyBank className="h-5 w-5 text-[#DC2626]" />
          </div>
          <div className="flex-1">
            <p className={labelClass + " mb-2"}>
              {t('monthlySnapshot.savings')}
            </p>
            <p className="text-[28px] font-black text-fintech-emerald-dark font-mono tracking-tighter leading-none">
              {formatCurrency(savings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySnapshot;