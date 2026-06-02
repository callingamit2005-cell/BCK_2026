/**
 * SavingsGoalCard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Goal Tracking Terminal.
 * 🛡️ LOGIC LOCK: Progress math, formatting, and deletion logic 100% untouched.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Trash2 } from 'lucide-react';
import { tSafe } from '@/i18n';
import { formatCurrency } from '@/utils/currencyFormatter';
import { cn } from '@/lib/utils';

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
    <Card className="fintech-card relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: goal.color }} />
      <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-surface border border-border/50 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
              <Target className="h-5 w-5" style={{ color: goal.color }} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground tracking-tight">{goal.name}</CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {isComplete
                  ? tSafe('savings.goal.achieved', 'Threshold Reached')
                  : `${formatCurrency(remaining)} ${tSafe('savings.goal.toGo', 'remaining')}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-60 group-hover:opacity-100 shadow-sm"
            onClick={() => onDelete(goal.id)}
            title="Remove Target"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {tSafe('savings.goal.progress', 'Trajectory')}
            </span>
            <span className="text-xs font-bold font-mono tracking-tighter" style={{ color: goal.color }}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden border border-border/50 shadow-inner">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 shadow-sm group-hover:border-primary/20 transition-all">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {tSafe('savings.goal.saved', 'Secured')}
            </p>
            <p className="text-lg font-bold text-foreground font-mono tracking-tighter tabular-nums leading-none">
              {formatCurrency(goal.currentSaved)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 shadow-sm group-hover:border-primary/20 transition-all">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {tSafe('savings.goal.target', 'Target')}
            </p>
            <p className="text-lg font-bold text-muted-foreground font-mono tracking-tighter tabular-nums leading-none">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;
