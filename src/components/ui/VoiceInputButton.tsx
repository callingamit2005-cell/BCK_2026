import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { tSafe } from '@/i18n';

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
    if (Capacitor.isNativePlatform()) {
      setIsSupported(true);
      return;
    }

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
        toast({ title: tSafe('voice.micDenied', 'Microphone access denied'), variant: 'destructive' });
      } else {
        toast({ title: tSafe('voice.error', 'Voice input error'), variant: 'destructive' });
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
    if (Capacitor.isNativePlatform()) {
      try {
        if (isListening) {
          await SpeechRecognition.stop();
          setIsListening(false);
          onListeningChange?.(false);
          return;
        }

        const permissions = await SpeechRecognition.requestPermissions();
        if (permissions.speechRecognition !== 'granted') {
          toast({ title: tSafe('voice.micDenied', 'Microphone access denied'), variant: 'destructive' });
          return;
        }

        setIsListening(true);
        onListeningChange?.(true);
        const result = await SpeechRecognition.start({
          language: 'en-US',
          maxResults: 1,
          partialResults: false,
          popup: false,
        });
        const transcript = result.matches?.[0];
        if (transcript) {
          onTranscript(transcript);
        }
      } catch (err) {
        toast({ title: tSafe('voice.micDenied', 'Microphone access denied'), variant: 'destructive' });
      } finally {
        setIsListening(false);
        onListeningChange?.(false);
      }
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (err) {
        toast({ title: tSafe('voice.micDenied', 'Microphone access denied'), variant: 'destructive' });
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
      className={`rounded-full ${isListening ? 'bg-foreground text-surface animate-pulse' : ''} ${className}`}
      onClick={toggleListening}
      title={isListening ? tSafe('voice.stop', 'Stop') : tSafe('voice.start', 'Start')}
    >
      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
};

export default VoiceInputButton;
