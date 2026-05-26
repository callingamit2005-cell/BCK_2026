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
const MonthlySnapshot: React.FC<MonthlySnapshotProps> = ({ 
  month, 
  totalIncome, 
  totalExpense, 
  savings 
}) => {
  const { t } = useTranslation();

  // Polished UI Classes
  const cardClass = "bg-surface rounded-[24px] border border-border shadow-sm";

  return (
    <div className={`${cardClass} p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
          <Calendar className="h-5 w-5 text-white/40" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            {t('monthlySnapshot.title', { month })}
          </h3>
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mt-0.5">
            {t('monthlySnapshot.description', 'Commitment Audit')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/[0.08] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <TrendingUp className="h-4 w-4 text-white/40" />
            </div>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              {t('monthlySnapshot.income')}
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tighter">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/[0.08] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <TrendingDown className="h-4 w-4 text-white/40" />
            </div>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              {t('monthlySnapshot.expenses')}
            </span>
          </div>
          <p className="text-2xl font-black text-white/60 font-mono tracking-tighter">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        {/* Savings */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/[0.08] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <PiggyBank className="h-4 w-4 text-white/40" />
            </div>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              {t('monthlySnapshot.savings')}
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tighter">
            {formatCurrency(savings)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlySnapshot;