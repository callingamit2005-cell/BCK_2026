import React from 'react';
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

const SmartFinancialMentor = React.memo(({ advice }: SmartFinancialMentorProps) => {
  const { t } = useLanguage();

  const premiumCard = "bg-surface border border-border shadow-sm rounded-[32px] overflow-hidden transform-gpu transition-all hover:border-foreground/20";

  return (
    <Card className={cn(premiumCard)}>
      <CardHeader className="p-6 sm:p-10 pb-5 sm:pb-6 border-b border-border/40 bg-background/50">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-6">
          <CardTitle className="flex items-center gap-4 sm:gap-5 text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tighter uppercase leading-tight min-w-0">
            {/* Circular Premium Icon Container - AI Analysis Style */}
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
              <Sparkles className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-[#DC2626]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="truncate">{t('mentor.title', 'Financial Advisor')}</span>
                <span className="shrink-0 flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-fintech-graphite-muted/10 text-fintech-graphite-muted px-2.5 sm:px-4 py-1 rounded-full border border-border/40 shadow-sm animate-pulse">
                  ACTIVE
                </span>
              </div>
            </div>
          </CardTitle>
          <BrainCircuit className="h-5 w-5 sm:h-6 sm:w-6 text-fintech-graphite-muted opacity-40 hidden sm:block" />
        </div>
      </CardHeader>

      <CardContent className="space-y-8 sm:space-y-10 p-6 sm:p-10">
        <div className="text-left sm:text-center">
          <h3 className="text-[#1a1a1a] font-black text-2xl sm:text-3xl tracking-tighter leading-tight mb-3 sm:mb-4">
            "{advice?.action || 'Analyzing financial patterns...'}"
          </h3>
          <p className="text-fintech-graphite-muted text-[14px] sm:text-[15px] font-bold leading-relaxed max-w-[320px] sm:mx-auto opacity-80">
            {advice?.reason || 'Comparing recent habits to provide personalized insights.'}
          </p>
          
          <div className="flex justify-start sm:justify-center mt-6 sm:mt-8">
            <span className={cn(
              "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border flex items-center gap-2 sm:gap-2.5 transition-all duration-700",
              advice?.confidence === 'HIGH' ? "text-fintech-emerald-dark border-fintech-emerald/20 bg-fintech-emerald-muted shadow-sm" :
              advice?.confidence === 'MEDIUM' ? "text-fintech-amber-dark border-fintech-amber/20 bg-fintech-amber-muted" :
              "text-fintech-graphite-muted border-border/40 bg-background opacity-60"
            )}>
              {advice?.confidence === 'LOW' && "Limited data points"}
              {advice?.confidence !== 'LOW' && `Integrity: ${advice?.confidence || 'LOW'}`}
              {advice?.confidence === 'HIGH' ? '✓' : ''}
            </span>
          </div>
        </div>

        {advice?.steps && (
          <div className="bg-background/50 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border/60 flex items-start gap-5 sm:gap-8 shadow-[inset_0_2px_10px_rgb(0,0,0,0.01)] transition-all duration-700 hover:bg-background">
            {/* Circular Premium Icon Container - Strategic Steps Style */}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-110">
              <Zap size={18} className="sm:size-[20px] text-[#DC2626]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-2 sm:mb-3 opacity-60">Strategic Steps</p>
              <p className="text-[14px] sm:text-[15px] font-bold text-[#1a1a1a] leading-relaxed whitespace-pre-line opacity-90 tracking-tight">
                {advice.steps}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default SmartFinancialMentor;
