import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Trophy, Calculator, CreditCard, Sparkles, Pencil } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';

interface GoalProgressProps {
  currentSavings: number;
}

const GoalProgress = ({ currentSavings }: GoalProgressProps) => {
  const { t } = useLanguage();
  
  // States with LocalStorage recovery
  const [goalName, setGoalName] = useState(() => localStorage.getItem('user_goal_name') || '');
  const [targetAmount, setTargetAmount] = useState(() => localStorage.getItem('user_goal_amount') || '');
  const [emiAmount, setEmiAmount] = useState(() => localStorage.getItem('user_emi_amount') || '');
  const [isEditing, setIsEditing] = useState(!goalName);

  const saveGoal = () => {
    localStorage.setItem('user_goal_name', goalName);
    localStorage.setItem('user_goal_amount', targetAmount);
    localStorage.setItem('user_emi_amount', emiAmount);
    setIsEditing(false);
  };

  const target = Number(targetAmount) || 1;
  const safeSavings = Math.max(0, currentSavings);
  const progress = Math.min(100, (safeSavings / target) * 100);
  
  // 🛠️ LOGIC FIX: Prevent negative remaining amount if goal is already met
  const monthlyContribution = Number(emiAmount) || 0;
  const remainingAmount = Math.max(0, target - safeSavings); 

  let monthsToGoal: string | number;
  if (remainingAmount === 0) {
    monthsToGoal = 0; // Goal is fully achieved
  } else if (monthlyContribution > 0) {
    monthsToGoal = Math.ceil(remainingAmount / monthlyContribution);
  } else {
    monthsToGoal = '∞'; // No EMI set
  }

  // UI CONSTANTS
  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-purple-500/30 shadow-[0_20px_50px_-12px_rgba(168,85,247,0.25)] rounded-[32px] overflow-hidden transform-gpu";
  const inputStyle = "h-14 rounded-2xl bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-white font-bold transition-all placeholder:text-white/20";
  const labelStyle = "text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1";

  return (
    <Card className={cn(neonGlass, "relative")}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-pink-500" />
      
      <div className="absolute -top-24 -right-24 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <Trophy className="h-64 w-64 text-purple-500" />
      </div>

      <CardHeader className="relative z-10 p-8 pb-4">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white uppercase italic tracking-tighter">
                {t('dreams.title', 'My Dream Goal')} 🎯
              </span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                {t('dreams.subtitle', 'Savings Roadmap')}
              </span>
            </div>
          </div>
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditing(true)} 
              className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl h-11 w-11 transition-all"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 pt-4 space-y-6 relative z-10">
        {isEditing ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 gap-5">
              <div className="flex flex-col">
                <label className={labelStyle}>{t('dreams.goalName', 'What is your dream?')}</label>
                <Input 
                  placeholder={t('dreams.goalPlaceholder', 'e.g. iPhone 16 Pro')} 
                  value={goalName} 
                  onChange={(e) => setGoalName(e.target.value)}
                  className={inputStyle}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className={labelStyle}>{t('dreams.targetAmount', 'Target Amount (₹)')}</label>
                  <Input 
                    type="number" 
                    placeholder="50,000" 
                    value={targetAmount} 
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="flex flex-col">
                  <label className={labelStyle}>{t('dreams.monthlyContribution', 'Monthly Save (₹)')}</label>
                  <Input 
                    type="number" 
                    placeholder="2,500" 
                    value={emiAmount} 
                    onChange={(e) => setEmiAmount(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={saveGoal} 
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all"
            >
              {t('dreams.saveBtn', 'Lock Goal')} 🚀
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            {/* Progress Info */}
            <div className="flex flex-col">
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                {t('dreams.tracking', 'Now Tracking')}
              </span>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{goalName}</h3>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('dreams.saved', 'Saved')}</span>
                  <span className="text-xl font-black text-white font-mono">{formatCurrency(safeSavings)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('dreams.target', 'Target')}</span>
                  <span className="text-xl font-black text-purple-400 font-mono">{formatCurrency(Number(targetAmount))}</span>
                </div>
              </div>
              
              <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-pink-400 animate-pulse" />
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
                    {progress >= 100 ? t('dreams.achieved', 'Goal Achieved!') : `${progress.toFixed(1)}% ${t('dreams.complete', 'Complete')}`}
                  </span>
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                  Compounding...
                </span>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <CreditCard className="h-4 w-4 text-purple-400" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-white">Monthly</span>
                  </div>
                  <p className="text-xl font-black text-white font-mono">{formatCurrency(Number(emiAmount))}</p>
               </div>
               <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <Calculator className="h-4 w-4 text-purple-400" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-white">Time Left</span>
                  </div>
                  <p className="text-xl font-black text-white font-mono">
                    {monthsToGoal === 0 ? '🎉' : `${monthsToGoal} Mo.`}
                  </p>
               </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalProgress;