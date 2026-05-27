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
  premiumSurface: string;
  inputStyle: string;
  applePhysics: string;
}

export const IncomeEngineCard: React.FC<IncomeEngineCardProps> = React.memo(({
  salaryInput,
  setSalaryInput,
  handleSaveIncome,
  isSavingIncome,
  t,
  premiumSurface,
  inputStyle,
  applePhysics,
}) => {
  return (
    <Card className={cn(premiumSurface, "p-6 sm:p-10 border-border/40 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft")}>
      <CardHeader className="p-0 mb-6 sm:mb-10">
        <CardTitle className="text-xl sm:text-2xl font-black text-[#1a1a1a] flex items-center gap-5 sm:gap-6 uppercase tracking-tighter">
          {/* Circular Premium Icon Container - Investment Style */}
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-[#DC2626]" />
          </div>
          <div>
            {t('dashboard.incomeEngine', 'Income Engine')}
            <p className="text-[10px] sm:text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">Verified Monthly Inflow</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
          <Input type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} className={cn(inputStyle, "h-14 sm:h-18 rounded-2xl sm:rounded-[24px] bg-background border-border/40 text-lg sm:text-xl font-black text-[#1a1a1a] focus:border-border/80 shadow-inner px-6 sm:px-8")} placeholder={t('dashboard.enterAmount', "Establish Monthly Basis")} />
          <Button disabled={isSavingIncome} onClick={handleSaveIncome} className={cn(applePhysics, "h-14 sm:h-18 sm:min-w-[180px] bg-[#1a1a1a] text-white rounded-2xl sm:rounded-[24px] px-8 sm:px-12 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] sm:tracking-[0.3em] shadow-lg sm:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-[#111111] transition-all duration-500 active:scale-[0.97]")}>
            {isSavingIncome ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : t('common.save', "Deploy")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
