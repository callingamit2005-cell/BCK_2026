/**
 * Savings.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Savings Tracking Terminal.
 * 🛡️ LOGIC LOCK: Goal creation, deletion, offline caching, and sync 100% untouched.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, ArrowLeft, Target, PlusCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SavingsGoalCard from '@/components/savings/SavingsGoalCard';
import CreateGoalForm from '@/components/savings/CreateGoalForm';
import SavingsSummary from '@/components/savings/SavingsSummary';
import { useI18nNamespaces } from "@/hooks/useI18nNamespaces";
import { tSafe } from "@/i18n";
import { cn } from '@/lib/utils';
import { fetchLocalOrCloud, saveAndSync, deleteAndSync } from '@/integrations/sqliteService';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  color: string;
}

// Accessible, distinct goal colors using the design system palette
const GOAL_COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const Savings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  useI18nNamespaces(["savings", "common", "dashboard", "split"]);

  const fetchGoals = useCallback(async (force = false) => {
    if (!user || (!force && isFetchingRef.current)) return;

    isFetchingRef.current = true;
    try {
      const data = await fetchLocalOrCloud('savings_goals', user.id);

      const mappedGoals = (data || []).map((g, i) => ({
        id: g.id,
        name: g.goal_name,
        targetAmount: Number(g.target_amount),
        currentSaved: Number(g.saved_amount ?? 0),
        color: GOAL_COLORS[i % GOAL_COLORS.length],
      }));

      setGoals(mappedGoals);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error("Fetch goals failed:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) await fetchGoals();
    };

    init();

    const handleLocalUpdate = () => {
      if (isMounted) void fetchGoals(true);
    };

    window.addEventListener('sync_queue_updated', handleLocalUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('sync_queue_updated', handleLocalUpdate);
    };
  }, [fetchGoals]);

  const handleCreateGoal = async (name: string, targetAmount: number) => {
    if (!user) return;

    try {
      const payload = {
        user_id: user.id,
        goal_name: name,
        target_amount: targetAmount,
        saved_amount: 0,
      };

      await saveAndSync('savings_goals', payload, 'INSERT');

      toast({
        title: tSafe('common.success', 'Goal established'),
        description: tSafe('savings.goal.created', 'Target integrated into financial ledger.'),
        className: 'bg-surface border-primary text-foreground shadow-premium'
      });
    } catch (error: any) {
      toast({ title: tSafe('common.error', 'Error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteAndSync('savings_goals', id);

      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast({
        title: tSafe('savings.goalDeleted', 'Goal removed'),
        description: tSafe('savings.goalDeletedDesc', 'Target expunged from ledger.'),
      });
    } catch (error: any) {
      toast({ title: tSafe('common.error', 'Error'), description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-10 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-[60] bg-surface/80 backdrop-blur-xl border-b border-border/50 pt-[var(--safe-area-top)] transition-all duration-500">
        <div className="max-w-4xl mx-auto flex justify-between items-center h-16 md:h-20 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-10 w-10 md:h-11 md:w-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm hidden sm:flex">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-none">
                  {tSafe('savings.page.title', 'Savings Growth')}
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
                  {tSafe('savings.subtitle', 'Strategic Accumulation Terminal')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
        
        {/* Summary (only when goals exist) */}
        {goals.length > 0 && (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <SavingsSummary goals={goals} />
          </div>
        )}

        {/* Create goal form */}
        <Card className="fintech-card overflow-hidden bg-surface">
          <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <PlusCircle className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {tSafe('savings.newGoalLabel', 'New Objective')}
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">
              {tSafe('savings.newAmbition', 'Define Financial Target')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <CreateGoalForm onCreateGoal={handleCreateGoal} />
          </CardContent>
        </Card>

        {/* Goals grid */}
        {goals.length > 0 && (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {goals.map((goal, idx) => (
              <div 
                key={goal.id} 
                className="animate-in fade-in slide-in-from-bottom-4" 
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <SavingsGoalCard
                  goal={goal}
                  onDelete={handleDeleteGoal}
                />
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
              {tSafe('savings.loading', 'Synchronizing Ledger…')}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && goals.length === 0 && (
          <Card className="border-dashed border-2 border-border/50 bg-muted/10 rounded-2xl overflow-hidden shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="h-16 w-16 bg-surface p-4 rounded-2xl mb-6 border border-border/60 shadow-sm flex items-center justify-center">
                <Target className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                {tSafe('savings.noActiveAmbitions', 'No Active Targets')}
              </h3>
              <p className="text-xs text-muted-foreground font-medium max-w-xs leading-relaxed opacity-80">
                {tSafe(
                  'savings.no_goals',
                  "Initialize your first savings trajectory above to begin tracking financial growth."
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Savings;
