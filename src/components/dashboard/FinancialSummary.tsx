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
 * UI System: Premium Fintech
 * Interaction: spring-based physics for premium feel
 */
const FinancialSummary: React.FC<FinancialSummaryProps> = ({ transactions, loading }) => {
  
  // 1. Data Logic Engine (Locked)
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
    whileTap: { scale: 0.96 },
    transition: { type: "spring", stiffness: 400, damping: 30 }
  };

  return (
    <div className="w-full relative">
      {/* Horizontal Scroll Container with Edge Protection */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 snap-x transform-gpu">
        
        {/* Card A: Total In */}
        <motion.div 
          {...summaryInteraction}
          className="fintech-card min-w-[170px] p-5 snap-start flex flex-col gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-income/10 rounded-lg border border-income/20">
              <ArrowUpRight className="h-4 w-4 text-income" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-income transition-colors">Monthly In</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums tracking-tight">
            {loading ? '---' : formatCurrency(summary.totalIn)}
          </p>
        </motion.div>

        {/* Card B: Total Out */}
        <motion.div 
          {...summaryInteraction}
          className="fintech-card min-w-[170px] p-5 snap-start flex flex-col gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-expense/10 rounded-lg border border-expense/20">
              <ArrowDownRight className="h-4 w-4 text-expense" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-expense transition-colors">Monthly Out</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums tracking-tight">
            {loading ? '---' : formatCurrency(summary.totalOut)}
          </p>
        </motion.div>

        {/* Card C: Net Balance (Hero Card) */}
        <motion.div 
          {...summaryInteraction}
          className="fintech-card min-w-[220px] p-5 snap-start flex flex-col gap-3 cursor-pointer group bg-muted/20 border-primary/20 shadow-institutional"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-primary transition-colors">Net Balance</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tighter text-foreground">
            {loading ? '---' : formatCurrency(summary.net)}
          </p>
          <div className="absolute top-0 right-0 h-full w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
        </motion.div>

      </div>
    </div>
  );
};

export default FinancialSummary;
