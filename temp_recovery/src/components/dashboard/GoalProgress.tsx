import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Trophy, Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface GoalProgressProps {
  currentSavings: number;
}

// ----------------------------------------------------------------------
// Constants & Helpers
// ----------------------------------------------------------------------
const STORAGE_KEYS = {
  GOAL_NAME: 'user_goal_name',
  GOAL_AMOUNT: 'user_goal_amount',
} as const;

// ----------------------------------------------------------------------
// Debug logger (easily removable)
// ----------------------------------------------------------------------
const DEBUG = process.env.NODE_ENV === 'development';
const log = {
  info: (message: string, data?: any) => {
    if (DEBUG) console.log(`[GoalProgress] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    if (DEBUG) console.error(`[GoalProgress] ${message}`, error || '');
  },
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
const GoalProgress = ({ currentSavings }: GoalProgressProps) => {
  const { t } = useLanguage();

  // Initialize state from localStorage (with error handling)
  const [goalName, setGoalName] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.GOAL_NAME) || '';
    } catch (e) {
      log.error('Failed to read goal name from localStorage', e);
      return '';
    }
  });

  const [targetAmount, setTargetAmount] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.GOAL_AMOUNT) || '';
    } catch (e) {
      log.error('Failed to read target amount from localStorage', e);
      return '';
    }
  });

  const [isEditing, setIsEditing] = useState(!goalName);

  // --------------------------------------------------------------------
  // Memoized derived values
  // --------------------------------------------------------------------
  const safeSavings = useMemo(() => Math.max(0, currentSavings), [currentSavings]);
  const target = useMemo(() => {
    const num = Number(targetAmount);
    return !isNaN(num) && num > 0 ? num : 1; // fallback to 1 to avoid division by zero
  }, [targetAmount]);

  const progress = useMemo(() => {
    return Math.min(100, (safeSavings / target) * 100);
  }, [safeSavings, target]);

  const monthsToGoal = useMemo(() => {
    if (safeSavings <= 0) return '∞';
    return Math.ceil((target - safeSavings) / safeSavings);
  }, [safeSavings, target]);

  // --------------------------------------------------------------------
  // Handlers (with validation & error handling)
  // --------------------------------------------------------------------
  const handleGoalNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGoalName(e.target.value);
  }, []);

  const handleTargetAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setTargetAmount(value);
  }, []);

  const saveGoal = useCallback(() => {
    // Validate: target must be a positive number
    const targetNum = Number(targetAmount);
    if (!goalName.trim()) {
      alert(t('goalProgress.enterGoalName'));
      return;
    }
    if (!targetAmount || isNaN(targetNum) || targetNum <= 0) {
      alert(t('goalProgress.enterValidAmount'));
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.GOAL_NAME, goalName.trim());
      localStorage.setItem(STORAGE_KEYS.GOAL_AMOUNT, targetAmount);
      log.info('Goal saved', { goalName: goalName.trim(), targetAmount });
      setIsEditing(false);
    } catch (e) {
      log.error('Failed to save goal to localStorage', e);
      alert(t('goalProgress.saveFailed'));
    }
  }, [goalName, targetAmount, t]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
      {/* Background trophy decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Trophy className="h-24 w-24" />
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Target className="h-6 w-6 text-yellow-300" />
          {t('goalProgress.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur-md">
            <label htmlFor="goal-name" className="sr-only">
              {t('goalProgress.goalNameLabel')}
            </label>
            <Input
              id="goal-name"
              placeholder={t('goalProgress.goalNamePlaceholder')}
              value={goalName}
              onChange={handleGoalNameChange}
              className="bg-white/90 text-black placeholder:text-gray-400"
            />
            <label htmlFor="goal-amount" className="sr-only">
              {t('goalProgress.targetAmountLabel')}
            </label>
            <Input
              id="goal-amount"
              type="text"
              placeholder={t('goalProgress.targetAmountPlaceholder')}
              value={targetAmount}
              onChange={handleTargetAmountChange}
              className="bg-white/90 text-black placeholder:text-gray-400"
            />
            <Button
              onClick={saveGoal}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              {t('goalProgress.setGoalButton')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-cyan-100 text-xs font-bold uppercase tracking-widest">
                  {t('goalProgress.targetGoal')}
                </p>
                <h3 className="text-3xl font-black text-white">{goalName}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                className="text-cyan-100 hover:text-white hover:bg-white/20 h-8 text-xs"
              >
                {t('common.edit')} ✏️
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{t('goalProgress.saved', { amount: safeSavings.toLocaleString() })}</span>
                <span>{t('goalProgress.target', { amount: target.toLocaleString() })}</span>
              </div>
              <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-right text-xs font-bold text-yellow-300">
                {t('goalProgress.percentComplete', { percent: progress.toFixed(1) })}
              </p>
            </div>

            {/* Prediction */}
            {progress < 100 && (
              <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3 border border-white/10">
                <Calculator className="h-5 w-5 text-cyan-200" />
                <p className="text-sm">
                  {monthsToGoal === '∞'
                    ? t('goalProgress.predictionNever')
                    : t('goalProgress.prediction', { months: monthsToGoal })}
                </p>
              </div>
            )}

            {progress >= 100 && (
              <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30 text-center animate-pulse">
                <p className="font-bold text-lg text-green-300">
                  {t('goalProgress.goalAchieved')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalProgress;