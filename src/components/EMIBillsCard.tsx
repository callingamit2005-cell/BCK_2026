import React, { useCallback, useMemo } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
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
    <li className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl transition-colors">
      <div>
        <div className="font-medium text-slate-800">{bill.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <span>{t('emiBills.dueLabel', 'Due')}:</span>
          <span>{new Date(bill.dueDate).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            bill.status === 'paid'
              ? 'text-emerald-600 font-semibold'
              : 'text-rose-600 font-semibold'
          }
        >
          {formatCurrency(bill.amount)}
        </span>

        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          aria-label={t('emiBills.editAria', 'Edit')}
          title={t('emiBills.edit', 'Edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          aria-label={t('emiBills.deleteAria', 'Delete')}
          title={t('emiBills.delete', 'Delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {bill.status === 'unpaid' && onPay && (
          <button
            className="ml-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all"
            onClick={handlePay}
          >
            {t('emiBills.pay', 'Pay')}
          </button>
        )}
        {bill.status === 'paid' && (
          <span className="ml-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            {t('emiBills.paid', 'Paid')}
          </span>
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
        <div className="text-slate-400 text-sm py-6 text-center bg-slate-50 rounded-xl">
          {t('emiBills.noBills', 'No EMI bills found.')}
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-100">
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
    <div className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-xl">
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            {t('emiBills.title', 'EMI & Fixed Bills')}
          </h3>
        </div>
        {onAddEmiLoan && (
          <button
            onClick={onAddEmiLoan}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {t('emiBills.addEmiLoan', 'Add EMI Loan Details')}
          </button>
        )}
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-slate-400 italic mb-3">
        {t('emiBills.description', 'Manage your recurring EMI commitments')}
      </p>

      {billList}
    </div>
  );
};

export default React.memo(EMIBillsCard);