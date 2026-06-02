import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, BrainCircuit, Zap, ShieldCheck } from 'lucide-react';
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

const SmartFinancialMentor = React.memo(({ advice }: SmartFinancialMentorProps) => {
  const { t } = useLanguage();

  return (
    <Card className="fintech-card w-full overflow-hidden">
      <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                {t('mentor.title', 'Smart Mentor')}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('mentor.active', 'AI Engine Active')}
                </span>
              </div>
            </div>
          </div>
          <BrainCircuit className="h-5 w-5 text-muted-foreground opacity-30" />
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="text-left sm:text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {advice?.action ? `"${advice.action}"` : 'Analyzing patterns...'}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-xl sm:mx-auto">
            {advice?.reason || 'Comparing your recent habits to provide personalized insights.'}
          </p>
          
          <div className="flex justify-start sm:justify-center pt-2">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
              advice?.confidence === 'HIGH' ? "bg-primary/5 text-primary border-primary/20 shadow-sm" :
              advice?.confidence === 'MEDIUM' ? "bg-warning/5 text-warning border-warning/20" :
              "bg-muted text-muted-foreground border-border"
            )}>
              <ShieldCheck className="h-3 w-3" />
              {advice?.confidence === 'LOW' ? "Limited Data" : `Integrity: ${advice?.confidence || 'Analyzing'}`}
            </div>
          </div>
        </div>

        {advice?.steps && (
          <div className="bg-muted/30 p-6 rounded-2xl border border-border/60 flex items-start gap-5 transition-all duration-300 hover:border-primary/20 group">
            <div className="h-10 w-10 rounded-full bg-surface border border-border/60 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <Zap size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
                {t('mentor.strategic_steps', 'Strategic Roadmap')}
              </p>
              <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed whitespace-pre-line">
                {advice.steps}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SmartFinancialMentor.displayName = 'SmartFinancialMentor';

export default SmartFinancialMentor;
