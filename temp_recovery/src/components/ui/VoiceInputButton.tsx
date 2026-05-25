import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/i18n';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
  className?: string;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onListeningChange,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Can be made configurable

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChange?.(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      onListeningChange?.(false);
      if (event.error === 'not-allowed') {
        toast({ title: t('voice.micDenied'), variant: 'destructive' });
      } else {
        toast({ title: t('voice.error'), variant: 'destructive' });
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, onListeningChange, toast]);

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (err) {
        toast({ title: t('voice.micDenied'), variant: 'destructive' });
      }
    }
  };

  if (!isSupported) {
    return null; // or show a disabled button with tooltip
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : ''} ${className}`}
      onClick={toggleListening}
      title={isListening ? t('voice.stop') : t('voice.start')}
    >
      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
};

export default VoiceInputButton;