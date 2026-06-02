/**
 * useVoiceInput.ts
 * ─────────────────────────────────────────────────────────────────
 * Production-ready voice input hook for fintech expense app.
 *
 * Fixes applied vs previous version:
 *  1. Silence timer starts ONLY after first speech is detected.
 *  2. Transcript is NOT cleared on stop — caller receives last value.
 *  3. Web mode uses continuous:true + manual silence detection so the
 *     10-second window works properly (not just single-utterance).
 *  4. onEnd race condition fixed via hasFiredFinal ref flag.
 *  5. Silence timeout fires onFinal with the LAST captured transcript,
 *     never with an empty string when speech was actually captured.
 *  6. All refs are stable — no stale-closure bugs.
 *  7. Works on Web (Chrome/Edge/Safari), Capacitor iOS/Android.
 *
 * @module useVoiceInput
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

// ─── Types ───────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseVoiceInputReturn {
  listening: boolean;
  transcript: string;
  startListening: (onFinal: (text: string) => void) => Promise<void>;
  stopListening: () => Promise<void>;
}

// ─── Constants ───────────────────────────────────────────────────

const LANGUAGE_CODES: Record<string, string> = {
  en: "en-IN",
  hinglish: "en-IN",
  hi: "hi-IN",
  pa: "pa-IN",
  gu: "gu-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  or: "or-IN",
  bho: "hi-IN",
  mai: "hi-IN",
  sa: "hi-IN",
  sat: "hi-IN",
  aw: "hi-IN",
};

/** Milliseconds of silence after last speech before autosave triggers */
const SILENCE_TIMEOUT_MS = 1_200;

/** Fallback hard-stop if recognition never fires at all */
const MAX_LISTEN_TIMEOUT_MS = 8_000;

// ─── Hook ────────────────────────────────────────────────────────

/**
 * useVoiceInput
 *
 * A cross‑platform voice input hook that works on both web and native (Capacitor).
 * Manages a continuous listening session with a silence timeout.
 *
 * @param language - Language code (e.g., "en", "hi") – mapped to BCP‑47.
 * @returns An object containing listening state, current transcript, and start/stop functions.
 */
export const useVoiceInput = (
  language: string = "en"
): UseVoiceInputReturn => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Refs — stable across renders, no stale closures
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeListenersRef = useRef<{ remove: () => void }[]>([]);
  const webRecognitionRef = useRef<any>(null);
  const transcriptRef = useRef(""); // mirrors transcript state for use in callbacks
  const onFinalRef = useRef<((text: string) => void) | null>(null);
  const hasFiredFinalRef = useRef(false);
  const isListeningRef = useRef(false);

  const isNative = Capacitor.isNativePlatform();

  // Keep transcriptRef in sync with state
  const updateTranscript = useCallback((text: string) => {
    transcriptRef.current = text;
    setTranscript(text);
  }, []);

  // ── Silence timer ────────────────────────────────────────────
  // Called every time new speech arrives — resets the 10s window.
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      // Silence detected — fire onFinal with whatever we have
      const captured = transcriptRef.current;
      if (!hasFiredFinalRef.current) {
        hasFiredFinalRef.current = true;
        onFinalRef.current?.(captured);
      }
    }, SILENCE_TIMEOUT_MS);
  }, []);

  // ── Core cleanup ─────────────────────────────────────────────
  const cleanup = useCallback(async () => {
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (hardStopTimerRef.current) {
      clearTimeout(hardStopTimerRef.current);
      hardStopTimerRef.current = null;
    }

    // Native
    nativeListenersRef.current.forEach((l) => l.remove());
    nativeListenersRef.current = [];
    if (isNative) {
      try {
        await SpeechRecognition.stop();
      } catch (_) {}
    }

    // Web
    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.onresult = null;
        webRecognitionRef.current.onerror = null;
        webRecognitionRef.current.onend = null;
        webRecognitionRef.current.stop();
      } catch (_) {}
      webRecognitionRef.current = null;
    }

    isListeningRef.current = false;
  }, [isNative]);

  // Unmount cleanup
  useEffect(() => () => { cleanup(); }, [cleanup]);

  // ── Public: stopListening ────────────────────────────────────
  const stopListening = useCallback(async () => {
    await cleanup();
    setListening(false);
    // NOTE: transcript state is intentionally NOT cleared here.
    // The caller (field mapper) reads it after stop.
  }, [cleanup]);

  // ── Public: startListening ───────────────────────────────────
  const startListening = useCallback(
    async (onFinal: (text: string) => void) => {
      // Guard: don't double-start
      if (isListeningRef.current) {
        await cleanup();
      }

      // Reset state
      updateTranscript("");
      hasFiredFinalRef.current = false;
      onFinalRef.current = onFinal;
      isListeningRef.current = true;

      setListening(true);

      const langCode = LANGUAGE_CODES[language] ?? "en-IN";

      // Hard-stop fallback (30s) — fires onFinal with whatever was captured
      hardStopTimerRef.current = setTimeout(() => {
        if (!hasFiredFinalRef.current) {
          hasFiredFinalRef.current = true;
          onFinalRef.current?.(transcriptRef.current);
        }
        stopListening();
      }, MAX_LISTEN_TIMEOUT_MS);

      try {
        // ── NATIVE (Capacitor) ──────────────────────────────────
        if (isNative) {
          await SpeechRecognition.requestPermissions();

          await SpeechRecognition.start({
            language: langCode,
            maxResults: 1,
            partialResults: true,
            popup: false,
          });

          const partialListener = await SpeechRecognition.addListener(
            "partialResults",
            (data: any) => {
              const text: string = data.matches?.[0] ?? "";
              if (!text) return;
              updateTranscript(text);
              resetSilenceTimer(); // speech arrived → reset 10s window
            }
          );

          const resultsListener = await SpeechRecognition.addListener(
            "results",
            (data: any) => {
              const text: string = data.matches?.[0] ?? "";
              updateTranscript(text);
              if (!hasFiredFinalRef.current) {
                hasFiredFinalRef.current = true;
                onFinalRef.current?.(text);
              }
              stopListening();
            }
          );

          nativeListenersRef.current = [partialListener, resultsListener];
          return;
        }

        // ── WEB ─────────────────────────────────────────────────
        const SpeechAPI =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechAPI) {
          console.error("SpeechRecognition not supported in this browser");
          setListening(false);
          isListeningRef.current = false;
          onFinal("");
          return;
        }

        const recognition = new SpeechAPI();
        recognition.lang = langCode;
        recognition.interimResults = true;
        /**
         * continuous: true is REQUIRED so the browser doesn't auto-stop
         * after the first utterance. We manage the stop ourselves via the
         * 10-second silence timer.
         */
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setListening(true);
          isListeningRef.current = true;
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Accumulate the full transcript from all results
          let full = "";
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + " ";
          }
          const text = full.trim();
          updateTranscript(text);
          resetSilenceTimer(); // speech arrived → reset 10s silence window
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // "no-speech" is benign — keep listening
          if (event.error === "no-speech") return;
          console.error("Web speech error:", event.error);
          if (!hasFiredFinalRef.current) {
            hasFiredFinalRef.current = true;
            onFinalRef.current?.(transcriptRef.current);
          }
          stopListening();
        };

        recognition.onend = () => {
          /**
           * In continuous mode, onend fires if the browser force-stops the
           * session (e.g. tab loses focus). Restart transparently if we're
           * still supposed to be listening AND no final has fired yet.
           */
          if (isListeningRef.current && !hasFiredFinalRef.current) {
            try {
              recognition.start(); // auto-restart
            } catch (_) {
              // Can't restart — fire final with whatever we have
              if (!hasFiredFinalRef.current) {
                hasFiredFinalRef.current = true;
                onFinalRef.current?.(transcriptRef.current);
              }
              stopListening();
            }
          }
        };

        recognition.start();
        webRecognitionRef.current = recognition;
      } catch (err) {
        console.error("Voice input error:", err);
        isListeningRef.current = false;
        setListening(false);
        onFinal("");
      }
    },
    [language, isNative, cleanup, stopListening, updateTranscript, resetSilenceTimer]
  );

  return { listening, transcript, startListening, stopListening };
};
