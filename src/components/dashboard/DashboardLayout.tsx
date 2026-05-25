import React from 'react';
import { useBachatData } from '@/hooks/useBachatData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Wallet, Sparkles, TrendingDown, ArrowRight, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import FinancialSummary from './FinancialSummary';
import { formatCurrency } from '@/utils/currencyFormatter';

/**
 * DashboardLayout - BachatKaro Neon Enterprise Edition
 * UI System: True Dark Neon Glass V2 + Framer Motion
 * Interaction DNA: Soft Elastic Return, Micro-glow, GPU Accelerated
 */
const DashboardLayout: React.FC = () => {
  const { totalBalance, monthlyExpenses, transactions, loading } = useBachatData();
  const { user } = useAuth();

  // Interaction Config
  const cardInteraction = {
    whileTap: { 
      scale: 0.965,
      boxShadow: "0 0 25px rgba(255, 15, 123, 0.4)",
    },
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20,
      mass: 1,
      ease: [0.34, 1.56, 0.64, 1] // butter-soft return
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0014] relative overflow-x-hidden font-sans custom-scrollbar">
      {/* Luminescent Mesh Streaks - GPU Accelerated */}
      <div className="absolute inset-0 pointer-events-none opacity-5 transform-gpu">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[linear-gradient(45deg,transparent_45%,#ff0f7b_48%,#5f0a87_52%,transparent_55%)] bg-[length:100px_100px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-10 p-6 md:p-8 max-w-xl mx-auto transform-gpu">
        
        {/* Section 1: Header */}
        <header className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="space-y-1"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b3b3b3]">Good Morning</p>
            <h1 className="text-2xl font-black text-white tracking-tighter italic">
              Namaste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87]">{user?.user_metadata?.full_name || 'BachatKaro User'}</span>
            </h1>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="btn-soft h-12 w-12 rounded-2xl glass-v2 flex items-center justify-center border-white/10 shadow-lg cursor-pointer"
          >
            <UserCircle className="h-7 w-7 text-[#b3b3b3]" />
          </motion.div>
        </header>

        {/* Section 2: Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          {...cardInteraction}
          className="glass-v2 p-8 rounded-[36px] border-[#ff0f7b]/20 shadow-[0_20px_50px_-12px_rgba(255,15,123,0.3)] cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#ff0f7b]/10 rounded-xl">
              <Wallet className="h-5 w-5 text-[#ff0f7b]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b3b3b3]">Total Liquidity</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] drop-shadow-lg">
            {loading ? '₹ --,---' : formatCurrency(totalBalance)}
          </h2>
          <div className="mt-6 pt-6 border-t border-white/5 flex gap-8">
            <div>
              <p className="text-[9px] font-bold text-[#b3b3b3] uppercase tracking-widest mb-1">Monthly Burn</p>
              <p className="text-lg font-black text-white font-mono">{loading ? '₹ --' : formatCurrency(monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#b3b3b3] uppercase tracking-widest mb-1">Savings Goal</p>
              <p className="text-lg font-black text-emerald-400 font-mono italic">0%</p>
            </div>
          </div>
        </motion.div>

        {/* Section 2.5: Financial Summary Header */}
        <FinancialSummary transactions={transactions} loading={loading} />

        {/* Section 3: AI Mentor Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          {...cardInteraction}
          className="glass-v2 p-10 rounded-[40px] text-center border-[#5f0a87]/30 shadow-[0_0_40px_-10px_rgba(95,10,135,0.4)] cursor-pointer"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ff0f7b] blur-xl opacity-20 animate-pulse rounded-full" />
              <div className="relative px-4 py-1.5 rounded-full glass-v2 border-[#ff0f7b]/40 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff0f7b] animate-pulse shadow-[0_0_8px_#ff0f7b]" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">AI Active</span>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tight mb-4 leading-tight">
            "Your spending velocity is <span className="text-[#ff0f7b]">12% lower</span> than last week. Shabaash! You can save ₹2,400 more this month."
          </h3>
          <p className="text-[#b3b3b3] text-sm font-medium mb-8">Tap to optimize your budget engine</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-soft mx-auto flex items-center gap-3 bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] text-white px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-[10px] shadow-xl"
          >
            <Sparkles className="h-4 w-4" /> Ask Finance Mentor
          </motion.button>
        </motion.div>

        {/* Section 4: Transaction List */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">Neural Ledger</h4>
            <button className="text-[10px] font-black text-[#ff0f7b] uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity">
              View History <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 w-full glass-v2 rounded-3xl animate-pulse bg-white/5 border-white/5" />
              ))
            ) : transactions.map((t, idx) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                {...cardInteraction}
                className="glass-v2 p-5 rounded-[28px] border-white/5 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#ff0f7b]/5 transition-colors">
                    <TrendingDown className="h-5 w-5 text-[#b3b3b3] group-hover:text-[#ff0f7b] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-tight uppercase">{t.name || 'External Burn'}</p>
                    <p className="text-[9px] font-bold text-[#b3b3b3] uppercase tracking-widest">{t.category || 'Others'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-white font-mono tracking-tighter">
                    - {formatCurrency(t.amount)}
                  </p>
                  <p className="text-[8px] font-bold text-[#b3b3b3] uppercase tracking-tighter">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default DashboardLayout;
