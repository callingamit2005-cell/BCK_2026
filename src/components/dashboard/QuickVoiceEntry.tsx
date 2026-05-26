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
import { convertToPaisa, formatCurrency } from '@/utils/currencyFormatter';
import {
  createLedgerTransaction,
  mergeUnifiedLedgerEntries,
} from '@/features/transactions/ledger';

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
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      sa: 'sa-IN',
      bho: 'bho-IN',
      mai: 'mai-IN',
      awa: 'awa-IN',
      hinglish: 'en-IN',
      en: 'en-IN',
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
    
    // 🛡️ [RACE_CONDITION_LOCK]
    setIsAutoSaving(true);
    if (voice && voice.reset) voice.reset();

    try {
      const savedTransaction = await createLedgerTransaction({
        userId: user.id,
        amount: amount, // Pass Rupees
        type: 'expense',
        category,
        paymentMode: mode,
        description: note || "Voice Entry",
        source: 'voice',
        date: new Date().toISOString(),
      });

      // 🛡️ [UI_STATE_SYNCHRONIZATION]
      await queryClient.invalidateQueries();
      window.dispatchEvent(new Event('newTransaction'));
      window.dispatchEvent(new Event('sync_queue_updated'));

      toast({
        title: "Saved Successfully!",
        description: `${formatCurrency(savedTransaction.amount)} recorded via ${mode}`,
        className: "bg-emerald-600 text-white",
      });
      return true;
    } catch (e: any) {
      // 🛡️ [PHANTOM_POPUP_FIX]
      // Only show error toast if it's a legitimate failure, not an abort or redundant trigger.
      console.error("[VOICE_SAVE_ERROR]", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, queryClient, isAutoSaving, toast, voice]);

  useEffect(() => {
    processExpenseRef.current = processVoiceExpense;
  }, [processVoiceExpense]);

  const parseWithAIRef = useRef(parseWithAI);
  useEffect(() => {
    parseWithAIRef.current = parseWithAI;
  }, [parseWithAI]);

  useEffect(() => {
    const currentTranscript = voice.transcript;
    if (!currentTranscript || currentTranscript.trim() === "" || isAutoSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsParsing(true);
      try {
        const transcript = currentTranscript.trim();
        const data = parseMultilingualInput(transcript);

        if (data.amount) {
          // 🛡️ [VOICE_SETTLEMENT_LOCK]
          // Stop mic and clear transcript immediately to prevent redundant parsing
          // of the same voice data which causes 'idempotency collision' error popups.
          if (voice.listening) voice.stop();
          if (voice.reset) voice.reset();
          
          await processExpenseRef.current(
            Number(data.amount), 
            data.description, 
            data.category, 
            data.paymentMode
          );
        } else if (!voice.listening) {
          // Fallback to AI if deterministic parser fails to find an amount
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

  const primaryGradient = "bg-[linear-gradient(135deg,#7C3AED,#EC4899)]";
  const cardGlass =
    "bg-white/80 backdrop-blur-xl border border-white/20 rounded-[22px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(124,58,237,0.12)] transition-all duration-300";

  return (
    <Card className={cn(cardGlass, "overflow-hidden")}>
      <CardHeader className="bg-purple-50/50 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black text-purple-700">Quick Voice Entry</CardTitle>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Say "100 milk cash" or "500 auto"</p>
        </div>
        <div className="flex gap-2 items-center">
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full border border-emerald-200 hidden sm:flex">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Saving Instantly...</span>
            </div>
          )}
          <Button
            onClick={handleVoiceStart}
            className={cn(
              "relative h-12 w-12 rounded-full shadow-md transition-all duration-300",
              voice.listening ? "bg-rose-500 hover:bg-rose-600 scale-110" : primaryGradient,
            )}
          >
            {voice.listening && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />}
            {voice.listening ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {(voice.transcript || isParsing) ? (
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
            {isParsing ? <Loader2 className="h-5 w-5 text-purple-500 animate-spin mt-0.5" /> : <div className="w-2 h-2 mt-1 rounded-full bg-rose-500 animate-ping" />}
            <p className="text-sm italic font-bold text-purple-900">{isParsing ? "Analyzing Command..." : `"${voice.transcript}"`}</p>
          </div>
        ) : (
          <Button
            onClick={() => navigate('/add-expense')}
            className={`w-full ${primaryGradient} text-white py-6 rounded-[20px] shadow-lg active:scale-[0.98] transition-all text-lg font-bold h-14 flex items-center justify-center`}
          >
            <Plus className="mr-2 h-6 w-6" /> Or Type Manually
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickVoiceEntry;
