import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Wallet } from 'lucide-react';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  color: string;
}

interface SavingsSummaryProps {
  goals: SavingsGoal[];
}

const SavingsSummary = ({ goals }: SavingsSummaryProps) => {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentSaved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoals = goals.filter(g => g.currentSaved >= g.targetAmount).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4 text-center">
          <Wallet className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
          <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
          <p className="text-lg font-bold text-emerald-600">
            ₹{totalSaved.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-2 text-blue-600" />
          <p className="text-xs text-muted-foreground mb-1">Total Target</p>
          <p className="text-lg font-bold text-blue-600">
            ₹{totalTarget.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-amber-600" />
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-lg font-bold text-amber-600">
            {completedGoals}/{goals.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsSummary;
