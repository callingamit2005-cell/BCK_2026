import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { tSafe } from '@/i18n';
import { convertToPaisa } from '@/utils/currencyFormatter';

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
        className="w-full h-24 border-2 border-dashed border-border bg-background hover:bg-surface text-text-muted hover:text-text-secondary transition-all rounded-[32px] shadow-sm"
        variant="ghost"
      >
        <div className="flex flex-col items-center gap-3">
          <Plus className="h-6 w-6" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{tSafe('savings.form.addNewGoal', 'Initialize Target')}</span>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border border-border bg-surface rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <CardHeader className="pb-5 border-b border-border bg-background/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground uppercase tracking-tight">{tSafe('savings.form.createTitle', 'New Objective')}</CardTitle>
            <CardDescription className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1.5">{tSafe('savings.form.createDescription', 'Establish a financial benchmark')}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-text-muted hover:text-foreground hover:bg-background rounded-full transition-all"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2.5">
            <Label htmlFor="goalName" className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest">{tSafe('savings.form.goalNameLabel', 'Objective Name')}</Label>
            <Input
              id="goalName"
              placeholder={tSafe('savings.form.goalNamePlaceholder', 'e.g. Dream Portfolio')}
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="h-14 bg-background border-border text-foreground font-bold rounded-2xl focus:border-foreground shadow-inner"
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="targetAmount" className="text-[10px] font-bold text-text-secondary ml-1 uppercase tracking-widest">{tSafe('savings.form.targetAmountLabel', 'Threshold (₹)')}</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder={tSafe('savings.form.targetAmountPlaceholder', '0.00')}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="h-14 bg-background border-border text-foreground font-bold text-xl rounded-2xl focus:border-foreground font-mono shadow-inner"
              min="1"
            />
          </div>
          <div className="flex gap-4 pt-4 border-t border-border mt-4">
            <Button type="button" variant="ghost" className="flex-1 h-16 border border-border text-text-secondary font-bold uppercase text-[11px] tracking-widest rounded-2xl hover:bg-background transition-all shadow-sm" onClick={() => setIsOpen(false)}>
              {tSafe('common.cancel', 'Abort')}
            </Button>
            <Button type="submit" className="flex-[1.5] h-16 bg-foreground text-surface hover:bg-foreground/90 font-bold uppercase text-[11px] tracking-widest rounded-2xl shadow-xl transition-all active:scale-95" disabled={!goalName.trim() || !targetAmount}>
              <Plus className="h-4 w-4 mr-3" />
              {tSafe('savings.form.createButton', 'Deploy Goal')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateGoalForm;
