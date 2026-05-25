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
  const gradientClass = "bg-gradient-to-r from-purple-600 to-pink-500";
  const cardClass = "bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100";

  return (
    <div className={`${cardClass} p-5`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-xl">
          <Calendar className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          {t('monthlySnapshot.title', { month })}
        </h3>
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-slate-400 italic mb-4">
        {t('monthlySnapshot.description', 'Monthly cash flow – actual money in and out')}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('monthlySnapshot.income')}
            </span>
          </div>
          <p className="text-xl font-black text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('monthlySnapshot.expenses')}
            </span>
          </div>
          <p className="text-xl font-black text-red-600">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        {/* Savings */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('monthlySnapshot.savings')}
            </span>
          </div>
          <p className="text-xl font-black text-blue-600">
            {formatCurrency(savings)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlySnapshot;