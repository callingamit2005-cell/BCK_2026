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
      scale: 0.985,
    },
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans custom-scrollbar">
      {/* Premium Foundation - Subtle Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] transform-gpu">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 p-6 md:p-8 max-w-xl mx-auto transform-gpu">
        
        {/* Section 1: Header */}
        <header className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-0.5"
          >
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-secondary">Dashboard</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Namaste, <span className="text-foreground">{user?.user_metadata?.full_name || 'User'}</span>
            </h1>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="btn-soft h-12 w-12 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-sm cursor-pointer"
          >
            <UserCircle className="h-6 w-6 text-text-secondary" />
          </motion.div>
        </header>

        {/* Section 2: Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          {...cardInteraction}
          className="bg-surface p-8 rounded-[32px] border border-border shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-background rounded-xl border border-border">
              <Wallet className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-text-secondary">Available Liquidity</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tighter font-mono text-foreground">
            {loading ? '₹ --,---' : formatCurrency(totalBalance)}
          </h2>
          <div className="mt-8 pt-8 border-t border-border flex gap-10">
            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Monthly Burn</p>
              <p className="text-xl font-bold text-foreground font-mono">{loading ? '₹ --' : formatCurrency(monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Savings Goal</p>
              <p className="text-xl font-bold text-foreground font-mono">0%</p>
            </div>
          </div>
        </motion.div>

        {/* Section 2.5: Financial Summary Header */}
        <FinancialSummary transactions={transactions} loading={loading} />

        {/* Section 3: AI Mentor Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          {...cardInteraction}
          className="bg-surface p-10 rounded-[32px] text-center border border-border shadow-sm cursor-pointer"
        >
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1.5 rounded-full bg-background border border-border flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">AI Intelligence</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-4 leading-snug">
            "Your spending velocity is <span className="underline decoration-border underline-offset-4">12% lower</span> than last week. Excellent progress."
          </h3>
          <p className="text-text-secondary text-sm font-medium mb-8">Tap to optimize your financial engine</p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-soft mx-auto flex items-center gap-3 bg-foreground text-surface px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-md"
          >
            <Sparkles className="h-4 w-4" /> Ask Finance Mentor
          </motion.button>
        </motion.div>

        {/* Section 4: Transaction List */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h4 className="text-[12px] font-bold text-foreground uppercase tracking-[0.2em]">Recent Activity</h4>
            <button className="text-[11px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1 hover:text-foreground transition-colors">
              History <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 w-full bg-surface border border-border rounded-2xl animate-pulse" />
              ))
            ) : transactions.map((t, idx) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                {...cardInteraction}
                className="bg-surface p-5 rounded-2xl border border-border flex items-center justify-between group cursor-pointer shadow-sm hover:border-text-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-background border border-border flex items-center justify-center group-hover:border-text-muted transition-colors">
                    <TrendingDown className="h-5 w-5 text-text-secondary group-hover:text-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground tracking-tight uppercase">{t.name || 'External Burn'}</p>
                    <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">{t.category || 'Others'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground font-mono tracking-tighter">
                    - {formatCurrency(t.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter">
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
