import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IndianRupee, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface IncomeEngineCardProps {
  salaryInput: string;
  setSalaryInput: (val: string) => void;
  handleSaveIncome: () => Promise<void>;
  isSavingIncome: boolean;
  t: (key: string, defaultValue?: string) => string;
  neonGlass: string;
  inputStyle: string;
  applePhysics: string;
}

export const IncomeEngineCard: React.FC<IncomeEngineCardProps> = React.memo(({
  salaryInput,
  setSalaryInput,
  handleSaveIncome,
  isSavingIncome,
  t,
  neonGlass,
  inputStyle,
  applePhysics,
}) => {
  return (
    <Card className={neonGlass}>
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-base font-bold text-white flex items-center gap-3 uppercase tracking-tight">
          <IndianRupee className="h-4 w-4 text-text-muted" /> {t('dashboard.incomeEngine', 'Income Engine')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} className={inputStyle} placeholder={t('dashboard.enterAmount', "Enter Amount")} />
          <Button disabled={isSavingIncome} onClick={handleSaveIncome} className={cn(applePhysics, "h-14 sm:min-w-[152px] bg-white text-background rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest hover:bg-white/90 transition-all")}>
            {isSavingIncome ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save', "Save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
