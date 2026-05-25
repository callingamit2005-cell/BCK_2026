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

export const IncomeEngineCard: React.FC<IncomeEngineCardProps> = ({
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
        <CardTitle className="text-lg font-black text-white flex items-center gap-3 italic uppercase">
          <IndianRupee className="h-5 w-5 text-indigo-400" /> {t('dashboard.incomeEngine', 'Income Engine')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} className={inputStyle} placeholder={t('dashboard.enterAmount', "Enter Amount")} />
          <Button disabled={isSavingIncome} onClick={handleSaveIncome} className={cn(applePhysics, "h-14 sm:min-w-[152px] bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-[0_18px_40px_-18px_rgba(124,58,237,0.9)]")}>
            {isSavingIncome ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save', "Save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
