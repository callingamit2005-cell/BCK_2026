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
    <li className="flex items-center justify-between py-3.5 px-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{bill.name}</div>
        <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-widest">
          <span>{t('emiBills.dueLabel', 'Due')}:</span>
          <span>{new Date(bill.dueDate).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-black font-mono tracking-tighter text-lg mr-2",
            bill.status === 'paid'
              ? 'text-white/40'
              : 'text-white'
          )}
        >
          {formatCurrency(bill.amount)}
        </span>

        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          aria-label={t('emiBills.editAria', 'Edit')}
          title={t('emiBills.edit', 'Edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-2 text-white/20 hover:text-rose-500 hover:bg-white/5 rounded-lg transition-colors"
          aria-label={t('emiBills.deleteAria', 'Delete')}
          title={t('emiBills.delete', 'Delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {bill.status === 'unpaid' && onPay && (
          <button
            className="ml-1 px-4 py-2 bg-white text-background rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-white/90 transition-all active:scale-[0.98]"
            onClick={handlePay}
          >
            {t('emiBills.pay', 'Pay')}
          </button>
        )}
        {bill.status === 'paid' && (
          <span className="ml-1 flex items-center gap-1 text-[9px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5">
            <CheckCircle className="h-3 w-3" />
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
        <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest py-10 text-center bg-white/5 border border-dashed border-white/10 rounded-xl">
          {t('emiBills.noBills', 'No EMI bills found.')}
        </div>
      );
    }

    return (
      <ul className="space-y-1">
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
    <div className="bg-surface rounded-[24px] border border-border shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <CheckCircle className="h-5 w-5 text-white/40" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
              {t('emiBills.title', 'Fixed Bills')}
            </h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mt-0.5">
              {t('emiBills.description', 'Commitment Audit')}
            </p>
          </div>
        </div>
        {onAddEmiLoan && (
          <button
            onClick={onAddEmiLoan}
            className="flex items-center justify-center gap-2 px-6 h-12 bg-white text-background rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-white/90 transition-all w-full sm:w-auto active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t('emiBills.addEmiLoan', 'Add Loan Details')}
          </button>
        )}
      </div>

      {billList}
    </div>
  );
};

export default React.memo(EMIBillsCard);