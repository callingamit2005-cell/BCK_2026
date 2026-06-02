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

  // 1. INPUT SANITIZATION & NORMALIZATION
  const rawTarget = (targetAmount || "").toString().replace(/,/g, '');
  const rawEmi = (emiAmount || "").toString().replace(/,/g, '');

  const targetNum = Number(rawTarget);
  const emiNum = Number(rawEmi);
  const currentNum = Number(currentSavings);

  const safeSavings = Math.max(0, currentNum);
  const progress = targetNum > 0 ? Math.min(100, (safeSavings / targetNum) * 100) : 0;
  
  // 2. STATE DETERMINATION (Time Left logic)
  let monthsToGoalDisplay: string;
  
  if (isNaN(targetNum) || isNaN(emiNum) || isNaN(currentNum) || targetNum <= 0) {
    // CASE 2: Missing Configuration OR CASE 3: Invalid / Corrupt Data
    monthsToGoalDisplay = '--';
  } else {
    const remainingAmount = targetNum - safeSavings;

    if (remainingAmount <= 0) {
      // CASE 1: Goal Achieved
      monthsToGoalDisplay = '🎉';
    } else if (emiNum <= 0) {
      // CASE 4: Configured Goal + Contribution = 0
      monthsToGoalDisplay = '∞';
    } else {
      // CASE 5: Normal Calculation
      const monthsToGoal = Math.ceil(remainingAmount / emiNum);
      monthsToGoalDisplay = `${monthsToGoal} Mo.`;
    }
  }

  // UI CONSTANTS
  const premiumSurface = "bg-surface border border-border shadow-sm rounded-3xl overflow-hidden transform-gpu";
  const inputStyle = "h-14 rounded-2xl bg-background border-border focus:border-border/20 focus:ring-0 text-foreground font-bold transition-all placeholder:text-text-muted";
  const labelStyle = "text-xs font-bold uppercase tracking-wider text-text-muted mb-2 ml-1";

  return (
    <Card className={cn(premiumSurface, "relative")}>
      <CardHeader className="relative z-10 p-6 sm:p-8 pb-4">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-background border border-border">
              <Target className="h-6 w-6 text-text-muted" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground uppercase tracking-tight">
                {t('dreams.title', 'My Dream Goal')}
              </span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {t('dreams.subtitle', 'Savings Roadmap')}
              </span>
            </div>
          </div>
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditing(true)} 
              className="text-text-muted hover:text-foreground hover:bg-background rounded-xl h-11 w-11 transition-all"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 pt-4 space-y-6 relative z-10">
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
              className="w-full h-14 rounded-2xl bg-foreground text-surface font-bold uppercase tracking-wider hover:bg-foreground/90 active:scale-95 transition-all"
            >
              {t('dreams.saveBtn', 'Lock Goal')} 🚀
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            {/* Progress Info */}
            <div className="flex flex-col">
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">
                {t('dreams.tracking', 'Now Tracking')}
              </span>
              <h3 className="text-3xl font-bold text-foreground uppercase tracking-tight leading-none">{goalName}</h3>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('dreams.saved', 'Saved')}</span>
                  <span className="text-xl font-bold text-foreground font-mono tabular-nums">{formatCurrency(safeSavings)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('dreams.target', 'Target')}</span>
                  <span className="text-xl font-bold text-foreground font-mono tabular-nums">{formatCurrency(targetNum)}</span>
                </div>
              </div>
              
              <div className="relative h-4 w-full bg-background rounded-full overflow-hidden border border-border shadow-inner">
                <div 
                  className="h-full bg-foreground transition-all duration-1000" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {progress >= 100 ? t('dreams.achieved', 'Goal Achieved!') : `${progress.toFixed(1)}% ${t('dreams.complete', 'Complete')}`}
                  </span>
                </div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider italic">
                  Compounding...
                </span>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-background rounded-2xl p-5 border border-border hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <CreditCard className="h-4 w-4 text-foreground" />
                    <span className="text-xs uppercase font-bold tracking-wider text-foreground">Monthly</span>
                  </div>
                  <p className="text-xl font-bold text-foreground font-mono tabular-nums">{formatCurrency(emiNum)}</p>
               </div>
               <div className="bg-background rounded-2xl p-5 border border-border hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <Calculator className="h-4 w-4 text-foreground" />
                    <span className="text-xs uppercase font-bold tracking-wider text-foreground">Time Left</span>
                  </div>
                  <p className="text-xl font-bold text-foreground font-mono tabular-nums">
                    {monthsToGoalDisplay}
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
