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

    if (score < 45) return { score, color: 'text-[#DC2626]', strokeColor: '#DC2626', icon: ShieldAlert, message, action: 'Reduce expenditure immediately.' };
    if (score < 75) return { score, color: 'text-fintech-amber-dark', strokeColor: '#f59e0b', icon: Activity, message, action: 'Optimize savings strategy.' };
    return { score, color: 'text-fintech-emerald-dark', strokeColor: '#10b981', icon: ShieldCheck, message, action: 'Explore investment growth.' };
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

  const premiumGlass = "bg-surface border border-border/40 rounded-[32px] overflow-hidden transform-gpu transition-all duration-700 ease-butter-soft shadow-[0_8px_30px_rgb(0,0,0,0.02)]";
  const monochromeBtn = "bg-[#1a1a1a] text-white shadow-xl border-none hover:bg-[#111111] transition-all duration-500";

  return (
    <Card className={cn(premiumGlass, "mt-8 sm:mt-12 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft")}>
      <CardHeader className="p-6 sm:p-10 pb-5 sm:pb-8 border-b border-border/40 bg-background/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <CardTitle className="flex items-center gap-5 sm:gap-6 text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#1a1a1a]">
            {/* Circular Premium Icon Container - Pulse Style */}
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[#DC2626] animate-[pulse_3s_ease-in-out_infinite]" />
            </div>
            {t('healthScore.title', 'Financial Pulse')}
          </CardTitle>

          <button
            onClick={handleSpeak}
            disabled={isSpeaking}
            className={cn(
              "flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-500 active:scale-[0.97] disabled:opacity-50 shadow-sm h-12 sm:h-14",
              isSpeaking ? "bg-background text-[#1a1a1a] border border-border/60" : monochromeBtn
            )}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
              {isSpeaking ? t('healthScore.speaking', 'Active') : t('healthScore.listenBtn', 'Read')}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-8 sm:p-14">
        <div className="flex flex-col md:flex-row items-center gap-10 sm:gap-16">

          <div className="relative h-44 w-44 sm:h-56 sm:w-56 flex items-center justify-center shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="50%" cy="50%" r={radius} stroke="rgba(0,0,0,0.04)" strokeWidth="12" fill="transparent" className="sm:r-[78] sm:stroke-width-[16]" />
              <circle
                cx="50%" cy="50%" r={radius}
                stroke={healthData.strokeColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out sm:r-[78] sm:stroke-width-[16]"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={cn("text-5xl sm:text-7xl font-black tracking-tighter text-[#1a1a1a] leading-none")}>
                {healthData.score}
              </span>
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] mt-2 sm:mt-3 text-fintech-graphite-muted opacity-60">
                {t('healthScore.scoreLabel', 'Score')}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-8 sm:space-y-10 w-full">
            <div className="bg-background/40 p-7 sm:p-10 rounded-[28px] sm:rounded-[32px] border border-border/40 relative overflow-hidden group shadow-inner">
              <p className="text-[14px] sm:text-[16px] font-bold text-[#1a1a1a] relative z-10 leading-relaxed italic opacity-90">
                "{healthData.message}"
              </p>
              
              {advice?.confidence && (
                <div className="mt-6 sm:mt-8 flex items-center gap-3">
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border shadow-sm transition-all duration-700 bg-white",
                    "text-fintech-graphite-muted border-border/40"
                  )}>
                    Integrity: {advice.confidence}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-surface p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] border border-border/40 flex items-start gap-6 sm:gap-8 shadow-sm transition-all duration-700 hover:shadow-md hover:border-border/60 group/item min-w-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover/item:scale-110">
                <Zap size={20} className="text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] mb-1.5 sm:mb-2 opacity-60 truncate">
                  {t('healthScore.smartStep', 'Forensic Logic Action')}
                </p>
                <p className="text-[14px] sm:text-[16px] font-black text-[#1a1a1a] uppercase tracking-tight leading-snug">{healthData.action}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default FinancialHealthScore;
