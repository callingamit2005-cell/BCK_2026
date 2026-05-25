import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/currencyFormatter';

export interface EMIBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date string
  status: 'paid' | 'unpaid';
}

interface EMIBillsCardProps {
  bills: EMIBill[];
  onPay?: (id: string) => void;
  onEdit?: (bill: EMIBill) => void;      // New: edit handler
  onDelete?: (id: string) => void;       // New: delete handler
  onAddEmiLoan?: () => void;              // New: add EMI loan details handler
}

/**
 * Individual bill item component with memoization for performance.
 */
const BillItem = React.memo<{
  bill: EMIBill;
  onPay?: (id: string) => void;
  onEdit?: (bill: EMIBill) => void;
  onDelete?: (id: string) => void;
}>(({ bill, onPay, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const handlePay = useCallback(() => {
    onPay?.(bill.id);
  }, [onPay, bill.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(bill);
  }, [onEdit, bill]);

  const handleDelete = useCallback(() => {
    onDelete?.(bill.id);
  }, [onDelete, bill.id]);

  return (
    <li className="flex items-center justify-between py-2">
      <div>
        <div className="font-medium text-gray-800">{bill.name}</div>
        <div className="text-xs text-gray-500">
          {t('emiBills.dueLabel', 'Due')}: {new Date(bill.dueDate).toLocaleDateString('en-IN')}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={
          bill.status === 'paid'
            ? 'text-green-600 font-semibold'
            : 'text-red-600 font-semibold'
        }>
          {formatCurrency(bill.amount)}
        </span>

        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="text-gray-500 hover:text-blue-600 transition-colors"
          aria-label={t('emiBills.editAria', 'Edit')}
          title={t('emiBills.edit', 'Edit')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-600 transition-colors"
          aria-label={t('emiBills.deleteAria', 'Delete')}
          title={t('emiBills.delete', 'Delete')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {bill.status === 'unpaid' && onPay && (
          <button
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            onClick={handlePay}
          >
            {t('emiBills.pay', 'Pay')}
          </button>
        )}
        {bill.status === 'paid' && (
          <span className="ml-2 text-xs text-green-500">{t('emiBills.paid', 'Paid')}</span>
        )}
      </div>
    </li>
  );
});

BillItem.displayName = 'BillItem';

/**
 * EMIBillsCard Component
 * Displays a list of EMI bills with options to pay, edit, or delete.
 * Also includes a button to add new EMI loan details.
 */
const EMIBillsCard: React.FC<EMIBillsCardProps> = ({
  bills,
  onPay,
  onEdit,
  onDelete,
  onAddEmiLoan
}) => {
  const { t } = useTranslation();

  // Memoize the list rendering to avoid unnecessary re-renders
  const billList = useMemo(() => {
    if (bills.length === 0) {
      return (
        <div className="text-gray-400 text-sm py-4 text-center">
          {t('emiBills.noBills', 'No EMI bills found.')}
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200">
        {bills.map((bill) => (
          <BillItem
            key={bill.id}
            bill={bill}
            onPay={onPay}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    );
  }, [bills, onPay, onEdit, onDelete, t]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          {t('emiBills.title', 'EMI & Fixed Bills')}
        </h3>
        {onAddEmiLoan && (
          <button
            onClick={onAddEmiLoan}
            className="mt-2 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            {t('emiBills.addEmiLoan', 'Add EMI Loan Details')}
          </button>
        )}
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-gray-400 italic mb-3">
        {t('emiBills.description', 'Manage your recurring EMI commitments')}
      </p>

      {billList}
    </div>
  );
};

export default React.memo(EMIBillsCard);