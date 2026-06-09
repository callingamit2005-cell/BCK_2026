/**
 * DashboardLayout.tsx - BachatKaro Premium Fintech Edition
 * UI: Professional Institutional Grid Foundation.
 * 🛡️ LOGIC LOCK: useBachatData hook and routing 100% untouched.
 */

import React from 'react';
import { useBachatData } from '@/hooks/useBachatData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Wallet, Sparkles, TrendingDown, ArrowRight, UserCircle, Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import FinancialSummary from './FinancialSummary';
import { formatCurrency } from '@/utils/currencyFormatter';

const DashboardLayout: React.FC = () => {
  const { totalBalance, monthlyExpenses, transactions, loading } = useBachatData();
  const { user } = useAuth();

  // Premium Interaction Config
  const cardInteraction = {
    whileTap: { scale: 0.985 },
    transition: { type: "spring", stiffness: 400, damping: 30 }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans custom-scrollbar">
      
      <div className="relative z-10 flex flex-col gap-8 p-6 md:p-10 max-w-xl mx-auto animate-fade-in-up">
        
        {/* SECTION 1: INSTITUTIONAL HEADER */}
        <header className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pulse Dashboard</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Namaste, <span className="text-primary">{user?.user_metadata?.full_name || 'User'}</span>
            </h1>
          </div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="h-12 w-12 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm cursor-pointer hover:border-primary/20 transition-colors"
          >
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </motion.div>
        </header>

        {/* SECTION 2: LIQUIDITY TERMINAL */}
        <motion.div 
          {...cardInteraction}
          className="fintech-card p-8 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
            <ShieldCheck size={120} />
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Liquidity</span>
          </div>

          <h2 className="text-5xl font-bold tracking-tighter font-mono tabular-nums text-foreground relative z-10">
            {loading ? '₹ --,---' : formatCurrency(totalBalance)}
          </h2>

          <div className="mt-10 pt-8 border-t border-border/50 flex gap-12 relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monthly Burn</p>
              <p className="text-xl font-bold text-foreground font-mono tabular-nums">
                {loading ? '₹ --' : formatCurrency(monthlyExpenses)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Retention</p>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-income" />
                <p className="text-xl font-bold text-foreground font-mono tabular-nums">92%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 2.5: VELOCITY SUMMARY */}
        <FinancialSummary transactions={transactions} loading={loading} />

        {/* SECTION 3: AI MENTOR TERMINAL */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          {...cardInteraction}
          className="fintech-card p-8 text-center border-primary/10 shadow-sm cursor-pointer group"
        >
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 flex items-center gap-2 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence Active</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-4 leading-relaxed">
            "Your spending velocity is <span className="text-primary">12% lower</span> than last week. Optimizing habits."
          </h3>
          <p className="text-muted-foreground text-xs font-medium mb-8 uppercase tracking-wider">Tap to audit financial engine</p>
          
          <Button 
            className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-sm group-hover:opacity-95"
          >
            <Sparkles className="h-4 w-4 mr-2" /> Ask Finance Mentor
          </Button>
        </motion.div>

        {/* SECTION 4: ACTIVITY LOG */}
        <section className="space-y-6 pt-4">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Audit Trail</p>
              <h4 className="text-sm font-bold text-foreground tracking-tight">Recent Activity</h4>
            </div>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-all">
              Full History <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 w-full bg-muted/20 border border-border/40 rounded-2xl animate-pulse" />
              ))
            ) : transactions.map((t, idx) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                {...cardInteraction}
                className="bg-card p-5 rounded-2xl border border-border/40 flex items-center justify-between group cursor-pointer shadow-sm hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                    <TrendingDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground tracking-tight uppercase truncate max-w-[140px]">{t.name || 'External Burn'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{t.category || 'Others'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-foreground font-mono tabular-nums tracking-tighter">
                    - {formatCurrency(t.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' · '}
                    {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
