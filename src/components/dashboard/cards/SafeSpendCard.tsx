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
  premiumSurface: string;
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
  premiumSurface,
  inputStyle,
  applePhysics,
  stepperBtn,
}) => {
  return (
    <Card className={cn(premiumSurface, "p-6 sm:p-10 border-border/40 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft")}>
      <CardHeader className="p-0 mb-6 sm:mb-10">
        <CardTitle className="text-xl sm:text-2xl font-black text-[#1a1a1a] flex items-center gap-5 sm:gap-6 uppercase tracking-tighter">
          {/* Circular Premium Icon Container - Urgency Style */}
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-[#DC2626]" />
          </div>
          <div>
            {t('dashboard.safeSpend', 'Safe-Spend Limit')}
            <p className="text-[10px] sm:text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">Strategic Monthly Burn Cap</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-8 sm:space-y-10">
        <div className="flex flex-col gap-6 sm:gap-10">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
            <Input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className={cn(inputStyle, "h-14 sm:h-18 rounded-2xl sm:rounded-[24px] bg-background border-border/40 text-lg sm:text-xl font-black text-[#1a1a1a] focus:border-border/80 shadow-inner px-6 sm:px-8")} placeholder={t('dashboard.setLimit', "Establish Burn Threshold")} />
            <Button disabled={isSavingBudget} onClick={handleSaveBudget} className={cn(applePhysics, "h-14 sm:h-18 sm:min-w-[180px] bg-[#1a1a1a] text-white rounded-2xl sm:rounded-[24px] px-8 sm:px-12 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] sm:tracking-[0.3em] shadow-lg sm:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-[#111111] transition-all duration-500 active:scale-[0.97]")}>
              {isSavingBudget ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : t('common.setLimit', "Deploy")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {[100, 500].flatMap(val => [
              <button key={`minus-${val}`} onClick={() => adjustBudget(-val)} className={cn(stepperBtn, "h-10 sm:h-12 px-4 sm:px-6 bg-background border border-border/60 text-[#525252] rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-[0.15em] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 shadow-sm")}><Minus className="h-3.5 w-3.5 mr-1.5 sm:mr-2 inline opacity-60" /> {val}</button>,
              <button key={`plus-${val}`} onClick={() => adjustBudget(val)} className={cn(stepperBtn, "h-10 sm:h-12 px-4 sm:px-6 bg-background border border-border/60 text-[#525252] rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-[0.15em] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 shadow-sm")}><Plus className="h-3.5 w-3.5 mr-1.5 sm:mr-2 inline opacity-60" /> {val}</button>
            ])}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
