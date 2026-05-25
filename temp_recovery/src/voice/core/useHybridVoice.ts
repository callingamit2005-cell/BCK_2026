/**
 * useHybridVoice.ts
 * 
 * Hybrid voice recognition using Web Speech API with fallback to a mock for debugging.
 * Manages single recognition instance and ensures proper cleanup.
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceOptions {
  language: string;
  onResult: (transcript: string) => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  debug?: boolean;
}

export const useHybridVoice = ({
  language,
  onResult,
  onError,
  onStart,
  onEnd,
  continuous = true,
  interimResults = true,
  debug = false,
}: VoiceOptions) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);

  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[useHybridVoice]", ...args);
  }, [debug]);

  // Initialize recognition once
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (listening) {
      log("Already listening");
      return;
    }

    // Stop any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      log("Speech recognition not supported");
      onError?.("NOT_SUPPORTED");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        log("onstart");
        if (!isMounted.current) return;
        setListening(true);
        setTranscript("");
        onStart?.();
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }
        const fullTranscript = finalTranscript || interimTranscript;
        log("onresult", { finalTranscript, interimTranscript });
        if (!isMounted.current) return;
        setTranscript(fullTranscript);
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        log("onerror", event.error);
        if (!isMounted.current) return;
        if (event.error === "aborted") {
          // Ignore abort – we may have aborted intentionally
          return;
        }
        setListening(false);
        onError?.(event.error);
      };

      recognition.onend = () => {
        log("onend");
        if (!isMounted.current) return;
        setListening(false);
        onEnd?.();
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      log("Error starting recognition", error);
      onError?.(error);
    }
  }, [language, continuous, interimResults, listening, onResult, onError, onStart, onEnd, log]);

  const stopListening = useCallback(() => {
    log("stopListening called");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    // Even if no recognition, ensure state is updated
    setListening(false);
  }, [log]);

  const abortListening = useCallback(() => {
    log("abortListening called");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, [log]);

  return {
    listening,
    transcript,
    startListening,
    stopListening,
    abortListening,
  };
};