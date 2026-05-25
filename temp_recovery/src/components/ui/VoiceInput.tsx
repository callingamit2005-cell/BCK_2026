import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceInputProps {
  onResult: (val: string) => void;
  className?: string;
}

const VoiceInput = ({ onResult, className }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({ 
        title: t('voiceInput.errorTitle'), 
        description: t('voiceInput.browserNotSupported'), 
        variant: "destructive" 
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Use 'hi-IN' if you want pure Hindi, 'en-IN' handles numbers better
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Clean up the text (remove full stops, trim)
      const cleanText = transcript.replace(/\.$/, '').trim(); 
      onResult(cleanText);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      // Don't spam toast on simple no-speech errors
      if (e.error === 'not-allowed') {
         toast({ 
           title: t('voiceInput.permissionDenied'), 
           description: t('voiceInput.allowMic'), 
           variant: "destructive" 
         });
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={startListening}
      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
        isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
      } ${className}`}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
};

export default VoiceInput;