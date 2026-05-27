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
    <Card className="relative overflow-hidden bg-surface border-border shadow-sm rounded-[32px]">
      <div className="absolute top-0 left-0 w-1 h-full opacity-40" style={{ backgroundColor: goal.color }} />
      <CardHeader className="pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-background border border-border shadow-inner">
              <Target className="h-5 w-5" style={{ color: goal.color }} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground uppercase tracking-tight">{goal.name}</CardTitle>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1.5">
                {isComplete
                  ? tSafe('savings.goal.achieved', 'Threshold Reached')
                  : `${formatCurrency(remaining)} ${tSafe('savings.goal.toGo', 'remaining')}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-text-muted hover:text-rose-500 hover:bg-background rounded-full transition-all"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-8">
        <div className="space-y-3.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{tSafe('savings.goal.progress', 'Trajectory')}</span>
            <span className="text-[12px] font-bold font-mono tracking-tighter" style={{ color: goal.color }}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-2 bg-background border border-border" style={{ ['--progress-color' as string]: goal.color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-background border border-border shadow-inner">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{tSafe('savings.goal.saved', 'Secured')}</p>
            <p className="text-xl font-bold text-foreground font-mono tracking-tighter">{formatCurrency(goal.currentSaved)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-background border border-border shadow-inner">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{tSafe('savings.goal.target', 'Target')}</p>
            <p className="text-xl font-bold text-text-secondary font-mono tracking-tighter">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;
