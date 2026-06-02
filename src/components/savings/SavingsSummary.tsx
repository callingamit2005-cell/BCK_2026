/**
 * SavingsSummary.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Level Portfolio Aggregation.
 * 🛡️ LOGIC LOCK: Aggregation math and data logic 100% untouched.
 */

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Wallet } from 'lucide-react';
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

interface SavingsSummaryProps {
  goals: SavingsGoal[];
}

const SavingsSummary = ({ goals }: SavingsSummaryProps) => {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentSaved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const completedGoals = goals.filter((g) => g.currentSaved >= g.targetAmount).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Accumulated */}
      <Card className="fintech-card overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-savings/10 border border-savings/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <Wallet className="h-5 w-5 text-savings" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
              {tSafe('savings.summary.totalSaved', 'Accumulated')}
            </p>
            <p className="text-xl font-bold text-foreground font-mono tracking-tighter tabular-nums leading-none">
              {formatCurrency(totalSaved)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Aggregate Target */}
      <Card className="fintech-card overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm group-hover:bg-primary/5 group-hover:border-primary/20">
            <Target className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
              {tSafe('savings.summary.totalTarget', 'Aggregate')}
            </p>
            <p className="text-xl font-bold text-foreground font-mono tracking-tighter tabular-nums leading-none">
              {formatCurrency(totalTarget)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Success Rate */}
      <Card className="fintech-card overflow-hidden group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm",
            completedGoals > 0 ? "bg-income/10 border-income/20" : "bg-muted/20 border-border/50"
          )}>
            <TrendingUp className={cn("h-5 w-5", completedGoals > 0 ? "text-income" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
              {tSafe('savings.summary.completed', 'Success Rate')}
            </p>
            <p className="text-xl font-bold text-foreground font-mono tracking-tighter tabular-nums leading-none">
              <span className={cn(completedGoals > 0 ? "text-income" : "text-foreground")}>{completedGoals}</span>
              <span className="text-muted-foreground opacity-50 mx-1">/</span>
              <span className="text-foreground">{goals.length}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsSummary;
