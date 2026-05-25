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
    <div className="animate-pulse bg-white/5 border border-white/10 rounded-3xl h-32 w-full" />
  );

  return (
    <div className="min-h-screen bg-[#0a0014] text-white p-6 md:p-8 font-sans selection:bg-[#ff0f7b]/30 relative overflow-hidden">
      
      {/* 1. LAYER: LUMINESCENT MESH BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-[#ff0f7b] opacity-[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-[#5f0a87] opacity-[0.05] blur-[180px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* 2. NAVIGATION: ENTERPRISE HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,15,123,0.3)]">
              BachatKaro
            </h1>
            <p className="text-[#b3b3b3] text-sm mt-1">
              {loading ? "Syncing data..." : `Namaste, ${user?.user_metadata?.full_name || 'Ankit Parasar'}!`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-full bg-white/5 border border-white/10 text-[#b3b3b3] hover:text-[#ff0f7b] transition-all"><Bell size={20}/></button>
            <button className="h-12 w-12 rounded-full border border-[#ff0f7b]/30 bg-white/5 flex items-center justify-center backdrop-blur-md shadow-lg shadow-pink-500/10">
              <span className="text-[#ff0f7b] font-bold text-lg">{user?.email?.[0].toUpperCase() || 'A'}</span>
            </button>
          </div>
        </header>

        {/* 3. CORE: MAIN METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* HERO CARD: HIGH REFRACTION GLASS */}
          <div className="md:col-span-2 relative group rounded-[32px] p-[1px] bg-gradient-to-br from-[#ff0f7b] to-[#5f0a87] shadow-2xl">
            <div className="bg-[#0a0014] rounded-[31px] p-8 h-full flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff0f7b] opacity-10 blur-[80px] group-hover:opacity-20 transition-all duration-700" />
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#00ffcc] animate-pulse" />
                  <p className="text-[#b3b3b3] uppercase tracking-[0.25em] text-[10px] font-black">Net Liquidity</p>
                </div>
                <h2 className="text-6xl font-mono font-bold tracking-tighter tabular-nums text-white">
                  {loading ? "----" : formatINR(stats.balance)}
                </h2>
              </div>
              
              <div className="flex gap-4 mt-10">
                <button className="flex-1 bg-white/[0.03] border border-white/10 hover:border-[#ff0f7b]/50 hover:bg-[#ff0f7b]/10 transition-all duration-300 rounded-2xl p-4 flex items-center justify-center gap-2 active:scale-[0.965] group/btn">
                  <ArrowUpRight className="text-[#ff0f7b] group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" size={20} />
                  <span className="font-bold text-sm uppercase tracking-wider">Income</span>
                </button>
                <button className="flex-1 bg-[#ff0f7b] hover:shadow-[0_0_40px_rgba(255,15,123,0.6)] transition-all duration-500 rounded-2xl p-4 flex items-center justify-center gap-2 text-white active:scale-[0.965]">
                  <Plus size={22} strokeWidth={3} />
                  <span className="font-bold text-sm uppercase tracking-widest">Expense</span>
                </button>
              </div>
            </div>
          </div>

          {/* SIDE STATS: NEON STAT CARDS */}
          <div className="space-y-6">
            <div className="bg-white/[0.04] backdrop-blur-[32px] border border-white/[0.08] rounded-3xl p-7 hover:border-white/[0.2] transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#00ffcc]/10 text-[#00ffcc] group-hover:scale-110 transition-transform"><ArrowDownLeft size={26}/></div>
                <div>
                  <p className="text-[10px] text-[#b3b3b3] font-black uppercase tracking-widest">Monthly Burn</p>
                  <p className="text-2xl font-mono mt-1 font-bold text-white">{loading ? "..." : formatINR(stats.spent)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/[0.04] backdrop-blur-[32px] border border-white/[0.08] rounded-3xl p-7 group">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#5f0a87]/30 text-[#ff0f7b] group-hover:rotate-12 transition-transform"><PieChart size={26}/></div>
                <div>
                  <p className="text-[10px] text-[#b3b3b3] font-black uppercase tracking-widest">Savings Goal</p>
                  <p className="text-2xl font-mono mt-1 font-bold text-white">0%</p>
                </div>
              </div>
              <div className="mt-5 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] h-full w-[0%] transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. ACTIVITY: TRANSACTION LEDGER */}
        <section className="mt-12">
          <div className="flex justify-between items-end mb-8 px-2">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <History size={24} className="text-[#ff0f7b]" />
              Recent Ledger
            </h3>
            <button className="text-[#b3b3b3] hover:text-[#ff0f7b] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b border-transparent hover:border-[#ff0f7b]">Audit All</button>
          </div>

          <div className="space-y-4">
            {loading ? [1,2,3].map(i => <Skeleton key={i} />) : currentMonthTransactions.length > 0 ? (
              currentMonthTransactions.map((t) => (
                <div key={t.id} className="group bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-[#ff0f7b]/30 p-6 rounded-[24px] flex items-center justify-between backdrop-blur-md active:scale-[0.99] cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-[#ff0f7b]/10 transition-all">
                      <Wallet size={22} className="text-[#b3b3b3] group-hover:text-[#ff0f7b]" />
                    </div>
                    <div>
                      <p className="font-bold text-base text-white group-hover:translate-x-1 transition-transform tracking-tight">{t.note}</p>
                      <p className="text-[10px] text-[#b3b3b3] mt-1 font-black uppercase tracking-wider italic opacity-60">
                        {t.category} • {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-xl font-bold ${t.type === 'income' ? 'text-[#00ffcc] drop-shadow-[0_0_10px_rgba(0,255,204,0.4)]' : 'text-white'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center border-2 border-dashed border-white/10 rounded-[32px] bg-white/[0.01]">
                <p className="text-[#b3b3b3] font-mono uppercase tracking-widest">No data detected in ledger</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}