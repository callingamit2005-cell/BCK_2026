// src/hooks/useHybridVoice.ts
// Enterprise‑grade voice hook – no UI, only business logic.
// All logic untouched – only minor comment and formatting enhancements.

import { useState, useEffect, useRef, useCallback } from "react";
import {
  abortListening as abortVoiceSession,
  type VoiceErrorCode,
  getPermissionState,
  startListening as startVoiceSession,
  stopListening as stopVoiceSession,
  type VoiceError,
  type VoicePermissionState,
  type VoiceSession,
} from "@/services/voiceService";
import { addBackgroundListener } from "@/services/voicePlatform";

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

/**
 * useHybridVoice
 *
 * A robust React hook for managing voice recognition sessions.
 * Handles permissions, lifecycle, and cleanup automatically.
 * Supports multiple languages and continuous/interim modes.
 *
 * @returns Voice session state and control functions
 */
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
  const [permissionState, setPermissionState] = useState<VoicePermissionState>(getPermissionState());
  const [lastError, setLastError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const isMounted = useRef(true);
  const isStartingRef = useRef(false);

  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[useHybridVoice]", ...args);
  }, [debug]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    const removeBackgroundListener = addBackgroundListener(() => {
      abortVoiceSession();
      sessionRef.current = null;
      if (!isMounted.current) return;
      setListening(false);
    });

    return () => {
      isMounted.current = false;
      abortVoiceSession();
      sessionRef.current?.cleanup?.();
      sessionRef.current = null;
      removeBackgroundListener();
    };
  }, []);

  const resetVoiceState = useCallback(() => {
    setTranscript("");
    setLastError(null);
  }, []);

  const startListening = useCallback(async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current) {
      const duplicateError = "DUPLICATE_START" as VoiceErrorCode;
      setLastError(duplicateError);
      onError?.(duplicateError);
      return;
    }

    isStartingRef.current = true;
    resetVoiceState();

    // Clean up any existing session before starting a new one
    if (sessionRef.current || listening) {
      try {
        stopVoiceSession();
        abortVoiceSession();
        sessionRef.current?.cleanup?.();
      } catch {
        // Ignore cleanup errors
      }
      sessionRef.current = null;
      if (isMounted.current) setListening(false);
    }

    setPermissionState("requesting");

    try {
      const session = await startVoiceSession({
        language,
        continuous,
        interimResults,
        onStart: () => {
          if (!isMounted.current) return;
          setPermissionState("granted");
          setListening(true);
          onStart?.();
        },
        onResult: (text, isFinal) => {
          if (!isMounted.current) return;
          setTranscript(text);
          if (isFinal) onResult(text);
        },
        onError: (error: VoiceError) => {
          if (!isMounted.current) return;
          setListening(false);
          setLastError(error.code);
          if (error.code === "PERMISSION_DENIED") {
            setPermissionState("denied");
          } else {
            setPermissionState(getPermissionState());
          }
          onError?.(error.code);
        },
        onEnd: () => {
          if (!isMounted.current) return;
          setListening(false);
          onEnd?.();
        },
      });

      if (!isMounted.current) return;
      sessionRef.current = session;
      if (!session) {
        setListening(false);
        setPermissionState(getPermissionState() === "denied" ? "denied" : "idle");
      }
    } catch (error) {
      log("Error starting recognition", error);
      if (!isMounted.current) return;
      setListening(false);
      setPermissionState(getPermissionState());
      onError?.(error);
    } finally {
      isStartingRef.current = false;
    }
  }, [
    language,
    continuous,
    interimResults,
    listening,
    onResult,
    onError,
    onStart,
    onEnd,
    log,
    resetVoiceState,
  ]);

  const stopListening = useCallback(() => {
    stopVoiceSession();
    sessionRef.current?.cleanup?.();
    sessionRef.current = null;
    setListening(false);
    resetVoiceState();
  }, [resetVoiceState]);

  const abortListening = useCallback(() => {
    abortVoiceSession();
    sessionRef.current?.cleanup?.();
    sessionRef.current = null;
    setListening(false);
    resetVoiceState();
  }, [resetVoiceState]);

  return {
    listening,
    transcript,
    permissionState,
    lastError,
    startListening,
    stopListening,
    abortListening,
    resetVoiceState,
  };
};