import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, ShieldAlert, Wallet, Lightbulb, Volume2, VolumeX, Zap } from 'lucide-react';
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
      return { score: 0, color: 'text-slate-400', strokeColor: '#475569', icon: Wallet, message: 'Set income to unlock health score.', action: 'Go to Planning tab.' };
    }

    // Use AI score if available, else calculate
    const score = advice?.healthScore ?? (() => {
      const savings = salary - totalExpenses;
      const savingsRatio = (savings / salary) * 100;
      let calcScore = savingsRatio < 0 ? 15 : savingsRatio < 10 ? 35 + (savingsRatio * 1.5) : savingsRatio < 30 ? 65 + savingsRatio : 85 + (Math.min(savingsRatio, 50) / 4);
      return Math.min(100, Math.round(calcScore));
    })();

    const message = advice?.healthReason || "Maintain balance in your spending.";

    if (score < 45) return { score, color: 'text-white', strokeColor: '#FFFFFF', icon: ShieldAlert, message, action: 'Reduce expenditure immediately.' };
    if (score < 75) return { score, color: 'text-text-secondary', strokeColor: '#B3B3B3', icon: Activity, message, action: 'Optimize savings strategy.' };
    return { score, color: 'text-white', strokeColor: '#FFFFFF', icon: ShieldCheck, message, action: 'Explore investment growth.' };
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

  const premiumGlass = "bg-surface border border-white/5 rounded-[32px] overflow-hidden transform-gpu";
  const monochromeBtn = "bg-white text-background shadow-sm border-none hover:bg-white/90 transition-all duration-300";

  return (
    <Card className={cn(premiumGlass, "mt-8")}>
      <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold uppercase tracking-tight text-white">
            <div className={cn("p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner", healthData.color)}>
              <Activity className="h-5 w-5" />
            </div>
            {t('healthScore.title', 'Financial Pulse')}
          </CardTitle>

          <button
            onClick={handleSpeak}
            disabled={isSpeaking}
            className={cn(
              "flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-[18px] transition-all duration-300 active:scale-95 disabled:opacity-50",
              isSpeaking ? "bg-white/10 text-white border border-white/20" : monochromeBtn
            )}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4 text-background" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isSpeaking ? t('healthScore.speaking', 'Listening...') : t('healthScore.listenBtn', 'Read Aloud')}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-10">

          <div className="relative h-44 w-44 flex items-center justify-center shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="88" cy="88" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
              <circle
                cx="88" cy="88" r={radius}
                stroke={healthData.strokeColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={cn("text-6xl font-bold tracking-tighter", healthData.color)}>
                {healthData.score}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1 text-text-muted">
                {t('healthScore.scoreLabel', 'Health')}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 relative overflow-hidden group shadow-inner">
              <p className="text-[15px] font-medium text-white/90 relative z-10 leading-relaxed">
                "{healthData.message}"
              </p>
              
              {advice?.confidence && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border",
                    "text-white/60 border-white/20 bg-white/5"
                  )}>
                    Data Confidence: {advice.confidence}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white/5 p-5 rounded-[24px] border border-white/10 flex items-start gap-4">
              <div className={cn("p-2.5 rounded-xl bg-white/5 shadow-sm border border-white/10", healthData.color)}>
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                  {t('healthScore.smartStep', 'AI Recommendation')}
                </p>
                <p className="text-sm font-bold text-white uppercase tracking-tight">{healthData.action}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default FinancialHealthScore;
