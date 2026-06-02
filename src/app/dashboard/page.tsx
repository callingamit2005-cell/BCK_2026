"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Plus, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, 
  History, TrendingUp, Loader2, Bell, LogOut 
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { isCurrentMonth } from '@/utils/dateFilters';

// --- TYPES & INTERFACES (Enterprise Standard) ---
interface Transaction {
  id: string;
  amount: number;
  note: string;
  category: string;
  type: 'income' | 'expense';
  created_at: string;
}

// --- UTILS: FORMATEURS ---
const formatINR = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ balance: 0, spent: 0 });

  // --- DATA ENGINE: REAL-TIME FETCH ---
  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return (window.location.href = '/login');
      
      setUser(session.user);
      await fetchDashboardData();
      setLoading(false);
    };

    const fetchDashboardData = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setTransactions(data);
        const totalSpent = data
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        setStats({ balance: 0, spent: totalSpent }); // Dynamic balance logic will go here
      }
    };

    initDashboard();

    // REAL-TIME LISTENER: Update UI when new transaction is added
    const channel = supabase.channel('realtime_transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, 
      () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // --- FILTER: CURRENT MONTH ONLY ---
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => isCurrentMonth(t.created_at));
  }, [transactions]);

  // --- UI COMPONENTS: SKELETON LOADERS ---
  const Skeleton = () => (
    <div className="animate-pulse bg-surface/5 border border-white/10 rounded-3xl h-32 w-full" />
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 font-sans selection:bg-foreground/10 relative overflow-hidden">
      
      {/* 1. LAYER: SUBTLE PREMIUM TEXTURE */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* 2. NAVIGATION: ENTERPRISE HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              BachatKaro
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {loading ? "Syncing data..." : `Namaste, ${user?.user_metadata?.full_name || 'User'}!`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-full bg-surface border border-border text-text-secondary hover:text-foreground transition-all shadow-sm"><Bell size={20}/></button>
            <button className="h-12 w-12 rounded-full border border-border bg-surface flex items-center justify-center shadow-md active:scale-95 transition-all">
              <span className="text-foreground font-bold text-lg">{user?.email?.[0].toUpperCase() || 'A'}</span>
            </button>
          </div>
        </header>

        {/* 3. CORE: MAIN METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          
          {/* HERO CARD: PREMIUM LIQUIDITY VIEW */}
          <div className="md:col-span-2 relative group rounded-modal bg-surface border border-border shadow-sm overflow-hidden">
            <div className="p-10 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 blur-[100px] pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
                  <p className="text-text-secondary uppercase tracking-wider text-xs font-bold">Net Liquidity</p>
                </div>
                <h2 className="text-6xl font-mono font-bold tracking-tighter tabular-nums text-foreground">
                  {loading ? "----" : formatINR(stats.balance)}
                </h2>
              </div>
              
              <div className="flex gap-4 mt-12">
                <button className="flex-1 bg-background border border-border hover:border-foreground transition-all duration-300 rounded-2xl p-4 flex items-center justify-center gap-3 active:scale-[0.98] group/btn shadow-sm">
                  <ArrowUpRight className="text-text-secondary group-hover:text-foreground transition-colors" size={20} />
                  <span className="font-bold text-xs uppercase tracking-wider text-text-secondary group-hover:text-foreground">Income</span>
                </button>
                <button className="flex-1 bg-foreground text-surface hover:bg-foreground/90 transition-all duration-300 rounded-2xl p-4 flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg">
                  <Plus size={22} strokeWidth={2.5} />
                  <span className="font-bold text-xs uppercase tracking-wider">Expense</span>
                </button>
              </div>
            </div>
          </div>

          {/* SIDE STATS: MINIMAL STAT CARDS */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-3xl p-6 hover:border-foreground/20 transition-all group shadow-sm">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-background border border-border text-text-secondary group-hover:text-foreground transition-colors"><ArrowDownLeft size={28}/></div>
                <div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Monthly Burn</p>
                  <p className="text-2xl font-mono mt-1 font-bold text-foreground">{loading ? "..." : formatINR(stats.spent)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-3xl p-6 group shadow-sm">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-background border border-border text-text-secondary group-hover:text-foreground transition-colors"><PieChart size={28}/></div>
                <div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Savings Goal</p>
                  <p className="text-2xl font-mono mt-1 font-bold text-foreground">0%</p>
                </div>
              </div>
              <div className="mt-6 w-full bg-background h-2 rounded-full overflow-hidden border border-border">
                <div className="bg-foreground h-full w-[0%] transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. ACTIVITY: TRANSACTION LEDGER */}
        <section className="mt-16">
          <div className="flex justify-between items-end mb-8 px-2">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
              <History size={26} className="text-text-secondary" />
              Recent Activity
            </h3>
            <button className="text-text-secondary hover:text-foreground text-xs font-bold uppercase tracking-wider transition-all border-b border-transparent hover:border-foreground">Audit All</button>
          </div>

          <div className="space-y-4">
            {loading ? [1,2,3].map(i => <Skeleton key={i} />) : currentMonthTransactions.length > 0 ? (
              currentMonthTransactions.map((t) => (
                <div key={t.id} className="group bg-surface hover:bg-background transition-all border border-border hover:border-foreground/20 p-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.995] cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-background border border-border group-hover:border-foreground/20 transition-all">
                      <Wallet size={24} className="text-text-secondary group-hover:text-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-base text-foreground group-hover:translate-x-1 transition-transform tracking-tight uppercase">{t.note}</p>
                      <p className="text-xs text-text-secondary mt-1 font-bold uppercase tracking-wider opacity-80">
                        {t.category} • {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-xl font-bold ${t.type === 'income' ? 'text-foreground' : 'text-foreground'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatINR(t.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-3xl bg-surface">
                <p className="text-text-muted font-mono uppercase tracking-wider text-xs font-bold">Zero records detected in current cycle</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
