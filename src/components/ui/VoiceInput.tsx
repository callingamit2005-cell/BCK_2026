import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onResult: (val: string) => void;
  className?: string;
  isListening?: boolean;
  setIsListening?: (val: boolean) => void;
}

const VoiceInput = ({ onResult, className, isListening: propIsListening, setIsListening: propSetIsListening }: VoiceInputProps) => {
  const [internalIsListening, setInternalIsListening] = useState(false);
  
  // 🛡️ [SYNC_CONROLL] Link internal state to parent control
  const isListening = propIsListening !== undefined ? propIsListening : internalIsListening;
  const setIsListening = propSetIsListening || setInternalIsListening;

  const { toast } = useToast();
  const { t } = useLanguage();

  // 🛡️ [CONCURRENCY_GUARD] 
  // Prevents multiple start attempts during async permission/initialization phase.
  const isStartingRef = useRef(false);
  const isListeningRef = useRef(false);
  const autoStartConsumedRef = useRef<string | null>(null);

  const startListening = async () => {
    if (isStartingRef.current || isListeningRef.current) {
      return;
    }

    try {
      isStartingRef.current = true;
      if (Capacitor.isNativePlatform()) {
        const currentStatus = await SpeechRecognition.checkPermissions();
        let isGranted = currentStatus.speechRecognition === 'granted';
        
        if (!isGranted) {
          const permissionStatus = await SpeechRecognition.requestPermissions();
          isGranted = permissionStatus.speechRecognition === 'granted';
        }

        if (!isGranted) {
          toast({
            title: t('voiceInput.permissionDenied'),
            description: t('voiceInput.allowMic'),
            variant: "destructive"
          });
          setIsListening(false);
          return;
        }

        setIsListening(true);
        isListeningRef.current = true;
        
        const result = await SpeechRecognition.start({
          language: 'en-IN',
          maxResults: 1,
          partialResults: false,
          popup: false,
        });

        const transcript = result.matches?.[0]?.replace(/\.$/, '').trim();
        if (transcript) {
          onResult(transcript);
        }
      } else {
        // @ts-ignore
        const SpeechRecognitionWeb = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionWeb) {
          toast({ 
            title: t('voiceInput.errorTitle'), 
            description: t('voiceInput.browserNotSupported'), 
            variant: "destructive" 
          });
          return;
        }

        const recognition = new SpeechRecognitionWeb();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const cleanText = transcript.replace(/\.$/, '').trim(); 
          onResult(cleanText);
          setIsListening(false);
          isListeningRef.current = false;
        };

        recognition.onerror = (e: any) => {
          console.error("[VoiceInput] Web Error:", e);
          setIsListening(false);
          isListeningRef.current = false;
          if (e.error === 'not-allowed') {
             toast({ 
               title: t('voiceInput.permissionDenied'), 
               description: t('voiceInput.allowMic'), 
               variant: "destructive" 
             });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          isListeningRef.current = false;
        };
        recognition.start();
      }
    } catch (e: any) {
      console.error(`[VoiceInput] Error:`, e);
      toast({
        title: t('voiceInput.permissionDenied'),
        description: t('voiceInput.allowMic'),
        variant: "destructive"
      });
      setIsListening(false);
      isListeningRef.current = false;
    } finally {
      isStartingRef.current = false;
    }
  };

  // 🚀 [AUTO_START_SYNC] 
  // Watch for parent signaling isListening: true.
  // Use a ref to ensure we consume the signal only once per true transition.
  useEffect(() => {
    if (propIsListening && !isListeningRef.current && !isStartingRef.current) {
      startListening();
    }
  }, [propIsListening]);

  return (
    <button
      type="button"
      onClick={startListening}
      className={cn(
        "relative rounded-full transition-all flex items-center justify-center",
        isListening ? 'bg-primary text-primary-foreground animate-pulse scale-110 shadow-premium' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40',
        className
      )}
    >
      {isListening ? <MicOff className="h-1/3 w-1/3" /> : <Mic className="h-1/3 w-1/3" />}
    </button>
  );
};

export default VoiceInput;
