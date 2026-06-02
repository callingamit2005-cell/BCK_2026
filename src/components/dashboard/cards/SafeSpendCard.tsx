/**
 * SafeSpendCard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Budget Planning Terminal.
 * 🛡️ LOGIC LOCK: Save flow, stepper adjustments, and data persistence 100% untouched.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet, Loader2, Minus, Plus, Settings2, Sparkles } from 'lucide-react';
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
  premiumSurface?: string;
  inputStyle?: string;
  applePhysics?: string;
  stepperBtn?: string;
}

// Stepper steps (Locked)
const STEPPER_STEPS = [100, 500, 1000, 5000];

export const SafeSpendCard: React.FC<SafeSpendCardProps> = React.memo(({
  budgetInput,
  setBudgetInput,
  handleSaveBudget,
  isSavingBudget,
  adjustBudget,
  t,
}) => {
  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0 shadow-sm">
            <Wallet className="h-5 w-5 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {t('dashboard.safeSpend', 'Monthly Budget')}
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              Target Spending Velocity
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-10">
        {/* INPUT SECTION */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Monthly Ceiling
            </label>
            <div className="relative group">
              <Input
                type="number"
                min="0"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className={cn(
                  "h-14 rounded-xl bg-muted/20 border-border/50 text-xl font-bold text-foreground font-mono tabular-nums",
                  "focus:ring-warning focus:border-warning/50 transition-all pl-10 pr-6"
                )}
                placeholder="0.00"
                aria-label={t('dashboard.safeSpend', 'Monthly Budget')}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground group-focus-within:text-warning">₹</span>
            </div>
          </div>
          
          <Button
            disabled={isSavingBudget}
            onClick={handleSaveBudget}
            className="w-full sm:w-auto h-14 px-8 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest rounded-xl shadow-premium hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {isSavingBudget ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Settings2 className="h-4 w-4 mr-2" />
                {t('common.setLimit', 'Set Budget')}
              </>
            )}
          </Button>
        </div>

        {/* STEPPER GRID */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 ml-1">
            <Sparkles className="h-3.5 w-3.5 text-warning/60" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('dashboard.quickAdjust', 'Precision Adjustments')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPPER_STEPS.map(val => (
              <div key={val} className="flex gap-2">
                <button
                  onClick={() => adjustBudget(-val)}
                  className="flex-1 h-12 flex items-center justify-center bg-surface border border-border/50 rounded-xl text-muted-foreground hover:text-expense hover:border-expense/20 hover:bg-expense/5 transition-all shadow-sm active:scale-95 group"
                  aria-label={`Decrease budget by ₹${val}`}
                >
                  <Minus className="h-3 w-3 group-hover:scale-125 transition-transform" />
                  <span className="ml-1.5 text-[10px] font-bold font-mono">
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </span>
                </button>
                <button
                  onClick={() => adjustBudget(val)}
                  className="flex-1 h-12 flex items-center justify-center bg-surface border border-border/50 rounded-xl text-muted-foreground hover:text-income hover:border-income/20 hover:bg-income/5 transition-all shadow-sm active:scale-95 group"
                  aria-label={`Increase budget by ₹${val}`}
                >
                  <Plus className="h-3 w-3 group-hover:scale-125 transition-transform" />
                  <span className="ml-1.5 text-[10px] font-bold font-mono">
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground font-medium italic pt-2 ml-1">
          *Setting a budget activates over-spending alerts and pattern optimization.
        </p>
      </CardContent>
    </Card>
  );
});

SafeSpendCard.displayName = 'SafeSpendCard';
