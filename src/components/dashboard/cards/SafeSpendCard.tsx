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

export const SafeSpendCard: React.FC<SafeSpendCardProps> = React.memo(({
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
        <CardTitle className="text-base font-bold text-white flex items-center gap-3 uppercase tracking-tight">
          <Wallet className="h-4 w-4 text-text-muted" /> {t('dashboard.safeSpend', 'Safe-Spend Limit')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className={inputStyle} placeholder={t('dashboard.setLimit', "Set Budget")} />
            <Button disabled={isSavingBudget} onClick={handleSaveBudget} className={cn(applePhysics, "h-14 sm:min-w-[152px] bg-white text-background rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest hover:bg-white/90 transition-all")}>
              {isSavingBudget ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.setLimit', "Set Limit")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 500].flatMap(val => [
              <button key={`minus-${val}`} onClick={() => adjustBudget(-val)} className={stepperBtn}><Minus className="h-3 w-3 mr-1 inline" /> {val}</button>,
              <button key={`plus-${val}`} onClick={() => adjustBudget(val)} className={stepperBtn}><Plus className="h-3 w-3 mr-1 inline" /> {val}</button>
            ])}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
