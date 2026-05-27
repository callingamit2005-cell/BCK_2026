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
    <div className="grid grid-cols-3 gap-4 sm:gap-6">
      <Card className="bg-surface border-border shadow-sm rounded-[24px] overflow-hidden group hover:border-foreground/10 transition-all">
        <CardContent className="p-6 text-center">
          <div className="p-2.5 bg-background border border-border rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Wallet className="h-5 w-5 text-text-secondary" />
          </div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{tSafe('savings.summary.totalSaved', 'Accumulated')}</p>
          <p className="text-xl font-bold text-foreground font-mono tracking-tighter">{formatCurrency(totalSaved)}</p>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm rounded-[24px] overflow-hidden group hover:border-foreground/10 transition-all">
        <CardContent className="p-6 text-center">
          <div className="p-2.5 bg-background border border-border rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Target className="h-5 w-5 text-text-secondary" />
          </div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{tSafe('savings.summary.totalTarget', 'Aggregate')}</p>
          <p className="text-xl font-bold text-foreground font-mono tracking-tighter">{formatCurrency(totalTarget)}</p>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm rounded-[24px] overflow-hidden group hover:border-foreground/10 transition-all">
        <CardContent className="p-6 text-center">
          <div className="p-2.5 bg-background border border-border rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5 text-text-secondary" />
          </div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{tSafe('savings.summary.completed', 'Success Rate')}</p>
          <p className="text-xl font-bold text-foreground font-mono tracking-tighter">
            {completedGoals}<span className="text-text-muted mx-1 opacity-40">/</span><span className="text-text-secondary">{goals.length}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsSummary;
