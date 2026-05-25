import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SavingsGoalCard from '@/components/savings/SavingsGoalCard';
import CreateGoalForm from '@/components/savings/CreateGoalForm';
import SavingsSummary from '@/components/savings/SavingsSummary';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  color: string;
}

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Savings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(
        data.map((g, i) => ({
          id: g.id,
          name: g.goal_name,
          targetAmount: Number(g.target_amount),
          currentSaved: Number(g.saved_amount ?? 0),
          color: GOAL_COLORS[i % GOAL_COLORS.length],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (name: string, targetAmount: number) => {
    if (!user) return;

    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      goal_name: name,
      target_amount: targetAmount,
      saved_amount: 0,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Goal created!' });
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Savings Goals</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6 max-w-2xl">
        {/* Summary Cards */}
        {goals.length > 0 && <SavingsSummary goals={goals} />}

        {/* Create Goal Form */}
        <CreateGoalForm onCreateGoal={handleCreateGoal} />

        {/* Goals List */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Your Goals
              <span className="text-sm font-normal text-muted-foreground">
                ({goals.length} active)
              </span>
            </h2>
            <div className="space-y-4">
              {goals.map((goal) => (
                <SavingsGoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          </div>
        ) : !loading ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
              <p className="text-sm text-muted-foreground">
                Start by creating your first savings goal above!
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Savings Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Set realistic targets based on your monthly income
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Prioritize emergency fund before other goals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Review and update your progress weekly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Celebrate small wins to stay motivated!
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Savings;
