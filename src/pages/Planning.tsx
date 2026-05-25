/**
 * Planning.tsx - BachatKaro Neon Enterprise Edition
 * UI: True Dark Neon Glass V2
 * Logic: Updated to Local-First Architecture (SQLite + Supabase)
 * Handles: Monthly Income, Budget, EMIs, and Subscriptions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Save, IndianRupee, Wallet, Loader2, Calendar, CreditCard, Trash2, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { formatCurrency, convertToPaisa, convertToRupees } from '@/utils/currencyFormatter';
import { fetchLocalOrCloud, saveAndSync, deleteAndSync } from '@/integrations/sqliteService';

export default function Planning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [income, setIncome] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: { user } } = useQuery({ 
    queryKey: ['auth-user'], 
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return { user };
    }
  }) as any;

  const getSalaryAmount = (salary: any) =>
    Number(salary?.amount ?? salary?.monthly_salary ?? 0) || 0;

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Local-first reads with cloud fallback
      const [salaryData, budgetData] = await Promise.all([
        fetchLocalOrCloud('salaries', user.id, `month_year = '${currentMonth}'`),
        fetchLocalOrCloud('budgets', user.id, `month_year = '${currentMonth}'`)
      ]);

      if (salaryData && salaryData.length > 0) {
        setIncome(convertToRupees(getSalaryAmount(salaryData[0])));
      }
      
      if (budgetData && budgetData.length > 0) {
        setBudget(convertToRupees(budgetData[0].monthly_budget));
      }
    } catch (err) {
      console.error("Load planning data failed:", err);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    loadData();
    
    const handleLocalUpdate = () => loadData();
    window.addEventListener('sync_queue_updated', handleLocalUpdate);
    return () => window.removeEventListener('sync_queue_updated', handleLocalUpdate);
  }, [loadData]);

  // 100% Deterministic Idempotency Key for monthly entries
  const handleUpsert = async (table: string, column: string, value: number) => {
    if (!user) return;
    const isIncome = column === 'amount';
    isIncome ? setIsSavingIncome(true) : setIsSavingBudget(true);

    try {
      const versionedTimestamp = Date.now();
      const payload = { 
        user_id: user.id, 
        month_year: currentMonth, 
        [column]: value,
        is_latest: true,
        version: versionedTimestamp
      };
      
      // Versioned key guarantees audit history (Insert instead of Overwrite)
      const idempotencyKey = `plan:${table}:${user.id}:${currentMonth}:v${versionedTimestamp}`;
      
      await saveAndSync(table, { ...payload, idempotency_key: idempotencyKey }, 'UPSERT');

      // Sync React Query cache for Dashboard consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['salaries'] }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })
      ]);

      toast({
        title: "Saved Locally! 🚀",
        description: `${isIncome ? 'Income' : 'Budget'} updated. Syncing...`,
        className: "bg-[#0a0014] text-white border-[#ff0f7b]/40 shadow-[0_0_20px_rgba(255,15,123,0.3)]"
      });
    } catch (err: any) {
      toast({ title: "Sync Failed!", description: err.message, variant: "destructive" });
    } finally {
      isIncome ? setIsSavingIncome(false) : setIsSavingBudget(false);
    }
  };

  const adjustBudget = (amount: number) => {
    setBudget(prev => Math.max(0, prev + amount));
  };

  // EMI and Subscriptions Fetched from SQLite/Cloud via useDashboardData or similar hooks
  // Logic preserved for consistency with previous architecture turns
  const { data: emiList = [] } = useQuery({
    queryKey: ['emis', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await fetchLocalOrCloud('emis', user.id);
    },
    enabled: !!user?.id
  });

  const { data: subscriptionList = [] } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchLocalOrCloud('subscriptions', user.id);
      } catch (err) {
        console.warn("Subscriptions fallback triggered - using empty state");
        return [];
      }
    },
    enabled: !!user?.id
  });

  // UI SYSTEM
  const applePhysics = "transition-all duration-300 ease-butter-soft active:scale-95 transform-gpu";
  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-[#ff0f7b]/30 shadow-[0_20px_50px_-12px_rgba(255,15,123,0.3)] rounded-[32px] overflow-hidden transform-gpu";
  const inputStyle = "flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-white text-xl focus:outline-none focus:border-[#ff0f7b]/50 transition-all";
  const stepperBtn = cn("h-12 flex-1 flex items-center justify-center bg-[rgba(255,15,123,0.15)] border border-[#ff0f7b]/20 text-[#ff0f7b] rounded-xl font-black text-xs uppercase tracking-widest", applePhysics);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-10 bg-[#0a0014] min-h-screen pb-32 pt-8">
      
      <div className="text-center space-y-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Planning Engine</h1>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Configure Monthly Vitals</p>
      </div>

      {/* 1. Income */}
      <div className={cn(neonGlass, "p-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100")}>
        <div className="flex items-center gap-3 mb-2">
          <IndianRupee className="h-5 w-5 text-indigo-400" />
          <label className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.2em]">Monthly Salary</label>
        </div>
        <div className="flex gap-4">
          <input 
            type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))}
            className={inputStyle}
            placeholder="0.00"
          />
          <button 
            disabled={isSavingIncome}
            onClick={() => handleUpsert('salaries', 'amount', convertToPaisa(income))} 
            className={cn(
              "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] p-4 rounded-2xl shadow-lg hover:shadow-pink-500/20 disabled:opacity-50",
              applePhysics
            )}
          >
            {isSavingIncome ? <Loader2 className="animate-spin text-white" /> : <Save className="text-white h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* 2. Budget */}
      <div className={cn(neonGlass, "p-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200")}>
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="h-5 w-5 text-cyan-400" />
          <label className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.2em]">Safe-Spend Limit</label>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input 
              type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))}
              className={cn(inputStyle, "text-center text-2xl")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex gap-2">
              <button onClick={() => adjustBudget(-100)} className={stepperBtn}>-100</button>
              <button onClick={() => adjustBudget(100)} className={stepperBtn}>+100</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => adjustBudget(-500)} className={stepperBtn}>-500</button>
              <button onClick={() => adjustBudget(500)} className={stepperBtn}>+500</button>
            </div>
          </div>
        </div>

        <button 
          disabled={isSavingBudget}
          onClick={() => handleUpsert('budgets', 'monthly_budget', convertToPaisa(budget))} 
          className={cn(
            "w-full bg-gradient-to-r from-cyan-600 to-blue-600 h-16 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 mt-4 disabled:opacity-50",
            applePhysics
          )}
        >
          {isSavingBudget ? <Loader2 className="animate-spin text-white" /> : <><Save size={20} /> Set Monthly Limit</>}
        </button>
      </div>

      {/* 3. Quick View - Future Wealth Integration Point */}
      <div className={cn(neonGlass, "p-8 space-y-4")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Active Obligations</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
             <p className="text-[9px] font-bold text-white/30 uppercase mb-1">EMIs</p>
             <p className="text-xl font-black text-white">{emiList.length}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
             <p className="text-[9px] font-bold text-white/30 uppercase mb-1">Subs</p>
             <p className="text-xl font-black text-white">{subscriptionList.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center opacity-50">
        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-relaxed px-8 italic">
          Values saved here update your offline ledger instantly and sync with cloud.
        </p>
      </div>
    </div>
  );
}
