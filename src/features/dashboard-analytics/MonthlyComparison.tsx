/**
 * MonthlyComparison.tsx - BachatKaro Neon Enterprise Edition
 * UI: True Dark Neon Glass V2 bar chart (Income vs. Spent)
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Props {
  currentMonthTotal: number;
  lastMonthTotal: number;
}

// 🛑 FIX: Changed to default export to match Dashboard imports
export default function MonthlyComparison({ currentMonthTotal, lastMonthTotal }: Props) {
  const { t } = useLanguage();

  const data = [
    { name: t('common.lastMonth', 'Last Month'), value: lastMonthTotal, color: '#A855F7' }, // Purple
    { name: t('common.thisMonth', 'This Month'), value: currentMonthTotal, color: '#EC4899' }, // Pink
  ];

  const diff = currentMonthTotal - lastMonthTotal;
  const isSaving = diff <= 0;
  const percentChange = lastMonthTotal > 0 ? Math.abs((diff / lastMonthTotal) * 100).toFixed(1) : '0';

  return (
    <div className="bg-[#0a0014]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[32px] overflow-hidden p-8 space-y-6 transform-gpu transition-all hover:border-[#ff0f7b]/30">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-black text-white flex items-center gap-4 tracking-widest uppercase italic">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
            <TrendingUp className="h-5 w-5 text-pink-500" />
          </div>
          {t('dashboard.monthlyVelocity', 'Monthly Velocity')}
        </h3>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-lg",
          isSaving ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        )}>
          {isSaving ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {percentChange}%
        </div>
      </div>

      <div className="h-[200px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} 
              contentStyle={{ backgroundColor: '#0a0014', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff' }} 
              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={45}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}66)` }} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}