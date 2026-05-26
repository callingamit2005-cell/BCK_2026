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
  const premiumSurface = "bg-surface border border-white/5 shadow-sm rounded-[32px] overflow-hidden transform-gpu";
  const inputStyle = "h-14 rounded-2xl bg-white/5 border-white/10 focus:border-white/20 focus:ring-0 text-white font-bold transition-all placeholder:text-white/20";
  const labelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-2 ml-1";

  return (
    <Card className={cn(premiumSurface, "relative")}>
      <CardHeader className="relative z-10 p-8 pb-4">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <Target className="h-6 w-6 text-white/40" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white uppercase tracking-tight">
                {t('dreams.title', 'My Dream Goal')}
              </span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
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
              className="w-full h-14 rounded-2xl bg-white text-background font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all"
            >
              {t('dreams.saveBtn', 'Lock Goal')} 🚀
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            {/* Progress Info */}
            <div className="flex flex-col">
              <span className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
                {t('dreams.tracking', 'Now Tracking')}
              </span>
              <h3 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">{goalName}</h3>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('dreams.saved', 'Saved')}</span>
                  <span className="text-xl font-bold text-white font-mono">{formatCurrency(safeSavings)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('dreams.target', 'Target')}</span>
                  <span className="text-xl font-bold text-white font-mono">{formatCurrency(Number(targetAmount))}</span>
                </div>
              </div>
              
              <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-white transition-all duration-1000" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {progress >= 100 ? t('dreams.achieved', 'Goal Achieved!') : `${progress.toFixed(1)}% ${t('dreams.complete', 'Complete')}`}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">
                  Compounding...
                </span>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <CreditCard className="h-4 w-4 text-white" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white">Monthly</span>
                  </div>
                  <p className="text-xl font-bold text-white font-mono">{formatCurrency(Number(emiAmount))}</p>
               </div>
               <div className="bg-white/5 rounded-[24px] p-5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <Calculator className="h-4 w-4 text-white" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white">Time Left</span>
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
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