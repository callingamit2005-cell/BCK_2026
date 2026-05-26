import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
}

interface FinancialSummaryProps {
  transactions: Transaction[];
  loading?: boolean;
}

/**
 * FinancialSummary - High-Velocity Financial Header
 * UI System: Premium Monochrome
 * Interaction: scale(0.965) + butter-soft physics
 */
const FinancialSummary: React.FC<FinancialSummaryProps> = ({ transactions, loading }) => {
  
  // 1. Data Logic Engine
  const summary = useMemo(() => {
    const totalIn = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const totalOut = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut
    };
  }, [transactions]);

  // Interaction Config
  const summaryInteraction = {
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 300, damping: 20, ease: [0.34, 1.56, 0.64, 1] }
  };

  return (
    <div className="w-full relative">
      {/* Horizontal Scroll Container with Edge Protection */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 snap-x transform-gpu">
        
        {/* Card A: Total In */}
        <motion.div 
          {...summaryInteraction}
          className="bg-surface min-w-[160px] p-5 rounded-[24px] border border-white/5 snap-start flex flex-col gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/5 rounded-lg">
              <ArrowUpRight className="h-3.5 w-3.5 text-white/40" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total In</span>
          </div>
          <p className="text-xl font-black text-foreground font-mono tracking-tighter">
            {loading ? '---' : formatCurrency(summary.totalIn)}
          </p>
        </motion.div>

        {/* Card B: Total Out */}
        <motion.div 
          {...summaryInteraction}
          className="bg-surface min-w-[160px] p-5 rounded-[24px] border border-white/5 snap-start flex flex-col gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/5 rounded-lg">
              <ArrowDownRight className="h-3.5 w-3.5 text-white/40" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Out</span>
          </div>
          <p className="text-xl font-black text-foreground font-mono tracking-tighter">
            {loading ? '---' : formatCurrency(summary.totalOut)}
          </p>
        </motion.div>

        {/* Card C: Net Balance (Hero Card) */}
        <motion.div 
          {...summaryInteraction}
          className="bg-surface min-w-[200px] p-5 rounded-[24px] border border-white/10 snap-start flex flex-col gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Activity className="h-3.5 w-3.5 text-white/60" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Net Surplus</span>
          </div>
          <p className="text-2xl font-black font-mono tracking-tighter text-foreground">
            {loading ? '---' : formatCurrency(summary.net)}
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default FinancialSummary;
