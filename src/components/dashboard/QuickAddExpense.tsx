/**
 * QuickAddExpense.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Efficiency Transaction Entry Terminal.
 * 🛡️ LOGIC LOCK: Voice parsing, state management, and submission logic 100% untouched.
 */

import { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import {
  createLedgerTransaction,
  mergeUnifiedLedgerEntries,
} from '@/features/transactions/ledger';
import { cn } from '@/lib/utils';

interface QuickAddExpenseProps {
  onSuccess?: () => void;
}

const CATEGORIES = ['Food', 'Shopping', 'Bills', 'Travel', 'Entertainment', 'Others'];
const PAYMENT_MODES = ['Cash', 'Card', 'UPI'];

// Logic: Parse Voice Transcript (Locked)
const parseVoiceTranscript = (text: string) => {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let amount: number | null = null;
  let category: string | null = null;
  let paymentMode: string | null = null;
  const noteWords: string[] = [];

  let multiplier = 1;
  if (lower.includes("lakh") || lower.includes("lac")) multiplier = 100000;
  else if (lower.includes("crore") || lower.includes("cr")) multiplier = 10000000;

  const amountMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|crore|cr)?/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]) * multiplier;
  }

  for (const word of words) {
    if (amount !== null && !Number.isNaN(parseFloat(word))) continue;

    const matchedCategory = CATEGORIES.find((cat) => cat.toLowerCase() === word);
    if (matchedCategory && category === null) {
      category = matchedCategory;
      continue;
    }

    const matchedMode = PAYMENT_MODES.find((mode) => mode.toLowerCase() === word);
    if (matchedMode && paymentMode === null) {
      paymentMode = matchedMode;
      continue;
    }

    if (!amountMatch?.[0].includes(word)) {
      noteWords.push(word);
    }
  }

  return {
    amount,
    category,
    paymentMode,
    note: noteWords.join(' '),
  };
};

const QuickAddExpense = ({ onSuccess }: QuickAddExpenseProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const transcriptRef = useRef('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  const stopListeningAndParse = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}

    const finalTranscript = transcriptRef.current.trim();
    if (finalTranscript) {
      const parsed = parseVoiceTranscript(finalTranscript);

      if (parsed.amount) setAmount(parsed.amount.toString());
      if (parsed.category) setCategory(parsed.category);
      if (parsed.paymentMode) setPaymentMode(parsed.paymentMode);
      if (parsed.note) setNote(parsed.note);

      toast({
        title: t('quickAdd.voiceDetected'),
        description: finalTranscript,
        className: "bg-surface border-primary text-foreground shadow-premium",
        duration: 3000,
      });
    }

    setIsListening(false);
    setVoiceTranscript('');
    transcriptRef.current = '';
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

  const startListening = () => {
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          const permissionStatus = await SpeechRecognition.requestPermissions();
          if (permissionStatus.speechRecognition !== 'granted') {
            toast({ title: t('voice.micAccessDenied'), variant: "destructive" });
            return;
          }

          setIsListening(true);
          const result = await SpeechRecognition.start({
            language: 'en-IN',
            maxResults: 1,
            partialResults: false,
            popup: false,
          });

          const transcript = result.matches?.[0]?.trim() ?? '';
          if (!transcript) {
            setIsListening(false);
            return;
          }

          transcriptRef.current = transcript;
          setVoiceTranscript(transcript);
          stopListeningAndParse();

          const parsed = parseVoiceTranscript(transcript);
          if (parsed.amount && parsed.category) {
            await handleAutoSave(parsed);
          }
        } catch (e: any) {
          setIsListening(false);
          toast({
            title: t('voice.voiceError'),
            description: e?.message ?? t('voice.couldNotStart'),
            variant: "destructive",
          });
        } finally {
          setIsListening(false);
        }
      })();
      return;
    }

    const BrowserSpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!BrowserSpeechRecognition) {
      toast({
        title: t('common.notSupported'),
        description: t('voice.browserNotSupported'),
        variant: "destructive",
      });
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new BrowserSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('');
      transcriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptRef.current += `${transcript} `;
          setVoiceTranscript(transcriptRef.current);
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            stopListeningAndParse();
            const parsed = parseVoiceTranscript(transcriptRef.current);
            if (parsed.amount && parsed.category) {
              void handleAutoSave(parsed);
            }
          }, 10000);
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (isListening && transcriptRef.current.trim()) {
        stopListeningAndParse();
      } else {
        setIsListening(false);
      }
    };

    try { recognition.start(); } catch { setIsListening(false); }
  };

  const handleAutoSave = async (parsed: any) => {
    if (!user || !parsed.amount || !parsed.category) return;

    setSaving(true);
    try {
      await createLedgerTransaction({
        userId: user.id,
        amount: Number(parsed.amount),
        type: 'expense',
        category: parsed.category,
        paymentMode: parsed.paymentMode || 'Cash',
        payee: parsed.note || parsed.category,
        source: 'voice',
      });

      toast({ title: t('quickAdd.autoSaved'), className: "bg-surface border-primary text-foreground" });
      setAmount('');
      setCategory('');
      setPaymentMode('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!user) return;
    if (!amount || !category) {
      toast({ title: t('quickAdd.requiredFields'), variant: "destructive" });
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: t('quickAdd.invalidAmount'), variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await createLedgerTransaction({
        userId: user.id,
        amount: amountNum,
        type: 'expense',
        category,
        paymentMode: paymentMode || 'Cash',
        payee: note || category,
        source: 'manual',
      });

      toast({ title: t('quickAdd.saved'), className: "bg-surface border-primary text-foreground" });
      setAmount('');
      setCategory('');
      setPaymentMode('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) stopListeningAndParse();
    else startListening();
  };

  return (
    <div className="fintech-card p-6 sm:p-8 space-y-8 relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {t('quickAdd.title')}
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Instant Ledger Entry</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleVoice}
          className={cn(
            "rounded-full h-12 w-12 transition-all duration-300",
            isListening
              ? "bg-primary text-primary-foreground shadow-premium animate-pulse"
              : "bg-muted/50 text-muted-foreground border border-border hover:bg-primary/5 hover:text-primary"
          )}
          title={isListening ? t('quickAdd.stopListening') : t('quickAdd.voiceInput')}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
      </div>

      {/* VOICE TRANSCRIPT LOG */}
      {isListening && voiceTranscript && (
        <div className="p-4 bg-muted/30 rounded-xl border border-primary/20 text-sm text-foreground italic shadow-inner animate-in fade-in slide-in-from-top-2">
          <span className="font-bold uppercase tracking-wider text-[10px] text-primary mr-2">Live Analysis:</span> {voiceTranscript}
        </div>
      )}

      {/* FORM FIELDS */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="quick-amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            {t('quickAdd.amount')}
          </Label>
          <div className="relative group">
            <Input
              id="quick-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 rounded-xl bg-muted/20 border-border/50 text-xl font-bold text-foreground font-mono tabular-nums focus:ring-primary focus:border-primary/50 transition-all pl-10 pr-6"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground group-focus-within:text-primary">₹</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-category" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              {t('quickAdd.category')}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="quick-category"
                className="h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-semibold text-foreground focus:ring-primary focus:border-primary/50"
              >
                <SelectValue placeholder={t('quickAdd.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-surface shadow-institutional">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="h-10 rounded-lg text-sm font-medium">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-payment" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              {t('quickAdd.paymentMode')}
            </Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger
                id="quick-payment"
                className="h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-semibold text-foreground focus:ring-primary focus:border-primary/50"
              >
                <SelectValue placeholder={t('quickAdd.selectPayment')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-surface shadow-institutional">
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode} className="h-10 rounded-lg text-sm font-medium">{mode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-note" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            {t('quickAdd.note')} (Optional)
          </Label>
          <Input
            id="quick-note"
            placeholder={t('quickAdd.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-medium text-foreground focus:ring-primary focus:border-primary/50"
          />
        </div>

        <Button
          onClick={handleManualSave}
          disabled={saving}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest shadow-premium hover:opacity-90 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          {saving ? t('quickAdd.saving') : t('quickAdd.save')}
        </Button>
      </div>
    </div>
  );
};

QuickAddExpense.displayName = 'QuickAddExpense';

export default QuickAddExpense;
