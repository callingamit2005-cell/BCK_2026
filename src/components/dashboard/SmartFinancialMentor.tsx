import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, BrainCircuit, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SmartFinancialMentorProps {
  advice: {
    action: string;
    reason: string;
    steps: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  } | null;
}

const SmartFinancialMentor = ({ advice }: SmartFinancialMentorProps) => {
  const { t } = useLanguage();

  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[32px] overflow-hidden transform-gpu transition-all hover:border-[#ff0f7b]/30";

  return (
    <Card className={cn(neonGlass)}>
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-4 text-xl font-black text-white tracking-tighter uppercase italic">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <Sparkles className="h-5 w-5 text-pink-500" />
            </div>
            {t('mentor.title', 'Financial Advisor')}
            <span className="ml-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] bg-pink-600 text-white px-3 py-1 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.5)] animate-pulse">
              ACTION
            </span>
          </CardTitle>
          <BrainCircuit className="h-5 w-5 text-white/20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        <div className="text-center">
          <p className="text-[#ff0f7b] font-black text-2xl italic leading-tight mb-2">
            "{advice?.action || 'Thinking...'}"
          </p>
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
            {advice?.reason}
          </p>
          
          <div className="flex justify-center mt-4">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5",
              advice?.confidence === 'HIGH' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
              advice?.confidence === 'MEDIUM' ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
              "text-rose-400 border-rose-400/30 bg-rose-400/10"
            )}>
              {advice?.confidence === 'LOW' && "Limited data, advice may improve over time"}
              {advice?.confidence !== 'LOW' && `Confidence: ${advice?.confidence || 'LOW'}`}
              {advice?.confidence === 'HIGH' ? '🔥' : ''}
            </span>
          </div>
        </div>

        {advice?.steps && (
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 flex items-start gap-5">
            <div className="h-10 w-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-pink-500 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5">{t('mentor.steps', 'Next Steps')}</p>
              <p className="text-xs font-bold text-white/80 leading-relaxed whitespace-pre-line">
                {advice.steps}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartFinancialMentor;
