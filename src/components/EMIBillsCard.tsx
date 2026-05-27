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
    <li className="flex items-center justify-between py-4 px-4 hover:bg-background rounded-2xl transition-all duration-300 border border-transparent hover:border-border/60 group">
      <div className="flex-1 min-w-0">
        <div className="font-black text-[#1a1a1a] truncate text-[15px]">{bill.name}</div>
        <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-1 font-black uppercase tracking-widest">
          <span className="opacity-70">{t('emiBills.dueLabel', 'Due')}:</span>
          <span className="text-[#525252]">{new Date(bill.dueDate).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-black font-mono tracking-tighter text-xl mr-2 transition-colors duration-300",
            bill.status === 'paid'
              ? 'text-[#737373] opacity-50'
              : 'text-[#1a1a1a]'
          )}
        >
          {formatCurrency(bill.amount)}
        </span>

        {/* Action Buttons Container */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Edit button */}
          <button
            onClick={handleEdit}
            className="p-2 text-[#737373] hover:text-[#1a1a1a] hover:bg-surface rounded-xl border border-transparent hover:border-border/60 transition-all"
            aria-label={t('emiBills.editAria', 'Edit')}
            title={t('emiBills.edit', 'Edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="p-2 text-[#737373] hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
            aria-label={t('emiBills.deleteAria', 'Delete')}
            title={t('emiBills.delete', 'Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {bill.status === 'unpaid' && onPay && (
          <button
            className="ml-2 px-6 h-10 bg-[#1a1a1a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#1a1a1a]/90 transition-all active:scale-[0.96]"
            onClick={handlePay}
          >
            {t('emiBills.pay', 'Pay')}
          </button>
        )}
        {bill.status === 'paid' && (
          <span className="ml-2 flex items-center gap-1.5 text-[10px] text-[#737373] font-black uppercase tracking-widest bg-background px-3 py-1.5 rounded-xl border border-border/60">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
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
        <div className="text-[#737373] text-[11px] font-black uppercase tracking-[0.2em] py-14 text-center bg-background/40 border border-dashed border-border/80 rounded-2xl">
          {t('emiBills.noBills', 'No EMI bills found.')}
        </div>
      );
    }

    return (
      <ul className="space-y-2">
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
    <div className="bg-surface rounded-[24px] border border-border/60 shadow-sm p-8 group">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-background p-3 rounded-2xl border border-border/80 shadow-sm transition-transform duration-500 group-hover:scale-105">
            <CheckCircle className="h-5 w-5 text-[#525252]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tighter">
              {t('emiBills.title', 'Fixed Bills')}
            </h3>
            <p className="text-[10px] text-[#737373] font-black uppercase tracking-[0.25em] mt-1 opacity-80">
              {t('emiBills.description', 'Commitment Audit')}
            </p>
          </div>
        </div>
        {onAddEmiLoan && (
          <button
            onClick={onAddEmiLoan}
            className="flex items-center justify-center gap-2.5 px-8 h-12 bg-[#1a1a1a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1a1a1a]/90 transition-all w-full sm:w-auto active:scale-[0.96] hover:shadow-2xl"
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