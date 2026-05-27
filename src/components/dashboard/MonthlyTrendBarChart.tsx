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
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface MonthlyTrendBarChartProps {
  transactions: any[];
  isLoading?: boolean;
}

const MonthlyTrendBarChart = ({ transactions, isLoading }: MonthlyTrendBarChartProps) => {
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  console.log("MonthlyTrendBarChart Logic Start", { 
    txCount: transactions?.length, 
    isLoading, 
    isAndroid,
    platform: Capacitor.getPlatform()
  });

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      console.log("MonthlyTrendBarChart: No transactions to process");
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

    console.log("MonthlyTrendBarChart: Chart Data Computed", result);
    return result;
  }, [transactions]);

  const isDataEmpty = !isLoading && chartData.every(d => d.value === 0);
  console.log("MonthlyTrendBarChart: Render State", { isDataEmpty, isLoading });

  return (
    <Card className="bg-surface border border-border shadow-sm rounded-[24px] overflow-hidden" style={{ minHeight: '240px' }}>
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-[#111111] text-[10px] font-black uppercase tracking-[0.2em]">
          Monthly Spending Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex items-center justify-center" style={{ height: 180 }}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#999999]" />
            <span className="text-[10px] font-black text-[#999999] uppercase tracking-widest">Loading Engine...</span>
          </div>
        ) : isDataEmpty ? (
          <div className="flex flex-col items-center gap-1 opacity-20">
            <span className="text-[10px] font-black text-[#111111] uppercase tracking-widest">No spending data yet</span>
          </div>
        ) : (
          <div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center" }}>
            {isAndroid ? (
              <BarChart width={320} height={180} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999999', fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999999', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-border p-2 rounded-lg shadow-2xl">
                          <p className="text-[10px] font-black text-[#999999] uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-xs font-black text-[#ff0f7b]">{formatCurrency(payload[0].value as number)}</p>
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
                      fill={index === chartData.length - 1 ? '#ff0f7b' : 'rgba(0,0,0,0.1)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#999999', fontSize: 10, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#999999', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-border p-2 rounded-lg shadow-2xl">
                            <p className="text-[10px] font-black text-[#999999] uppercase mb-1">{payload[0].payload.name}</p>
                            <p className="text-xs font-black text-[#ff0f7b]">{formatCurrency(payload[0].value as number)}</p>
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
                        fill={index === chartData.length - 1 ? '#ff0f7b' : 'rgba(0,0,0,0.1)'} 
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
