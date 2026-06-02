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
      color: '#94A3B8' // Neutral muted for context/reference bar
    },
    {
      name: t('common.thisMonth', 'This Month'),
      value: currentMonthTotal,
      color: isSaving ? '#16A34A' : '#DC2626' // Green if spending less, red if spending more
    },
  ];

  return (
    <div className="bg-surface border border-border/40 shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          {/* Circular Premium Icon Container - Analytics Style */}
          <div className="h-10 w-10 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="h-5 w-5 text-foreground/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight">
              {t('dashboard.monthlyVelocity', 'Month-on-Month')}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {t('dashboard.velocitySub', 'Spending vs last month')}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "flex flex-col items-end gap-1 px-4 py-2.5 rounded-xl border transition-all duration-300 shadow-sm",
          isSaving
            ? "bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]"
            : "bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]"
        )}>
          <div className="flex items-center gap-1.5 text-xs font-semibold font-mono tabular-nums">
            {isSaving ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {percentChange}% {isSaving ? t('dashboard.saved', 'less') : t('dashboard.more', 'more')}
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
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
                    <div className="bg-surface border border-border/80 shadow-2xl p-5 rounded-premium animate-in zoom-in-95 duration-500">
                      <p className="text-xs font-black text-text-muted uppercase mb-2 tracking-wider">{entry.name}</p>
                      <p className="text-xl font-black text-foreground font-mono tracking-tighter tabular-nums leading-none">
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

      {/* Footer */}
      <div className="pt-5 border-t border-border/40 flex justify-between items-center text-xs text-text-muted">
        <span>{t('dashboard.spendingComparison', 'Spending comparison')}</span>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", isSaving ? "bg-[#16A34A]" : "bg-[#DC2626]")} />
          <span>{isSaving ? t('dashboard.spendingDown', 'Down from last month') : t('dashboard.spendingUp', 'Up from last month')}</span>
        </div>
      </div>
    </div>
  );
}
