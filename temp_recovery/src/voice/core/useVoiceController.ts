/**
 * useVoiceController.ts
 * 
 * High‑level voice controller with lifecycle management.
 * - Manages start/stop, listening state, and final status.
 * - Integrates with useHybridVoice and provides a clean API.
 * - After silence, it calls onResult and autoSave, then sets status to "done".
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useHybridVoice } from "./useHybridVoice";

interface VoiceControllerOptions {
  language: string;
  onResult: (text: string) => void;      // called with final transcript
  autoSave?: (text: string) => void;      // called after successful result
  silenceTimeout?: number;                 // ms of silence before autoSave (default 10000)
  debug?: boolean;
}

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

  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[useVoiceController]", ...args);
  }, [debug]);

  const handleResult = useCallback((text: string) => {
    log("handleResult", text);
    finalTranscriptRef.current = text;
    onResult(text);
    // Do not set done yet – wait for silence to expire or recognition to end
  }, [onResult, log]);

  const handleEnd = useCallback(() => {
    log("handleEnd – recognition ended");
    if (!isActiveRef.current) return;

    // If we have a final transcript, call autoSave and mark done
    if (finalTranscriptRef.current) {
      autoSave?.(finalTranscriptRef.current);
      setStatus("done");
    } else {
      // No transcript – go idle
      setStatus("idle");
    }
    isActiveRef.current = false;
  }, [autoSave, log]);

  const handleError = useCallback((error: string) => {
    log("handleError", error);
    if (!isActiveRef.current) return;
    // On error, abort and go idle
    setStatus("idle");
    isActiveRef.current = false;
  }, [log]);

  const { listening, transcript, startListening, stopListening, abortListening } =
    useHybridVoice({
      language,
      onResult: handleResult,
      onEnd: handleEnd,
      onError: handleError,
      onStart: () => log("Voice started"),
      silenceTimeout,
      debug,
    });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        abortListening();
      }
    };
  }, [abortListening]);

  const start = useCallback(() => {
    log("start called");
    if (listening) {
      log("Already listening, ignoring start");
      return;
    }
    // Reset state
    finalTranscriptRef.current = "";
    isActiveRef.current = true;
    setStatus("listening");
    startListening();
  }, [startListening, listening, log]);

  const stop = useCallback(() => {
    log("stop called");
    isActiveRef.current = false;
    stopListening();
    setStatus("idle");
  }, [stopListening, log]);

  return {
    listening,      // raw microphone state
    transcript,     // live transcript (can be used for UI)
    status,         // idle / listening / done
    start,
    stop,
  };
};