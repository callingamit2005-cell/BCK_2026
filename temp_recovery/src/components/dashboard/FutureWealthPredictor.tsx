import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Coins, Calendar, ArrowRight, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FutureWealthPredictorProps {
  monthlySavings: number;
}

// Constants for slider bounds
const INVESTMENT_MIN = 500;
const INVESTMENT_MAX = 100000;
const YEARS_MIN = 1;
const YEARS_MAX = 40;
const RETURN_MIN = 4;
const RETURN_MAX = 30;

const FutureWealthPredictor = ({ monthlySavings }: FutureWealthPredictorProps) => {
  const { t } = useLanguage();

  const getValidInvestment = (value: number) => 
    Math.min(INVESTMENT_MAX, Math.max(INVESTMENT_MIN, value));

  const [investment, setInvestment] = useState([getValidInvestment(monthlySavings)]);
  const [years, setYears] = useState([10]);
  const [returnRate, setReturnRate] = useState([12]);

  useEffect(() => {
    if (monthlySavings > 0) {
      setInvestment([getValidInvestment(monthlySavings)]);
    }
  }, [monthlySavings]);

  const projection = useMemo(() => {
    const P = investment[0];
    const annualRate = returnRate[0];
    const yearsValue = years[0];

    if (P <= 0 || yearsValue <= 0 || annualRate <= 0) {
      return { futureValue: 0, totalInvested: 0, wealthGained: 0 };
    }

    const r = annualRate / 100 / 12;
    const n = yearsValue * 12;

    let futureValue: number;
    if (r === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    }

    const totalInvested = P * n;
    const wealthGained = futureValue - totalInvested;

    return {
      futureValue: Math.round(futureValue),
      totalInvested: Math.round(totalInvested),
      wealthGained: Math.round(wealthGained),
    };
  }, [investment, years, returnRate]);

  const formatLakhs = (value: number) => {
    if (!Number.isFinite(value)) return '0.0';
    return (value / 100000).toFixed(1);
  };

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    return value.toLocaleString('en-IN');
  };

  return (
    <Card className="mt-8 border-none shadow-2xl overflow-hidden relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white">
      {/* Visual Decorators */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Coins className="h-64 w-64 text-white" />
      </div>
      <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              {t('wealthPredictor.title')}
            </CardTitle>
            <p className="text-indigo-200 text-xs mt-1">{t('wealthPredictor.subtitle')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-300">
              {years[0]} {t('wealthPredictor.years')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-8">
        
        {/* BIG NUMBER DISPLAY - Sharp & Non-Cutting */}
        <div className="text-center py-4 px-1">
          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">
            {t('wealthPredictor.projectedWealthLabel')}
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-sm tracking-tighter whitespace-nowrap overflow-hidden">
            {t('wealthPredictor.projectedWealthValue', {
              value: (projection.futureValue / 100000).toFixed(2)
            })}
          </h2>
          <p className="text-[11px] sm:text-sm text-indigo-200 mt-1 font-medium opacity-80">
            {t('wealthPredictor.totalAmount', { amount: formatCurrency(projection.futureValue) })}
          </p>
        </div>

        {/* SLIDERS CONTROL */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-indigo-200 uppercase flex items-center gap-2">
                <Coins className="h-3 w-3" /> {t('wealthPredictor.monthlyInvestment')}
              </label>
              <span className="text-base font-bold text-white">₹{formatCurrency(investment[0])}</span>
            </div>
            <Slider 
              value={investment} 
              onValueChange={setInvestment} 
              max={INVESTMENT_MAX} 
              step={500} 
              min={INVESTMENT_MIN} 
              className="cursor-pointer" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-indigo-200 uppercase flex items-center gap-2">
                <Calendar className="h-3 w-3" /> {t('wealthPredictor.duration')}
              </label>
              <span className="text-base font-bold text-white">{years[0]} {t('wealthPredictor.years')}</span>
            </div>
            <Slider 
              value={years} 
              onValueChange={setYears} 
              max={YEARS_MAX} 
              step={1} 
              min={YEARS_MIN} 
              className="cursor-pointer" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-indigo-200 uppercase flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> {t('wealthPredictor.expectedReturn')}
              </label>
              <span className="text-base font-bold text-green-400">{returnRate[0]}%</span>
            </div>
            <Slider 
              value={returnRate} 
              onValueChange={setReturnRate} 
              max={RETURN_MAX} 
              step={1} 
              min={RETURN_MIN} 
              className="cursor-pointer" 
            />
          </div>
        </div>

        {/* BREAKDOWN STATS - One Line Ready */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">{t('wealthPredictor.yourMoney')}</p>
            <p className="text-lg font-bold text-white truncate">
              {t('wealthPredictor.lakhs', { value: formatLakhs(projection.totalInvested) })}
            </p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
            <p className="text-[9px] text-green-300 font-bold uppercase mb-1">{t('wealthPredictor.freeMoney')}</p>
            <p className="text-lg font-bold text-green-400 truncate">
              + {t('wealthPredictor.lakhs', { value: formatLakhs(projection.wealthGained) })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-indigo-300/60 pb-2">
           <span>{t('wealthPredictor.footerStart')}</span>
           <ArrowRight className="h-3 w-3" />
           <span>{t('wealthPredictor.footerEnd')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default FutureWealthPredictor;