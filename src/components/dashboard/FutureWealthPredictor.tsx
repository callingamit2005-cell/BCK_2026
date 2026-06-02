/**
 * FutureWealthPredictor.tsx - BachatKaro Premium Fintech Edition
 * UI: Professional Financial Planning Terminal.
 * 🛡️ LOGIC LOCK: SIP projection formulas and calculations 100% untouched.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Zap, 
  PieChart as PieChartIcon,
  HelpCircle,
  Info
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FutureWealthPredictorProps {
  monthlySavings: number;
}

// Enterprise Financial Standards (Locked)
const INVESTMENT_MIN = 0;
const INVESTMENT_MAX = 200000;
const YEARS_MIN = 0;
const YEARS_MAX = 40;
const RETURN_MIN = 0;
const RETURN_MAX = 30;

const FutureWealthPredictor = ({ monthlySavings }: FutureWealthPredictorProps) => {
  const { t } = useLanguage();

  // State Management (Logic Locked)
  const [investment, setInvestment] = useState([0]);
  const [years, setYears] = useState([0]);
  const [returnRate, setReturnRate] = useState([0]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // SIP Formula Logic (Strictly Untouched)
  const projection = useMemo(() => {
    const P = investment[0];
    const annualRate = returnRate[0];
    const yearsValue = years[0];

    const i = annualRate / 100 / 12; 
    const n = yearsValue * 12;      

    let futureValue: number;
    if (i === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }

    const totalInvested = P * n;
    const wealthGained = Math.max(0, futureValue - totalInvested);

    return {
      futureValue: Math.round(futureValue),
      totalInvested: Math.round(totalInvested),
      wealthGained: Math.round(wealthGained),
    };
  }, [investment, years, returnRate]);

  // Formatting Engine (Logic Locked)
  const indianFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const formatShortLakhs = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return indianFormatter.format(num);
  };

  const chartData = [
    { name: t('dashboard.wealthPredictor.yourMoney', 'Principal Invested'), value: projection.totalInvested || 1 },
    { name: t('dashboard.wealthPredictor.freeMoney', 'Wealth Gained'), value: projection.wealthGained || 0 },
  ];

  const handleInvestmentChange = (val: number[]) => {
    setInvestment(val);
    setHasInteracted(true);
  };

  const handleYearsChange = (val: number[]) => {
    setYears(val);
    setHasInteracted(true);
  };

  const handleReturnChange = (val: number[]) => {
    setReturnRate(val);
    setHasInteracted(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="fintech-card overflow-hidden relative">
        <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-investment/10 border border-investment/20 flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp className="h-5 w-5 text-investment" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                  {t('WealthPredictor', 'Future Wealth')}
                </CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {t('dashboard.wealthPredictor.subtitle', 'Power of Compounding')}
                </p>
              </div>
            </div>
            
            <div className="h-8 px-3 bg-surface border border-border rounded-lg flex items-center gap-2 shadow-sm self-start sm:self-auto">
              <span className="flex h-1.5 w-1.5 rounded-full bg-investment animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {years[0]} Year Projection
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-10">
          
          {/* HERO METRIC */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-1 text-center lg:text-left space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {t('dashboard.wealthPredictor.projectedWealthLabel', 'Estimated Future Value')}
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground font-mono tracking-tighter tabular-nums leading-none">
                {formatShortLakhs(projection.futureValue)}
              </h2>
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                <Info size={14} />
                <p className="text-xs font-medium">
                  {t('dashboard.wealthPredictor.projectedWealthValue', { 
                    amount: indianFormatter.format(projection.futureValue),
                    years: years[0]
                  }).replace('{{amount}}', indianFormatter.format(projection.futureValue)).replace('{{years}}', years[0].toString())}
                </p>
              </div>
            </div>

            {/* CHART */}
            <div className="relative h-60 w-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={hasInteracted ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--investment)/0.3)" />
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface/95 backdrop-blur-md border border-border shadow-premium p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{payload[0].name}</p>
                            <p className="text-sm font-bold text-foreground font-mono tabular-nums">{indianFormatter.format(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="h-10 w-10 rounded-full bg-muted/20 border border-border/50 flex items-center justify-center shadow-inner">
                  <PieChartIcon className="h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>
            </div>
          </div>

          {/* SLIDERS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-5 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.wealthPredictor.monthlyInvestment', 'Monthly Save')}</span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono">{formatShortLakhs(investment[0])}</span>
              </div>
              <Slider 
                value={investment} 
                onValueChange={handleInvestmentChange} 
                max={INVESTMENT_MAX} 
                step={1000} 
                min={INVESTMENT_MIN} 
              />
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-5 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.wealthPredictor.duration', 'Duration')}</span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono">{years[0]} Years</span>
              </div>
              <Slider 
                value={years} 
                onValueChange={handleYearsChange} 
                max={YEARS_MAX} 
                step={1} 
                min={YEARS_MIN} 
              />
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-5 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.wealthPredictor.expectedReturn', 'Exp. Returns')}</span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono">{returnRate[0]}%</span>
              </div>
              <Slider 
                value={returnRate} 
                onValueChange={handleReturnChange} 
                max={RETURN_MAX} 
                step={1} 
                min={RETURN_MIN} 
              />
            </div>
          </div>

          {/* BREAKDOWN BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground border border-border shadow-inner">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard.wealthPredictor.yourMoney', 'Your Investment')}</p>
                <p className="text-lg font-bold text-foreground font-mono tracking-tight">{indianFormatter.format(projection.totalInvested)}</p>
              </div>
            </div>

            <div className="bg-surface border border-border/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-investment/5 flex items-center justify-center text-investment border border-investment/20 shadow-inner">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('dashboard.wealthPredictor.freeMoney', 'Wealth Gained')}</p>
                <p className="text-lg font-bold text-investment font-mono tracking-tight">+{indianFormatter.format(projection.wealthGained)}</p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 opacity-60">
              <Zap size={12} className="text-primary fill-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                {t('dashboard.wealthPredictor.footerStart', 'BachatKaro Analysis Engine')}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium italic">
              *Projections based on compounding logic.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* HOW TO USE */}
      <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center border border-border shadow-sm">
            <HelpCircle size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">{t('howToUse.title', 'Quick Guide')}</h4>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('howToUse.subtitle', 'Follow steps to plan your future')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          {[
            { step: '1', text: t('howToUse.step1', 'Set Monthly Save') },
            { step: '2', text: t('howToUse.step2', 'Select Years') },
            { step: '3', text: t('howToUse.step3', 'View Projection') }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface border border-border shadow-sm">
              <span className="text-[10px] font-bold h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {item.step}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FutureWealthPredictor.displayName = 'FutureWealthPredictor';

export default FutureWealthPredictor;
