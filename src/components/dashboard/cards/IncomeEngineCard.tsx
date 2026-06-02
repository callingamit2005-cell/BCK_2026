/**
 * IncomeEngineCard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Income Verification Terminal.
 * 🛡️ LOGIC LOCK: Save flow and data persistence 100% untouched.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IndianRupee, Loader2, Wallet, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface IncomeEngineCardProps {
  salaryInput: string;
  setSalaryInput: (val: string) => void;
  handleSaveIncome: () => Promise<void>;
  isSavingIncome: boolean;
  t: (key: string, defaultValue?: string) => string;
  premiumSurface?: string;
  inputStyle?: string;
  applePhysics?: string;
}

export const IncomeEngineCard: React.FC<IncomeEngineCardProps> = React.memo(({
  salaryInput,
  setSalaryInput,
  handleSaveIncome,
  isSavingIncome,
  t,
}) => {
  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-income/10 border border-income/20 flex items-center justify-center shrink-0 shadow-sm">
            <Wallet className="h-5 w-5 text-income" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {t('dashboard.incomeEngine', 'Monthly Income')}
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Verified Monthly Inflow
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Confirmed Net Amount
            </label>
            <div className="relative group">
              <Input
                type="number"
                min="0"
                value={salaryInput}
                onChange={e => setSalaryInput(e.target.value)}
                className={cn(
                  "h-14 rounded-xl bg-muted/20 border-border/50 text-xl font-bold text-foreground font-mono tabular-nums",
                  "focus:ring-income focus:border-income/50 transition-all pl-10 pr-6"
                )}
                placeholder="0.00"
                aria-label={t('dashboard.incomeEngine', 'Monthly Income')}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground group-focus-within:text-income">₹</span>
            </div>
          </div>
          
          <Button
            disabled={isSavingIncome}
            onClick={handleSaveIncome}
            className="w-full sm:w-auto h-14 px-8 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest rounded-xl shadow-premium hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {isSavingIncome ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('common.save', 'Save Income')}
              </>
            )}
          </Button>
        </div>
        
        <p className="text-[10px] text-muted-foreground font-medium italic mt-4 ml-1">
          *Your income is used to calculate financial health and safe-spend limits.
        </p>
      </CardContent>
    </Card>
  );
});

IncomeEngineCard.displayName = 'IncomeEngineCard';
