/**
 * QuickVoiceEntry.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Multilingual Voice Entry terminal.
 * 🛡️ LOGIC LOCK: Voice integrations, AI parsing, and race-condition locks 100% untouched.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDashboardAIVoice } from "@/voice/integrations/useDashboardAIVoice";
import { useSmartParser } from "@/voice/core/useSmartParser";
import { formatCurrency } from '@/utils/currencyFormatter';
import { createLedgerTransaction } from '@/features/transactions/ledger';
import { parseMultilingualInput } from '@/utils/smartParserEngine';

interface QuickVoiceEntryProps {
  onManualEntryClick?: () => void;
}

const QuickVoiceEntry = React.memo(({ onManualEntryClick }: QuickVoiceEntryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const processExpenseRef = useRef<any>(null);

  const speechLang = useMemo(() => {
    const langMap: Record<string, string> = {
      hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN',
      kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', sa: 'sa-IN', bho: 'bho-IN', mai: 'mai-IN',
      awa: 'awa-IN', hinglish: 'en-IN', en: 'en-IN',
    };
    return langMap[language] || 'en-IN';
  }, [language]);

  const { parseWithAI } = useSmartParser();
  const voice = useDashboardAIVoice({
    language: speechLang,
    silenceTimeout: 1500,
  });

  const handleVoiceStart = async () => {
    try {
      if (voice.listening) {
        voice.stop();
        setTimeout(() => voice.start(), 50);
        return;
      }
      voice.start();
    } catch {
      toast({ title: "Mic Error", variant: "destructive" });
    }
  };

  const processVoiceExpense = useCallback(async (amount: number, note: string, category: string, mode: string) => {
    if (isAutoSaving || !user) return false;
    setIsAutoSaving(true);
    if (voice && voice.reset) voice.reset();

    try {
      const savedTransaction = await createLedgerTransaction({
        userId: user.id,
        amount: amount,
        type: 'expense',
        category,
        paymentMode: mode,
        description: note || "Voice Entry",
        source: 'voice',
        date: new Date().toISOString(),
      });

      await queryClient.invalidateQueries();
      window.dispatchEvent(new Event('newTransaction'));
      window.dispatchEvent(new Event('sync_queue_updated'));

      toast({
        title: "Recorded Successfully",
        description: `${formatCurrency(savedTransaction.amount)} saved to timeline.`,
        className: "bg-surface border-primary text-foreground shadow-premium",
      });
      return true;
    } catch (e: any) {
      console.error("[VOICE_SAVE_ERROR]", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, queryClient, isAutoSaving, toast, voice]);

  useEffect(() => { processExpenseRef.current = processVoiceExpense; }, [processVoiceExpense]);

  const parseWithAIRef = useRef(parseWithAI);
  useEffect(() => { parseWithAIRef.current = parseWithAI; }, [parseWithAI]);

  useEffect(() => {
    const currentTranscript = voice.transcript;
    if (!currentTranscript || currentTranscript.trim() === "" || isAutoSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsParsing(true);
      try {
        const transcript = currentTranscript.trim();
        const data = parseMultilingualInput(transcript);

        if (data.amount) {
          if (voice.listening) voice.stop();
          if (voice.reset) voice.reset();
          await processExpenseRef.current(Number(data.amount), data.description, data.category, data.paymentMode);
        } else if (!voice.listening) {
          const result = await parseWithAIRef.current(transcript);
          const aiData = result.success ? result.data : result.fallback;
          if (aiData.amount) {
            await processExpenseRef.current(
              Number(aiData.amount),
              aiData.title || "Voice Entry",
              aiData.category || "Food",
              aiData.paymentMode || "UPI",
            );
          }
        }
      } catch (err) {
        console.error("Voice parsing error:", err);
      } finally {
        setIsParsing(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [voice.transcript, voice.listening, isAutoSaving]);

  return (
    <Card className="fintech-card overflow-hidden">
      <CardHeader className="bg-muted/20 py-5 border-b border-border/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground tracking-tight">Quick Voice Entry</CardTitle>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 opacity-80">Say "100 milk cash" or "500 auto"</p>
        </div>
        <div className="flex gap-3 items-center">
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full border border-border/60 shadow-sm animate-fade-in-up">
              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Saving...</span>
            </div>
          )}
          <Button
            onClick={handleVoiceStart}
            className={cn(
              "relative h-12 w-12 rounded-full transition-all duration-300 shadow-premium active:scale-95 group",
              voice.listening 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/20",
            )}
          >
            {voice.listening && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />}
            {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {(voice.transcript || isParsing) ? (
          <div className="p-4 bg-muted/20 rounded-xl border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            {isParsing ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
            <p className="text-sm italic font-medium text-foreground">
              {isParsing ? "Analyzing Entry..." : `"${voice.transcript}"`}
            </p>
          </div>
        ) : (
          <Button
            onClick={() => navigate('/add-expense')}
            className="w-full h-12 rounded-xl bg-surface border border-border text-foreground hover:bg-muted/50 shadow-sm active:scale-[0.98] transition-all text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4 text-primary" /> 
            Type Manually
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

QuickVoiceEntry.displayName = 'QuickVoiceEntry';

export default QuickVoiceEntry;
