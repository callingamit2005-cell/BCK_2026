/**
 * DebtLedgerSection.tsx - BachatKaro Premium Fintech Edition
 * UI: Professional Loan & EMI Management Terminal.
 * 🛡️ LOGIC LOCK: List mapping, add/edit/delete handlers 100% untouched.
 */

import React from 'react';
import { IndianRupee, Plus, Landmark } from 'lucide-react';
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
    <div className="space-y-6 pt-2 animate-fade-in-up">
      {/* Section header */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {t('dashboard.activeDebtLedger', 'Loans & EMIs')}
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Institutional Debt Tracking
            </p>
          </div>
        </div>
        
        <Button
          onClick={onAddLoan}
          className={cn(
            "h-10 rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-widest shadow-premium hover:opacity-90 active:scale-95 transition-all duration-300 px-5 gap-2"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {t('dashboard.addLoan', 'Add Loan')}
        </Button>
      </div>

      {/* List or empty state */}
      {emiList.length > 0 ? (
        <div className="flex flex-col gap-4">
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
        <div className="p-12 text-center bg-muted/20 border border-border/40 rounded-2xl">
          <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-6 border border-border/60 shadow-inner">
            <IndianRupee className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p className="text-foreground font-bold text-base mb-2">
            {t('dashboard.noLoans', 'No active loans detected')}
          </p>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('dashboard.noLoansSub', 'Securely monitor commitments and balances')}
          </p>
        </div>
      )}
    </div>
  );
});

DebtLedgerSection.displayName = 'DebtLedgerSection';
