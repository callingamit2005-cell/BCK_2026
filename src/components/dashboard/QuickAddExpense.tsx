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
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { convertToPaisa } from '@/utils/currencyFormatter';
import {
  createLedgerTransaction,
  mergeUnifiedLedgerEntries,
} from '@/features/transactions/ledger';

interface QuickAddExpenseProps {
  onSuccess?: () => void;
}

const CATEGORIES = ['Food', 'Shopping', 'Bills', 'Travel', 'Entertainment', 'Others'];
const PAYMENT_MODES = ['Cash', 'Card', 'UPI'];

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
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  const pushOptimisticLedger = async (transaction: any) => {
    queryClient.setQueryData(['ledger-transactions', user?.id], (old: any[] | undefined) =>
      mergeUnifiedLedgerEntries([transaction, ...((old ?? []) as any[])])
    );

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] }),
    ]);
  };

  const stopListeningAndParse = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}

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
        className: "bg-blue-600 text-white",
        duration: 2000,
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
          toast({ title: t('quickAdd.listening'), description: t('quickAdd.speakNaturally') });
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
      try {
        recognitionRef.current.stop();
      } catch {}
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
      toast({ title: t('quickAdd.listening'), description: t('quickAdd.speakNaturally') });
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

    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'no-speech') {
        toast({ title: t('voice.noSpeech'), description: t('voice.tryAgain'), variant: "destructive" });
      } else if (e.error === 'not-allowed') {
        toast({ title: t('voice.micAccessDenied'), variant: "destructive" });
      } else {
        toast({ title: t('voice.voiceError'), description: e.error, variant: "destructive" });
      }
    };

    recognition.onend = () => {
      if (isListening && transcriptRef.current.trim()) {
        stopListeningAndParse();
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      toast({ title: t('common.error'), description: t('voice.couldNotStart'), variant: "destructive" });
    }
  };

  const handleAutoSave = async (parsed: any) => {
    if (!user) return;
    if (!parsed.amount || !parsed.category) return;

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

      toast({ title: t('quickAdd.autoSaved'), className: "bg-green-600 text-white" });
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

      toast({ title: t('quickAdd.saved'), className: "bg-green-600 text-white" });
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
    if (isListening) {
      stopListeningAndParse();
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            {t('quickAdd.title')}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleVoice}
          className={`
            rounded-full h-11 w-11 transition-all duration-200
            ${isListening
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg animate-pulse'
              : 'bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600'
            }
          `}
          title={isListening ? t('quickAdd.stopListening') : t('quickAdd.voiceInput')}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
      </div>

      {isListening && voiceTranscript && (
        <div className="p-3 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200 text-sm text-slate-700">
          <span className="font-medium text-blue-700">{t('quickAdd.youSaid')}:</span> {voiceTranscript}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="quick-amount" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('quickAdd.amount')}
          </Label>
          <Input
            id="quick-amount"
            type="number"
            placeholder="₹ 0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-category" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('quickAdd.category')}
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              id="quick-category"
              className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all"
            >
              <SelectValue placeholder={t('quickAdd.selectCategory')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-payment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('quickAdd.paymentMode')}
          </Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger
              id="quick-payment"
              className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all"
            >
              <SelectValue placeholder={t('quickAdd.selectPayment')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-note" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('quickAdd.note')}
          </Label>
          <Input
            id="quick-note"
            placeholder={t('quickAdd.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>

        <Button
          onClick={handleManualSave}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {saving ? t('quickAdd.saving') : t('quickAdd.save')}
        </Button>
      </div>
    </div>
  );
};

export default QuickAddExpense;
