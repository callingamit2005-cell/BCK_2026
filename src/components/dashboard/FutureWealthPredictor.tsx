// src/components/dashboard/FutureWealthPredictor.tsx
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Zap, 
  Info,
  PieChart as PieChartIcon,
  HelpCircle
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

// Enterprise Financial Standards
const INVESTMENT_MIN = 0; // Changed to 0 for initial state support
const INVESTMENT_MAX = 200000;
const YEARS_MIN = 0; // Changed to 0
const YEARS_MAX = 40;
const RETURN_MIN = 0; // Changed to 0
const RETURN_MAX = 30;

/**
 * FutureWealthPredictor - Premium FinTech Edition
 * Theme: Deep Dark with Pink & Purple Glow
 */
const FutureWealthPredictor = ({ monthlySavings }: FutureWealthPredictorProps) => {
  const { t } = useLanguage();

  // BUG FIX: Strictly initialize to 0 on load
  const [investment, setInvestment] = useState([0]);
  const [years, setYears] = useState([0]);
  const [returnRate, setReturnRate] = useState([0]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // SIP Formula Logic (Untouched per Strict Rule)
  const projection = useMemo(() => {
    const P = investment[0];
    const annualRate = returnRate[0];
    const yearsValue = years[0];

    const i = annualRate / 100 / 12; // Periodic rate
    const n = yearsValue * 12;      // Total periods

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

  // Premium Indian Currency Formatting
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
    { name: t('dashboard.wealthPredictor.yourMoney', 'Principal Invested'), value: projection.totalInvested || 1, color: '#FFFFFF' }, // Primary (White)
    { name: t('dashboard.wealthPredictor.freeMoney', 'Wealth Gained'), value: projection.wealthGained || 0, color: '#404040' }, // Muted (Dark Gray)
  ];

  // UI/UX Styling Classes (Premium Dark Aesthetic)
  const fontStack = "font-sans antialiased tracking-tight selection:bg-white/10";
  const tabularNumbers = "font-mono font-bold tabular-nums tracking-tighter truncate min-w-0 max-w-full";
  const glassEffect = "bg-white/5 border border-white/5 shadow-sm";
  
  // Fluid Typography
  const headingFluid = "text-[clamp(1.5rem,7vw,3.5rem)] leading-[1.1] font-bold tracking-tighter";
  const labelFluid = "text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted";
  const subValueFluid = "text-sm font-medium text-white/30 truncate";

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
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className={cn(
        "border-border overflow-hidden relative w-full rounded-[24px] shadow-sm transform-gpu",
        "bg-surface text-white",
        fontStack
      )}>
        <CardHeader className="relative z-10 px-6 sm:px-10 pt-10 pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 min-w-0 max-w-full">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-white opacity-40" />
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase truncate">
                  {t('WealthPredictor', 'Future Wealth')}
                </CardTitle>
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.25em]">
                {t('dashboard.wealthPredictor.subtitle', 'Power of Compounding')}
              </p>
            </div>
            
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted whitespace-nowrap">
                {years[0]}Y {t('dashboard.wealthPredictor.projection', 'Projection')}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 px-6 sm:px-10 pb-12 pt-4 space-y-12">
          
          {/* HERO: Primary Visual Anchor */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-4 text-center lg:text-left overflow-hidden min-w-0 max-w-full">
              <p className={labelFluid}>
                {t('dashboard.wealthPredictor.projectedWealthLabel', 'Estimated Future Value')}
              </p>
              <h2 className={cn(tabularNumbers, headingFluid, "text-white")}>
                {formatShortLakhs(projection.futureValue)}
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="h-[1px] w-8 bg-white/10" />
                <p className={subValueFluid}>
                  {t('dashboard.wealthPredictor.projectedWealthValue', { 
                    amount: indianFormatter.format(projection.futureValue),
                    years: years[0]
                  }).replace('{{amount}}', indianFormatter.format(projection.futureValue)).replace('{{years}}', years[0].toString())}
                </p>
              </div>
            </div>

            {/* Visual Data Visualization (Recharts) */}
            <div className="w-full sm:w-[280px] h-[280px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={hasInteracted ? 8 : 0}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: number) => indianFormatter.format(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="p-4 rounded-full bg-white/5 border border-white/5">
                  <PieChartIcon className="h-6 w-6 text-white/10" />
                </div>
              </div>
            </div>
          </div>

          {/* INPUT PANEL: Refined Glass Containers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(glassEffect, "rounded-[20px] p-7 space-y-6 group transition-all hover:bg-white/[0.08]")}>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-white/60 transition-colors">
                  <Coins className="h-4 w-4 text-white/20" /> <span>{t('dashboard.wealthPredictor.monthlyInvestment', 'Monthly Save')}</span>
                </label>
                <span className={cn(tabularNumbers, "text-xl font-bold")}>{formatShortLakhs(investment[0])}</span>
              </div>
              <Slider 
                value={investment} 
                onValueChange={handleInvestmentChange} 
                max={INVESTMENT_MAX} 
                step={1000} 
                min={INVESTMENT_MIN} 
                className="py-4 cursor-pointer"
              />
            </div>

            <div className={cn(glassEffect, "rounded-[20px] p-7 space-y-6 group transition-all hover:bg-white/[0.08]")}>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-white/60 transition-colors">
                  <Calendar className="h-4 w-4 text-white/20" /> <span>{t('dashboard.wealthPredictor.duration', 'Years')}</span>
                </label>
                <span className={cn(tabularNumbers, "text-xl font-bold")}>{years[0]}</span>
              </div>
              <Slider 
                value={years} 
                onValueChange={handleYearsChange} 
                max={YEARS_MAX} 
                step={1} 
                min={YEARS_MIN} 
                className="py-4 cursor-pointer"
              />
            </div>

            <div className={cn(glassEffect, "rounded-[20px] p-7 space-y-6 group transition-all hover:bg-white/[0.08]")}>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-white/60 transition-colors">
                  <TrendingUp className="h-4 w-4 text-white/20" /> <span>{t('dashboard.wealthPredictor.expectedReturn', 'Expected Return %')}</span>
                </label>
                <span className={cn(tabularNumbers, "text-xl font-bold")}>{returnRate[0]}%</span>
              </div>
              <Slider 
                value={returnRate} 
                onValueChange={handleReturnChange} 
                max={RETURN_MAX} 
                step={1} 
                min={RETURN_MIN} 
                className="py-4 cursor-pointer"
              />
            </div>
          </div>

          {/* BREAKDOWN: Hierarchy & Secondary Anchors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={cn(glassEffect, "rounded-[20px] p-8 flex items-center gap-6 group transition-all")}>
              <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-text-muted border border-white/5 group-hover:scale-105 transition-transform">
                <Coins size={24} />
              </div>
              <div>
                <p className={labelFluid}>{t('dashboard.wealthPredictor.yourMoney', 'Your Investment')}</p>
                <p className={cn(tabularNumbers, "text-2xl mt-0.5 tracking-tighter")}>{indianFormatter.format(projection.totalInvested)}</p>
              </div>
            </div>

            <div className={cn(glassEffect, "rounded-[20px] p-8 flex items-center gap-6 group transition-all")}>
              <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-text-muted border border-white/5 group-hover:scale-105 transition-transform">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className={labelFluid}>{t('dashboard.wealthPredictor.freeMoney', 'Wealth Gained')}</p>
                <p className={cn(tabularNumbers, "text-2xl mt-0.5 text-white/60 tracking-tighter")}>+{indianFormatter.format(projection.wealthGained)}</p>
              </div>
            </div>
          </div>

          {/* FOOTER: Professional Branding */}
          <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 opacity-30">
              <Zap size={10} className="fill-white text-white" />
              <p className="text-[8px] font-bold uppercase tracking-[0.3em]">
                {t('dashboard.wealthPredictor.footerStart', 'BachatKaro Analysis Engine')}
              </p>
            </div>
            <p className="text-[8px] text-white/10 font-bold uppercase tracking-widest italic">
              *Projections based on historical averages.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* HOW TO USE SECTION: Premium Helper Card */}
      <div className={cn(
        "p-6 rounded-[24px] bg-surface border border-border",
        "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
      )}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
            <HelpCircle size={20} className="text-white/20" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">{t('howToUse.title', 'How to Use Wealth Predictor')}</h4>
            <p className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-widest">{t('howToUse.subtitle', 'Follow these simple steps to plan your financial future')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          {[
            { step: '1', text: t('howToUse.step1', 'Set Monthly Save') },
            { step: '2', text: t('howToUse.step2', 'Select Years') },
            { step: '3', text: t('howToUse.step3', 'View Projection') }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-bold h-5 w-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center border border-white/10">
                {item.step}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FutureWealthPredictor;
