/**
 * useSplitAIVoice.ts
 * 
 * Voice Flow:
 * - User starts voice session → mic permission requested (if not already granted)
 * - Speech captured, transcribed, and passed to onResult
 * - onResult uses AI parser (with fallback) to extract fields
 * - Form fields are updated in real‑time
 * - After silenceTimeout ms of no speech, autoSave (if provided) is called with final transcript
 * - Controller returns listening status, transcript, and start/stop methods
 * 
 * Silence detection: exactly `silenceTimeout` ms (default 10000 = 10s)
 * Autosave: only when all required fields are filled (handled in component)
 */

import { useCallback, useRef, useEffect } from "react";
import { useVoiceController } from "../core/useVoiceController";
import { useSmartParser } from "../core/useSmartParser";

export interface SplitAIVoiceOptions {
  language: string;
  setTitle: (v: string) => void;
  setAmount: (v: string) => void;
  setPaidBy: (v: string) => void;
  setSplitType: (v: "equal" | "unequal") => void;
  autoSave?: (text: string) => void;               // called after silence timeout
  silenceTimeout?: number;                          // ms of silence before autoSave (default 10000)
  debug?: boolean;                                   // enable console logs
}

export const useSplitAIVoice = ({
  language,
  setTitle,
  setAmount,
  setPaidBy,
  setSplitType,
  autoSave,
  silenceTimeout = 10000,                            // 👈 default 10 seconds
  debug = false,
}: SplitAIVoiceOptions) => {
  const { parseWithAI } = useSmartParser();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[useSplitAIVoice]", ...args);
  }, [debug]);

  const handleResult = useCallback(
    async (text: string) => {
      log("Received transcript:", text);
      try {
        const result = await parseWithAI(text);
        if (!isMounted.current) return;

        if (result.success) {
          log("AI parsed:", result.data);
          if (result.data.title) setTitle(result.data.title);
          if (result.data.amount !== undefined) {
            setAmount(result.data.amount.toString());
          }
          if (result.data.paidBy) setPaidBy(result.data.paidBy);
          if (result.data.split) setSplitType(result.data.split);
        } else {
          // Fallback data – use whatever the fallback parser returned
          log("Fallback parser used, error:", result.error);
          if (result.fallback.amount !== undefined) {
            setAmount(result.fallback.amount.toString());
          }
          if (result.fallback.title) setTitle(result.fallback.title);
          if (result.fallback.paidBy) setPaidBy(result.fallback.paidBy);
          if (result.fallback.split) setSplitType(result.fallback.split);
          // If nothing else, set raw text as title
          if (!result.fallback.title && !result.fallback.amount && !result.fallback.paidBy) {
            setTitle(text);
          }
        }
      } catch (err) {
        if (!isMounted.current) return;
        console.error("Unexpected error in voice result handler", err);
        // Last resort: set raw text as title
        setTitle(text);
      }
    },
    [parseWithAI, setTitle, setAmount, setPaidBy, setSplitType, log]
  );

  const voice = useVoiceController({
    language,
    onResult: handleResult,
    autoSave,
    silenceTimeout,                                   // 👈 pass through
  });

  // Add debugging for listening state changes
  useEffect(() => {
    log("Listening state changed:", voice.listening);
  }, [voice.listening, log]);

  return voice;
};