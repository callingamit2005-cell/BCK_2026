import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, ShieldAlert, Wallet, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { HEALTH_MESSAGES } from '@/features/analytics/data/messages';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancialHealthScoreProps {
  salary: number;
  totalExpenses: number;
}

const FinancialHealthScore = ({ salary, totalExpenses }: FinancialHealthScoreProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { language, t } = useLanguage();

  const currentLang = HEALTH_MESSAGES[language as keyof typeof HEALTH_MESSAGES] ? language : 'hi';

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  const healthData = useMemo(() => {
    const getRandomMessage = (category: keyof typeof HEALTH_MESSAGES['hi']) => {
      const list = HEALTH_MESSAGES[currentLang][category];
      return list[Math.floor(Math.random() * list.length)];
    };

    if (!salary || salary <= 0) {
      return {
        score: 0,
        color: 'text-slate-400',
        bgGradient: 'from-slate-50 to-slate-100',
        strokeColor: '#94a3b8',
        icon: Wallet,
        status: t('healthScore.noDataStatus'),
        message: t('healthScore.noDataMsg'),
        action: t('healthScore.actionIncome'),
      };
    }

    const savings = salary - totalExpenses;
    const savingsRatio = (savings / salary) * 100;

    let calcScore = 0;
    if (savingsRatio < 0) calcScore = 15;
    else if (savingsRatio < 10) calcScore = 35 + (savingsRatio * 1.5);
    else if (savingsRatio < 30) calcScore = 65 + savingsRatio;
    else calcScore = 85 + (Math.min(savingsRatio, 50) / 4);

    const score = Math.min(100, Math.round(calcScore));

    if (score < 45) {
      return {
        score,
        color: 'text-orange-600',
        bgGradient: 'from-orange-50 to-red-50',
        strokeColor: '#ea580c',
        icon: ShieldAlert,
        status: t('healthScore.statusCritical'),
        message: getRandomMessage('CRITICAL'),
        action: t('healthScore.actionCritical'),
      };
    }

    if (score < 75) {
      return {
        score,
        color: 'text-indigo-600',
        bgGradient: 'from-indigo-50 to-blue-50',
        strokeColor: '#4f46e5',
        icon: Activity,
        status: t('healthScore.statusStable'),
        message: getRandomMessage('STABLE'),
        action: t('healthScore.actionStable'),
      };
    }

    return {
      score,
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-green-50',
      strokeColor: '#059669',
      icon: ShieldCheck,
      status: t('healthScore.statusExcellent'),
      message: getRandomMessage('EXCELLENT'),
      action: t('healthScore.actionExcellent'),
    };
  }, [salary, totalExpenses, currentLang, t]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(healthData.message);
    if (currentLang === 'hi') {
      const hindiVoice = voices.find(v => v.lang.includes('hi-IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const englishVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((healthData.score / 100) * circumference);

  return (
    <Card className={`mt-6 border border-white/60 shadow-md bg-gradient-to-br ${healthData.bgGradient} relative overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-md font-bold text-slate-800">
            <Activity className={`h-5 w-5 ${healthData.color}`} />
            {t('healthScore.title')}
          </CardTitle>
          <button
            onClick={handleSpeak}
            disabled={isSpeaking}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 active:scale-95 transition-all ${healthData.color} disabled:opacity-50 disabled:pointer-events-none`}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
            <span className="text-[11px] font-bold uppercase tracking-tight">
              {isSpeaking ? t('healthScore.speaking') : t('healthScore.listenBtn')}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200/50" />
              <circle cx="64" cy="64" r={radius} stroke={healthData.strokeColor} strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl font-black ${healthData.color}`}>{healthData.score}</span>
              <span className="text-[10px] font-bold text-slate-400">{t('healthScore.scoreLabel')}</span>
            </div>
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
              <p className="text-slate-700 text-sm font-medium leading-relaxed italic">"{healthData.message}"</p>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-white shadow-sm ${healthData.color}`}>
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{t('healthScore.smartStep')}</p>
                <p className="text-sm font-bold text-slate-800">{healthData.action}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHealthScore;