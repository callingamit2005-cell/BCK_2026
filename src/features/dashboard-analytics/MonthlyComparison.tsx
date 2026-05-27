/**
 * MonthlyComparison.tsx - BachatKaro Luxury Analytics Surface
 * UI: institutional Fintech / Apple Wallet style (Income vs. Spent)
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Props {
  currentMonthTotal: number;
  lastMonthTotal: number;
}

export default function MonthlyComparison({ currentMonthTotal, lastMonthTotal }: Props) {
  const { t } = useLanguage();

  const diff = currentMonthTotal - lastMonthTotal;
  const isSaving = diff <= 0; // Lower spending is good
  const percentChange = lastMonthTotal > 0 ? Math.abs((diff / lastMonthTotal) * 100).toFixed(1) : '0';

  const data = [
    { 
      name: t('common.lastMonth', 'Last Month'), 
      value: lastMonthTotal, 
      color: '#737373' // Graphite Muted for context
    },
    { 
      name: t('common.thisMonth', 'This Month'), 
      value: currentMonthTotal, 
      color: isSaving ? '#10b981' : '#f43f5e' // Emerald if lower, Rose if higher
    },
  ];

  return (
    <div className="bg-surface border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden p-10 space-y-10 transform-gpu transition-all duration-700 ease-butter-soft hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          {/* Circular Premium Icon Container - Analytics Style */}
          <div className="h-14 w-14 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-105">
            <Activity className="h-6 w-6 text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1a1a1a] tracking-tighter uppercase leading-tight">
              {t('dashboard.monthlyVelocity', 'Monthly Velocity')}
            </h3>
            <p className="text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">
              {t('dashboard.velocitySub', 'Spending Momentum')}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "flex flex-col items-end gap-1.5 px-6 py-3 rounded-2xl border transition-all duration-700 shadow-sm",
          isSaving 
            ? "bg-fintech-emerald-muted border-fintech-emerald/20 text-fintech-emerald-dark" 
            : "bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]"
        )}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em]">
            {isSaving ? <ArrowDownRight size={14} className="animate-bounce" /> : <ArrowUpRight size={14} className="animate-bounce" />}
            {percentChange}% {isSaving ? 'Efficiency' : 'Burn'}
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full mt-6 relative flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="6 6" stroke="rgba(0,0,0,0.04)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#737373', fontSize: 11, fontWeight: '900' }} 
              dy={15}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 12 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-white border border-border/80 shadow-2xl p-5 rounded-[24px] animate-in zoom-in-95 duration-500">
                      <p className="text-[11px] font-black text-fintech-graphite-muted uppercase mb-2 tracking-[0.2em]">{entry.name}</p>
                      <p className="text-xl font-black text-[#1a1a1a] font-mono tracking-tighter tabular-nums leading-none">
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]} 
              barSize={60}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  className="transition-all duration-700 hover:opacity-85 cursor-pointer shadow-xl"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics Footer Insight */}
      <div className="pt-8 border-t border-border/40 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-fintech-graphite-muted opacity-60">
        <span>Verified Analysis</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fintech-emerald" />
          <span>Real-time Sync Active</span>
        </div>
      </div>
    </div>
  );
}