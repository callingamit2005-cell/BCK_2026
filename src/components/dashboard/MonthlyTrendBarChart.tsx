/**
 * MonthlyTrendBarChart.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Trend Visualization.
 * 🛡️ LOGIC LOCK: Aggregation, chart data logic, and platform checks 100% untouched.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Loader2, BarChart3 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { cn } from '@/lib/utils';

interface MonthlyTrendBarChartProps {
  transactions: any[];
  isLoading?: boolean;
}

const MonthlyTrendBarChart = ({ transactions, isLoading }: MonthlyTrendBarChartProps) => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return { name: format(date, 'MMM'), value: 0 };
      });
    }
    
    // Generate last 6 months slots
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        total: 0,
      };
    });

    // Aggregate expenses only (in raw paisa)
    transactions.forEach((tx) => {
      if (tx.type !== 'expense' && tx.direction !== 'debit') return;
      
      const txDate = new Date(tx.date);
      const amount = Number(tx.amount) || 0;

      months.forEach((m) => {
        if (isWithinInterval(txDate, { start: m.start, end: m.end })) {
          m.total += amount;
        }
      });
    });

    const result = months.map((m) => ({
      name: m.month,
      value: m.total,
    }));

    return result;
  }, [transactions]);

  const isDataEmpty = !isLoading && chartData.every(d => d.value === 0);

  return (
    <Card className="fintech-card overflow-hidden" style={{ minHeight: '240px' }}>
      <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          Monthly Spending Trend
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 flex items-center justify-center" style={{ height: 200 }}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading Engine...</span>
          </div>
        ) : isDataEmpty ? (
          <div className="flex flex-col items-center gap-2 opacity-50">
            <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No spending data yet</span>
          </div>
        ) : (
          <div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center" }}>
            {isAndroid ? (
              <BarChart width={320} height={180} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface/95 backdrop-blur-md border border-border shadow-premium p-4 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{payload[0].payload.name}</p>
                          <p className="text-sm font-bold text-foreground font-mono tabular-nums tracking-tighter">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  barSize={24}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.4)'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '700' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface/95 backdrop-blur-md border border-border shadow-premium p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-foreground font-mono tabular-nums tracking-tighter">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.4)'} 
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendBarChart;
