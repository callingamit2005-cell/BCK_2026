import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, ShieldAlert, Wallet, Volume2, VolumeX, Zap, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FinancialHealthScoreProps {
  salary: number;
  totalExpenses: number;
  advice: {
    healthScore: number;
    healthReason: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  } | null;
}

const FinancialHealthScore = React.memo(({ salary, totalExpenses, advice }: FinancialHealthScoreProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => { return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }; }, []);

  const healthData = useMemo(() => {
    if (!salary || salary <= 0) {
      return { 
        score: 0, 
        colorClass: 'text-muted-foreground', 
        strokeColor: 'hsl(var(--muted))', 
        icon: Wallet, 
        message: 'Set income to unlock health score.', 
        action: 'Go to Planning tab.' 
      };
    }

    // Use AI score if available, else calculate
    const score = advice?.healthScore ?? (() => {
      const savings = salary - totalExpenses;
      const savingsRatio = (savings / salary) * 100;
      let calcScore = savingsRatio < 0 ? 15 : savingsRatio < 10 ? 35 + (savingsRatio * 1.5) : savingsRatio < 30 ? 65 + savingsRatio : 85 + (Math.min(savingsRatio, 50) / 4);
      return Math.min(100, Math.round(calcScore));
    })();

    const message = advice?.healthReason || "Maintain balance in your spending.";

    if (score < 45) return { 
      score, 
      colorClass: 'text-expense', 
      strokeColor: 'hsl(var(--expense))', 
      icon: ShieldAlert, 
      message, 
      action: 'Reduce expenditure immediately.' 
    };
    if (score < 75) return { 
      score, 
      colorClass: 'text-warning', 
      strokeColor: 'hsl(var(--warning))', 
      icon: Activity, 
      message, 
      action: 'Optimize savings strategy.' 
    };
    return { 
      score, 
      colorClass: 'text-income', 
      strokeColor: 'hsl(var(--income))', 
      icon: ShieldCheck, 
      message, 
      action: 'Explore investment growth.' 
    };
  }, [salary, totalExpenses, advice]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(healthData.message);
    const voice = language === 'hi' ? voices.find(v => v.lang.includes('hi-IN')) : voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
    if (voice) utterance.voice = voice;
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((healthData.score / 100) * circumference);

  return (
    <Card className="fintech-card mt-8 sm:mt-12 overflow-hidden">
      <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border border-border/50 transition-all duration-500",
              healthData.colorClass,
              "bg-surface"
            )}>
              <healthData.icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                {t('healthScore.title', 'Financial Pulse')}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {advice?.confidence ? `Integrity: ${advice.confidence}` : 'Live Analysis'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSpeak}
            disabled={isSpeaking}
            className={cn(
              "btn-premium h-11 px-5 gap-2",
              isSpeaking 
                ? "bg-background text-foreground border border-border" 
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-premium"
            )}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
              {isSpeaking ? t('healthScore.speaking', 'Active') : t('healthScore.listenBtn', 'Read')}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

          {/* CIRCULAR PROGRESS */}
          <div className="relative h-44 w-44 flex items-center justify-center shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle 
                cx="50%" cy="50%" r={radius} 
                stroke="hsl(var(--muted)/0.3)" 
                strokeWidth="12" 
                fill="transparent" 
              />
              <circle
                cx="50%" cy="50%" r={radius}
                stroke={healthData.strokeColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={cn("text-5xl font-bold font-mono tabular-nums tracking-tighter leading-none", healthData.colorClass)}>
                {healthData.score}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-muted-foreground">
                {t('healthScore.scoreLabel', 'Score')}
              </span>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 space-y-6 w-full">
            <div className="bg-surface p-6 rounded-2xl border border-border/60 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-muted-foreground/20">
                <Info size={48} />
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground relative z-10 leading-relaxed italic">
                "{healthData.message}"
              </p>
            </div>

            <div className="bg-muted/30 p-5 rounded-2xl border border-border/40 flex items-start gap-5 transition-all duration-300 hover:border-primary/30 group">
              <div className="h-10 w-10 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <Zap size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1">
                  {t('healthScore.smartStep', 'Recommended Action')}
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">{healthData.action}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FinancialHealthScore.displayName = 'FinancialHealthScore';

export default FinancialHealthScore;
