// src/voice/integrations/useSplitAIVoice.ts
// Enterprise‑grade hook that connects voice recognition to split‑expense form fields.
// Uses useVoiceController for lifecycle management and parseGroupVoice for AI parsing.
// Logic untouched – only comments and formatting enhanced.

import { useCallback, useRef, useEffect } from "react";
import { useVoiceController } from "../core/useVoiceController";
import { parseGroupVoice, type GroupMemberLike } from "@/services/voiceExpenseParser";

export interface SplitAIVoiceOptions {
  /** BCP‑47 language code for speech recognition */
  language: string;
  /** Setter for the expense title field */
  setTitle: (v: string) => void;
  /** Setter for the amount field */
  setAmount: (v: string) => void;
  /** Optional setter for paidByMemberId (if the member is found) */
  setPaidByMemberId?: (id: string) => void;
  /** Setter for paidBy name (fallback if member ID not resolved) */
  setPaidBy: (v: string) => void;
  /** List of group members for name‑to‑ID mapping */
  membersList?: GroupMemberLike[];
  /** Optional callback triggered when silence timeout ends (auto‑save) */
  autoSave?: (text: string) => void;
  /** Silence timeout in milliseconds (default 10000) */
  silenceTimeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * useSplitAIVoice
 *
 * A specialized voice hook for the group expense "Add Expense" form.
 * It listens to voice input, parses the transcript using the AI‑powered
 * `parseGroupVoice` function (which also maps member names to IDs), and
 * updates the corresponding form fields.
 * 
 * Note: The split type is intentionally left untouched (default "equal")
 * because voice parsing of split types is too error‑prone.
 * 
 * @returns The same return as `useVoiceController`: an object containing
 *          voice state, transcript, permission info, and start/stop functions.
 */
export const useSplitAIVoice = ({
  language,
  setTitle,
  setAmount,
  setPaidByMemberId,
  setPaidBy,
  membersList = [],
  autoSave,
  silenceTimeout = 10000,
  debug = false,
}: SplitAIVoiceOptions) => {
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
        const parsed = parseGroupVoice(text, membersList);
        if (!isMounted.current) return;

        if (parsed.title) setTitle(parsed.title);
        if (parsed.amount !== undefined) setAmount(parsed.amount.toString());
        if (parsed.paidByMemberId && setPaidByMemberId) {
          setPaidByMemberId(parsed.paidByMemberId);
        } else if (parsed.paidByName) {
          setPaidBy(parsed.paidByName);
        }
        // Split must remain unchanged (default Equal), so do not map split by voice.
      } catch (err) {
        if (!isMounted.current) return;
        console.error("Unexpected error in split voice handler", err);
        setTitle(text);
      }
    },
    [membersList, setTitle, setAmount, setPaidByMemberId, setPaidBy, log]
  );

  const voice = useVoiceController({
    language,
    onResult: handleResult,
    autoSave,
    silenceTimeout,
    debug,
  });

  useEffect(() => {
    log("Listening state changed:", voice.listening);
  }, [voice.listening, log]);

  return voice;
};