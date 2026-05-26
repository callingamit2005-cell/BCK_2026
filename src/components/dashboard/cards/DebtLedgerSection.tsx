import React from 'react';
import { IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMILoanDetailsBlock } from '@/components/EMILoanDetailsBlock';
import { cn } from "@/lib/utils";

interface DebtLedgerSectionProps {
  emiList: any[];
  t: (key: string, defaultValue?: string) => string;
  applePhysics: string;
  onAddLoan: () => void;
  onDeleteEMI: (id: string) => void;
  onEditEMI: (emi: any) => void;
}

export const DebtLedgerSection: React.FC<DebtLedgerSectionProps> = React.memo(({
  emiList,
  t,
  applePhysics,
  onAddLoan,
  onDeleteEMI,
  onEditEMI,
}) => {
  return (
    <div className="space-y-8 pt-4">
      <div className="flex justify-between items-start px-4">
        <div className="flex flex-col">
          <h3 className="font-bold text-white/40 uppercase tracking-[0.3em] text-[10px]">{t('dashboard.activeDebtLedger', 'Active Debt Ledger')}</h3>
          <p className="text-white/20 text-[9px] mt-1 font-bold uppercase tracking-[0.1em] italic">{t('dashboard.oneTimeEntry', 'One time entry only')}</p>
        </div>
        <Button onClick={onAddLoan} className={cn(applePhysics, "bg-white text-background rounded-full h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-white/90 transition-all")}>{t('dashboard.addLoanDetails', 'Loan and EMI Details')}</Button>
      </div>
      {emiList.length > 0 ? (
        <div className="flex flex-col gap-6">
          {emiList.map((emi) => (
            <EMILoanDetailsBlock
              key={emi.id}
              entry={emi}
              onDelete={() => onDeleteEMI(emi.id)}
              onEdit={() => onEditEMI(emi)}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white/5 border-dashed border-2 border-white/5 rounded-[32px]">
          <IndianRupee className="h-10 w-10 text-white/5 mx-auto mb-4" />
          <p className="text-white/20 font-bold uppercase tracking-widest text-[9px]">{t('dashboard.noDebtRecords', 'No Debt Records Found')}</p>
        </div>
      )}
    </div>
  );
});
