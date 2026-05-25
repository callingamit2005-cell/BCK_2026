import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Trash2 } from 'lucide-react';

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
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-1 h-full" 
        style={{ backgroundColor: goal.color }}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg" 
              style={{ backgroundColor: `${goal.color}20` }}
            >
              <Target className="h-4 w-4" style={{ color: goal.color }} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isComplete ? '🎉 Goal achieved!' : `₹${remaining.toLocaleString()} to go`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium" style={{ color: goal.color }}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className="h-3"
              style={{ 
                ['--progress-color' as string]: goal.color 
              }}
            />
          </div>
        </div>

        {/* Amount Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Saved</p>
            <p className="text-lg font-bold text-emerald-600">
              ₹{goal.currentSaved.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Target</p>
            <p className="text-lg font-bold text-primary">
              ₹{goal.targetAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalCard;
