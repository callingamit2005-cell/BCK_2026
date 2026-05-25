import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet, Loader2, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface SafeSpendCardProps {
  budgetInput: string;
  setBudgetInput: (val: string) => void;
  handleSaveBudget: () => Promise<void>;
  isSavingBudget: boolean;
  adjustBudget: (amount: number) => void;
  t: (key: string, defaultValue?: string) => string;
  neonGlass: string;
  inputStyle: string;
  applePhysics: string;
  stepperBtn: string;
}

export const SafeSpendCard: React.FC<SafeSpendCardProps> = ({
  budgetInput,
  setBudgetInput,
  handleSaveBudget,
  isSavingBudget,
  adjustBudget,
  t,
  neonGlass,
  inputStyle,
  applePhysics,
  stepperBtn,
}) => {
  return (
    <Card className={neonGlass}>
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-lg font-black text-white flex items-center gap-3 italic uppercase">
          <Wallet className="h-5 w-5 text-cyan-400" /> {t('dashboard.safeSpend', 'Safe-Spend Limit')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className={inputStyle} placeholder={t('dashboard.setLimit', "Set Budget")} />
            <Button disabled={isSavingBudget} onClick={handleSaveBudget} className={cn(applePhysics, "h-14 sm:min-w-[152px] bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-[0_18px_40px_-18px_rgba(14,165,233,0.9)]")}>
              {isSavingBudget ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.setLimit', "Set Limit")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 ml-1">
            <button onClick={() => adjustBudget(-100)} className={stepperBtn}><Minus className="h-4 w-4 mr-1 inline" /> 100</button>
            <button onClick={() => adjustBudget(100)} className={stepperBtn}><Plus className="h-4 w-4 mr-1 inline" /> 100</button>
            <button onClick={() => adjustBudget(-500)} className={stepperBtn}><Minus className="h-4 w-4 mr-1 inline" /> 500</button>
            <button onClick={() => adjustBudget(500)} className={stepperBtn}><Plus className="h-4 w-4 mr-1 inline" /> 500</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
