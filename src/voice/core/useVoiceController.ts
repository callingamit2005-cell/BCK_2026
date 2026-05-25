// src/hooks/useVoiceController.ts
// Enterprise‑grade hook for managing voice recognition lifecycle.
// Uses useHybridVoice underneath and adds silence timeout & auto‑save.
// Logic untouched – only comments and formatting enhanced.

import { useState, useCallback, useRef, useEffect } from "react";
import { useHybridVoice } from "./useHybridVoice";

interface VoiceControllerOptions {
  language: string;
  onResult: (text: string) => void;
  autoSave?: (text: string) => void;
  silenceTimeout?: number;
  debug?: boolean;
}

/**
 * useVoiceController
 *
 * A high‑level voice controller that builds on useHybridVoice.
 * Features:
 * - Manages a silence timeout to automatically stop listening after inactivity.
 * - Accumulates partial transcripts and provides a final result via autoSave.
 * - Exposes a clean status (`idle`, `listening`, `done`) for UI feedback.
 *
 * @param language - BCP‑47 language code for recognition.
 * @param onResult - Callback for each interim/final transcript chunk.
 * @param autoSave - Optional callback triggered when silence timeout ends.
 * @param silenceTimeout - Milliseconds of silence before auto‑save (default 10000).
 * @param debug - Enable console logging.
 */
export const useVoiceController = ({
  language,
  onResult,
  autoSave,
  silenceTimeout = 10000,
  debug = false,
}: VoiceControllerOptions) => {
  const [status, setStatus] = useState<"idle" | "listening" | "done">("idle");
  const isActiveRef = useRef(false);
  const finalTranscriptRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[useVoiceController]", ...args);
  }, [debug]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleResult = useCallback((text: string) => {
    const chunk = text.trim();
    log("handleResult", chunk);
    if (!chunk) return;

    finalTranscriptRef.current = `${finalTranscriptRef.current} ${chunk}`.trim();
    onResult(finalTranscriptRef.current);
  }, [onResult, log]);

  const handleEnd = useCallback(() => {
    log("handleEnd - recognition ended");
    clearSilenceTimer();

    if (!isActiveRef.current) return;

    if (finalTranscriptRef.current) {
      autoSave?.(finalTranscriptRef.current);
      setStatus("done");
    } else {
      setStatus("idle");
    }

    finalTranscriptRef.current = "";
    isActiveRef.current = false;
  }, [autoSave, clearSilenceTimer, log]);

  const handleError = useCallback((error: string) => {
    log("handleError", error);
    clearSilenceTimer();

    if (!isActiveRef.current) return;

    setStatus("idle");
    isActiveRef.current = false;
  }, [clearSilenceTimer, log]);

  const {
    listening,
    transcript,
    permissionState,
    lastError,
    startListening,
    stopListening,
    abortListening,
    resetVoiceState,
  } = useHybridVoice({
    language,
    onResult: handleResult,
    onEnd: handleEnd,
    onError: handleError,
    onStart: () => log("Voice started"),
    debug,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (isActiveRef.current) {
        abortListening();
      }
    };
  }, [abortListening, clearSilenceTimer]);

  // Reset state after "done" status clears
  useEffect(() => {
    if (status !== "done") return;
    resetVoiceState();
    setStatus("idle");
  }, [status, resetVoiceState]);

  // Silence timeout management
  useEffect(() => {
    if (!isActiveRef.current || !listening) {
      clearSilenceTimer();
      return;
    }

    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;
      log("silence timeout reached, stopping recognition");
      stopListening();
    }, silenceTimeout);

    return clearSilenceTimer;
  }, [listening, transcript, silenceTimeout, stopListening, clearSilenceTimer, log]);

  const start = useCallback(() => {
    log("start called");
    if (listening) {
      log("Restarting active session");
      abortListening();
    }

    finalTranscriptRef.current = "";
    clearSilenceTimer();
    isActiveRef.current = true;
    setStatus("listening");
    startListening();
  }, [startListening, listening, clearSilenceTimer, abortListening, log]);

  const stop = useCallback(() => {
    log("stop called");
    clearSilenceTimer();
    isActiveRef.current = false;
    finalTranscriptRef.current = "";
    stopListening();
    resetVoiceState();
    setStatus("idle");
  }, [stopListening, clearSilenceTimer, resetVoiceState, log]);

  return {
    listening,
    transcript,
    permissionState,
    lastError,
    voiceState: permissionState === "requesting"
      ? "requesting"
      : listening
        ? "listening"
        : permissionState === "denied"
          ? "denied"
          : "idle",
    status,
    start,
    stop,
  };
};