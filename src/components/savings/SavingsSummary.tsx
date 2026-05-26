import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Wallet } from 'lucide-react';
import { tSafe } from '@/i18n';
import { formatCurrency } from '@/utils/currencyFormatter';

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
  const completedGoals = goals.filter((g) => g.currentSaved >= g.targetAmount).length;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <Card className="bg-surface border-border shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 text-center">
          <Wallet className="h-4.5 w-4.5 mx-auto mb-3 text-white/40" />
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{tSafe('savings.summary.totalSaved', 'Total Saved')}</p>
          <p className="text-lg font-black text-white font-mono tracking-tighter">{formatCurrency(totalSaved)}</p>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 text-center">
          <Target className="h-4.5 w-4.5 mx-auto mb-3 text-white/40" />
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{tSafe('savings.summary.totalTarget', 'Total Target')}</p>
          <p className="text-lg font-black text-white/60 font-mono tracking-tighter">{formatCurrency(totalTarget)}</p>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 text-center">
          <TrendingUp className="h-4.5 w-4.5 mx-auto mb-3 text-white/40" />
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">{tSafe('savings.summary.completed', 'Completed')}</p>
          <p className="text-lg font-black text-white font-mono tracking-tighter">
            {completedGoals}<span className="text-white/20">/</span>{goals.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsSummary;
