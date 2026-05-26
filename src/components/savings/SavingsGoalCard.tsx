import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Trash2 } from 'lucide-react';
import { tSafe } from '@/i18n';
import { formatCurrency } from '@/utils/currencyFormatter';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  color: string;
}

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDelete: (id: string) => void;
}

const SavingsGoalCard = ({ goal, onDelete }: SavingsGoalCardProps) => {
  const progressPercentage = Math.min(100, (goal.currentSaved / goal.targetAmount) * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.currentSaved);
  const isComplete = progressPercentage >= 100;

  return (
    <Card className="relative overflow-hidden bg-surface border-border shadow-sm rounded-[24px]">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: goal.color }} />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Target className="h-4.5 w-4.5" style={{ color: goal.color }} />
            </div>
            <div>
              <CardTitle className="text-base font-black text-white uppercase tracking-tighter">{goal.name}</CardTitle>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                {isComplete
                  ? tSafe('savings.goal.achieved', 'Goal achieved!')
                  : `${formatCurrency(remaining)} ${tSafe('savings.goal.toGo', 'to go')}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/20 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{tSafe('savings.goal.progress', 'Progress')}</span>
            <span className="text-[11px] font-black font-mono tracking-tighter" style={{ color: goal.color }}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-1.5 bg-white/5" style={{ ['--progress-color' as string]: goal.color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{tSafe('savings.goal.saved', 'Saved')}</p>
            <p className="text-xl font-black text-white font-mono tracking-tighter">{formatCurrency(goal.currentSaved)}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{tSafe('savings.goal.target', 'Target')}</p>
            <p className="text-xl font-black text-white/60 font-mono tracking-tighter">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;
