import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
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
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface QuickAddExpenseProps {
  onSuccess?: () => void;
}

// Predefined categories (can be moved to constants)
const CATEGORIES = [
  'Food', 'Shopping', 'Bills', 'Travel', 'Entertainment', 'Others'
];

// Payment modes
const PAYMENT_MODES = ['Cash', 'Card', 'UPI'];

// Helper to parse voice transcript
const parseVoiceTranscript = (text: string) => {
  const words = text.toLowerCase().split(/\s+/);
  let amount: number | null = null;
  let category: string | null = null;
  let paymentMode: string | null = null;
  let noteWords: string[] = [];

  for (const word of words) {
    // Check if word is a number (amount)
    const num = parseFloat(word);
    if (!isNaN(num) && amount === null) {
      amount = num;
      continue;
    }

    // Check if word matches a category
    const matchedCategory = CATEGORIES.find(cat => cat.toLowerCase() === word);
    if (matchedCategory && category === null) {
      category = matchedCategory;
      continue;
    }

    // Check if word matches a payment mode
    const matchedMode = PAYMENT_MODES.find(mode => mode.toLowerCase() === word);
    if (matchedMode && paymentMode === null) {
      paymentMode = matchedMode;
      continue;
    }

    // Otherwise, add to note
    noteWords.push(word);
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  const stopListeningAndParse = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) {}

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('common.notSupported'), description: t('voice.browserNotSupported'), variant: "destructive" });
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN'; // or based on language
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('');
      transcriptRef.current = '';
      toast({ title: t('quickAdd.listening'), description: t('quickAdd.speakNaturally') });
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptRef.current += transcript + ' ';
          setVoiceTranscript(transcriptRef.current);
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            stopListeningAndParse();
            // Check auto-save condition after parsing
            const parsed = parseVoiceTranscript(transcriptRef.current);
            if (parsed.amount && parsed.category) {
              handleAutoSave(parsed);
            }
          }, 10000); // 10 seconds pause
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
    } catch (error) {
      setIsListening(false);
      toast({ title: t('common.error'), description: t('voice.couldNotStart'), variant: "destructive" });
    }
  };

  const handleAutoSave = async (parsed: any) => {
    if (!user) return;
    if (!parsed.amount || !parsed.category) return; // required fields

    const amountNum = parsed.amount;
    const cat = parsed.category;
    const mode = parsed.paymentMode || 'Cash';
    const notes = parsed.note || '';

    setSaving(true);
    try {
      await supabase.from('expenses').insert({
        user_id: user.id,
        amount: amountNum,
        category: cat,
        payment_mode: mode,
        note: notes,
        expense_date: new Date().toISOString(),
      });

      toast({ title: t('quickAdd.autoSaved'), className: "bg-green-600 text-white" });
      // Reset form
      setAmount('');
      setCategory('');
      setPaymentMode('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch (error) {
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

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: t('quickAdd.invalidAmount'), variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('expenses').insert({
        user_id: user.id,
        amount: amountNum,
        category,
        payment_mode: paymentMode || 'Cash',
        note: note || null,
        expense_date: new Date().toISOString(),
      });

      toast({ title: t('quickAdd.saved'), className: "bg-green-600 text-white" });
      setAmount('');
      setCategory('');
      setPaymentMode('');
      setNote('');
      if (onSuccess) onSuccess();
    } catch (error) {
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
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">{t('quickAdd.title')}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleVoice}
          className={`rounded-full h-9 w-9 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:bg-purple-50'}`}
          title={isListening ? t('quickAdd.stopListening') : t('quickAdd.voiceInput')}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>

      {isListening && voiceTranscript && (
        <div className="p-2 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-200">
          <span className="font-medium">{t('quickAdd.youSaid')}:</span> {voiceTranscript}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="quick-amount">{t('quickAdd.amount')}</Label>
          <Input
            id="quick-amount"
            type="number"
            placeholder="₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="quick-category">{t('quickAdd.category')}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="quick-category" className="h-10">
              <SelectValue placeholder={t('quickAdd.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quick-payment">{t('quickAdd.paymentMode')}</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger id="quick-payment" className="h-10">
              <SelectValue placeholder={t('quickAdd.selectPayment')} />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quick-note">{t('quickAdd.note')}</Label>
          <Input
            id="quick-note"
            placeholder={t('quickAdd.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-10"
          />
        </div>

        <Button
          onClick={handleManualSave}
          disabled={saving}
          className="w-full bg-purple-600 text-white hover:bg-purple-700 h-10"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? t('quickAdd.saving') : t('quickAdd.save')}
        </Button>
      </div>
    </div>
  );
};

export default QuickAddExpense;