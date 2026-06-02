/**
 * CreateGoalForm.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Target Initialization Terminal.
 * 🛡️ LOGIC LOCK: Validation, PAISA conversion, and submission flow 100% untouched.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Target, IndianRupee } from 'lucide-react';
import { tSafe } from '@/i18n';
import { convertToPaisa } from '@/utils/currencyFormatter';
import { cn } from '@/lib/utils';

interface CreateGoalFormProps {
  onCreateGoal: (name: string, targetAmount: number) => void;
}

const CreateGoalForm = ({ onCreateGoal }: CreateGoalFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !targetAmount) return;

    const cleanedAmount = targetAmount.replace(/,/g, "").trim();
    const amountInPaisa = convertToPaisa(cleanedAmount);
    
    onCreateGoal(goalName.trim(), amountInPaisa);
    setGoalName('');
    setTargetAmount('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full h-24 border border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all rounded-2xl shadow-sm group"
        variant="ghost"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-2 rounded-xl bg-surface border border-border/50 group-hover:bg-primary/5 transition-colors">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
            {tSafe('savings.form.addNewGoal', 'Initialize Target')}
          </span>
        </div>
      </Button>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <Card className="border border-primary/20 bg-surface rounded-2xl overflow-hidden shadow-institutional">
        <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground tracking-tight">
                  {tSafe('savings.form.createTitle', 'New Objective')}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {tSafe('savings.form.createDescription', 'Establish a financial benchmark')}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goalName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                {tSafe('savings.form.goalNameLabel', 'Objective Name')}
              </Label>
              <Input
                id="goalName"
                placeholder={tSafe('savings.form.goalNamePlaceholder', 'e.g. Dream Portfolio')}
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="h-12 bg-muted/20 border-border/50 text-foreground font-semibold rounded-xl focus:border-primary/50 focus:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                {tSafe('savings.form.targetAmountLabel', 'Threshold (₹)')}
              </Label>
              <div className="relative group">
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder={tSafe('savings.form.targetAmountPlaceholder', '0.00')}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className={cn(
                    "h-14 bg-muted/20 border-border/50 text-xl font-bold text-foreground font-mono tabular-nums tracking-tighter rounded-xl",
                    "focus:border-primary/50 focus:ring-primary/20 shadow-sm pl-10 pr-6"
                  )}
                  min="1"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground group-focus-within:text-primary">
                  ₹
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-6 border-t border-border/50">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-12 border border-border text-muted-foreground font-bold uppercase text-[11px] tracking-widest rounded-xl hover:bg-muted hover:text-foreground transition-all shadow-sm active:scale-95" 
                onClick={() => setIsOpen(false)}
              >
                {tSafe('common.cancel', 'Abort')}
              </Button>
              <Button 
                type="submit" 
                className="flex-[1.5] h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[11px] tracking-widest rounded-xl shadow-premium transition-all active:scale-95 disabled:opacity-50" 
                disabled={!goalName.trim() || !targetAmount}
              >
                <Plus className="h-4 w-4 mr-2" />
                {tSafe('savings.form.createButton', 'Deploy Goal')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateGoalForm;
