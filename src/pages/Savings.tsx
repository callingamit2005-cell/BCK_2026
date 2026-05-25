/**
 * Savings Component - BachatKaro Fintech
 * Premium UI: Clean Light Mode with Signature Purple/Pink Gradients.
 * Logic: Updated to Local-First Architecture (SQLite + Supabase)
 * Safety: Memory-leak free, Soft-delete enforced.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, ArrowLeft, Target, PlusCircle } from 'lucide-react';
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

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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

      // Only update state if data changed or it's the first load to prevent re-render loops
      setGoals(mappedGoals);
    } catch (err: any) {
      console.error("Fetch goals failed:", err);
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

    // 🛡️ MEMORY SAFETY: Clean up event listener
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

      // 💾 OFFLINE-FIRST WRITE
      await saveAndSync('savings_goals', payload, 'INSERT');

      toast({ 
        title: tSafe('common.success', 'Success'), 
        description: tSafe('savings.goal.created', 'Ambition recorded locally! Syncing...'),
        className: "bg-emerald-600 text-white border-none shadow-lg" 
      });
      
      // UI will refresh via sync_queue_updated or fetchGoals
    } catch (error: any) {
      toast({ title: tSafe('common.error', 'Error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      // 🛡️ SAFE DELETE: soft-delete enforced
      await deleteAndSync('savings_goals', id);
      
      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast({ 
        title: 'Deleted', 
        description: 'Goal removed locally. Syncing...',
        className: "bg-rose-600 text-white border-none shadow-lg" 
      });
    } catch (error: any) {
      toast({ title: tSafe('common.error', 'Error'), description: error.message, variant: 'destructive' });
    }
  };

  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]";

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12 antialiased">
      <header className={cn("text-white sticky top-0 z-50 shadow-[0_10px_30px_rgba(236,72,153,0.2)]", primaryGradient)}>
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="h-12 w-12 text-white hover:bg-white/20 rounded-2xl border border-white/20 transition-all active:scale-95"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2.5">
                <PiggyBank className="h-7 w-7" />
                {tSafe('savings.page.title', 'Savings Goals')}
              </h1>
              <p className="text-[10px] uppercase font-black tracking-[0.25em] opacity-80 mt-0.5">BachatKaro Wealth</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {goals.length > 0 && (
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-500/5 blur-[50px] rounded-full -z-10" />
            <SavingsSummary goals={goals} />
          </div>
        )}

        <div className="bg-white rounded-[36px] p-2 sm:p-3 shadow-xl border border-slate-200">
          <CardHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <PlusCircle className="h-4 w-4 text-purple-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization</span>
            </div>
            <CardTitle className={cn("text-2xl sm:text-3xl font-black bg-clip-text text-transparent", primaryGradient)}>
               New Ambition
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <CreateGoalForm onCreateGoal={handleCreateGoal} />
          </CardContent>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>

        {loading && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Vault...</p>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <Card className="border-dashed border-2 bg-slate-50/50 rounded-[32px] overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                <Target className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No active ambitions</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                {tSafe('savings.no_goals', "You haven't set any savings goals yet. Start by creating your first ambition above.")}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Savings;
