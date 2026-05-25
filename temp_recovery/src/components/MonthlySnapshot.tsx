import React from 'react';
import { useTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/currencyFormatter';

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

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-gray-700">
        {t('monthlySnapshot.title', { month })}
      </h3>
      
      {/* Subtle helper text for clarity */}
      <p className="text-xs text-gray-400 italic">
        {t('monthlySnapshot.description', 'Monthly cash flow – actual money in and out')}
      </p>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{t('monthlySnapshot.income')}:</span>
        <span className="text-green-600 font-medium">
          {formatCurrency(totalIncome)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{t('monthlySnapshot.expenses')}:</span>
        <span className="text-red-600 font-medium">
          {formatCurrency(totalExpense)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{t('monthlySnapshot.savings')}:</span>
        <span className="text-blue-600 font-medium">
          {formatCurrency(savings)}
        </span>
      </div>
    </div>
  );
};

export default MonthlySnapshot;