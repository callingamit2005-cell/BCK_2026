/**
 * useDashboardAIVoice.ts - Enterprise Capacitor & Cross-Browser Engine
 * 🛡️ PRODUCTION READY: Stale closure eliminated, auto-resurrection fixed.
 * 🎙️ CAPACITOR SAFE: Auto-recovers on strict mobile webviews.
 * ⚡ GHOST FLUSH: Hard abort kills OS speech buffers.
 */

import { useState, useEffect, useCallback, useRef } from "react";

// Cross-browser SpeechRecognition with fallback
const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition ||
    (window as any).oSpeechRecognition);

interface DashboardAIVoiceOptions {
  language?: string;
  setAmount?: (v: string) => void;
  setNote?: (v: string) => void;
  setCategory?: (v: string) => void;
  setPaymentMode?: (v: string) => void;
  autoSave?: (text: string) => void;
  silenceTimeout?: number;
}

export const useDashboardAIVoice = ({
  language = "en-IN",
  silenceTimeout = 3000,
}: DashboardAIVoiceOptions) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Refs to hold latest state for event listeners (prevents stale closures)
  const listeningRef = useRef(listening);
  const errorRef = useRef(error);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const manualStopRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // 🚀 ENGINE INITIALIZATION (runs once)
  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported on this device.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!isMounted.current) return;
      setListening(true);
      setError(null);
      manualStopRef.current = false;
    };

    recognition.onresult = (event: any) => {
      if (!isMounted.current) return;

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);

      // Reset silence timer on each speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stop(); // Auto-stop after silence
      }, silenceTimeout);
    };

    recognition.onerror = (event: any) => {
      if (!isMounted.current) return;
      console.warn("Speech recognition event:", event.error);

      if (event.error === "not-allowed") {
        alert(
          "🎙️ Microphone access denied!\n\nPlease allow microphone permissions in your browser settings."
        );
        setError("Microphone access denied.");
        setListening(false);
        manualStopRef.current = true;
      } else if (event.error === "network") {
        setError("Network error. Internet connection required.");
        setListening(false);
      }
    };

    recognition.onend = () => {
      if (!isMounted.current) return;

      // 📱 CAPACITOR / WEBVIEW AUTO-RESURRECTION:
      // Use refs to get the latest listening/error state.
      if (listeningRef.current && !manualStopRef.current && !errorRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty – engine initialised only once

  // Update language without restarting engine
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      alert(
        "⚠️ Voice recognition not supported!\n\nPlease open this app in Google Chrome or another supported browser."
      );
      return;
    }
    if (!recognitionRef.current) return;

    setError(null);
    setTranscript("");
    manualStopRef.current = false;

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Recognition already started", e);
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setListening(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    manualStopRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Hard kill OS buffers
        setTimeout(() => {
          manualStopRef.current = false;
        }, 100);
      } catch (e) {
        console.warn("Buffer flush failed", e);
      }
    }
  }, []);

  return { listening, transcript, error, start, stop, reset };
};
