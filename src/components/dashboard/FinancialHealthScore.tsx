import { useMemo, useState, useEffect } from 'react';
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

const FinancialHealthScore = ({ salary, totalExpenses, advice }: FinancialHealthScoreProps) => {
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

    if (score < 45) return { score, color: 'text-rose-500', strokeColor: '#f43f5e', icon: ShieldAlert, message, action: 'Stop spending.' };
    if (score < 75) return { score, color: 'text-purple-400', strokeColor: '#a855f7', icon: Activity, message, action: 'Save 20% more.' };
    return { score, color: 'text-pink-400', strokeColor: '#ec4899', icon: ShieldCheck, message, action: 'Start investing.' };
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

  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-[#ff0f7b]/30 shadow-[0_20px_50px_-12px_rgba(255,15,123,0.3)] rounded-[32px] overflow-hidden transform-gpu";
  const gradientBtn = "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all duration-300";

  return (
    <Card className={cn(neonGlass, "mt-8")}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-pink-500" />

      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-white italic">
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
              isSpeaking ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : gradientBtn
            )}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4 text-white" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
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
                style={{ filter: `drop-shadow(0 0 8px ${healthData.strokeColor}88)` }}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={cn("text-6xl font-black tracking-tighter drop-shadow-lg", healthData.color)}>
                {healthData.score}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-1 text-white/30">
                {t('healthScore.scoreLabel', 'Health')}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 relative overflow-hidden group shadow-inner">
              <div className="absolute -left-4 -top-4 text-white/5">
                <Lightbulb className="h-24 w-24 transform -rotate-12" />
              </div>
              <p className="text-[15px] font-bold text-white/90 italic relative z-10 leading-relaxed">
                "{healthData.message}"
              </p>
              
              {advice?.confidence && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border",
                    advice.confidence === 'HIGH' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                    advice.confidence === 'MEDIUM' ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                    "text-rose-400 border-rose-400/30 bg-rose-400/10"
                  )}>
                    Data Confidence: {advice.confidence}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-purple-500/10 p-5 rounded-[24px] border border-purple-500/20 flex items-start gap-4">
              <div className={cn("p-2.5 rounded-xl bg-white/5 shadow-sm border border-white/10", healthData.color)}>
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                  {t('healthScore.smartStep', 'AI Recommendation')}
                </p>
                <p className="text-sm font-black text-white uppercase tracking-tight italic">{healthData.action}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHealthScore;
