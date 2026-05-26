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
        className="w-full h-24 border-2 border-dashed border-white/5 bg-transparent hover:bg-white/5 text-white/20 hover:text-white/40 transition-all rounded-[24px]"
        variant="ghost"
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{tSafe('savings.form.addNewGoal', 'Add New Goal')}</span>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border border-white/10 bg-white/5 rounded-[24px] overflow-hidden">
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black text-white uppercase tracking-tighter">{tSafe('savings.form.createTitle', 'Create New Goal')}</CardTitle>
            <CardDescription className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{tSafe('savings.form.createDescription', 'Set a savings target to track')}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/20 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goalName" className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{tSafe('savings.form.goalNameLabel', 'Goal Name')}</Label>
            <Input
              id="goalName"
              placeholder={tSafe('savings.form.goalNamePlaceholder', 'e.g., Emergency Fund')}
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="h-12 bg-white/5 border-white/5 text-white font-bold rounded-xl focus:border-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAmount" className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">{tSafe('savings.form.targetAmountLabel', 'Target Amount (₹)')}</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder={tSafe('savings.form.targetAmountPlaceholder', 'e.g., 50000')}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="h-12 bg-white/5 border-white/5 text-white font-black text-lg rounded-xl focus:border-white/20 font-mono"
              min="1"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 bg-white text-background hover:bg-white/90 font-black uppercase text-[10px] tracking-widest rounded-xl" disabled={!goalName.trim() || !targetAmount}>
              <Plus className="h-4 w-4 mr-2" />
              {tSafe('savings.form.createButton', 'Create Goal')}
            </Button>
            <Button type="button" variant="ghost" className="h-12 border border-white/5 text-white/40 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/5" onClick={() => setIsOpen(false)}>
              {tSafe('common.cancel', 'Cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateGoalForm;
