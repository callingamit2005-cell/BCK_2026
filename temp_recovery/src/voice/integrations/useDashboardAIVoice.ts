/**
 * Voice Expense Flow Explanation:
 * ================================
 * This hook integrates the voice controller with the dashboard form.
 * 
 * - `handleResult` receives the final transcript, uses `useSmartParser` to parse
 *   it into structured data, and updates the form fields.
 * - The controller returns `voice` object with `status`, `listening`, `transcript`,
 *   `start`, and `stop`. The component should watch `status`:
 *   - `"listening"`: microphone active, show indicator.
 *   - `"done"`: expense parsed and fields updated; show confirmation prompt.
 *   - `"idle"`: no active session.
 * 
 * After `status` becomes `"done"`, the component should ask the user if they want
 * to add another expense. If yes, call `voice.start()` again (which resets fields);
 * if no, call `voice.stop()` and close the modal.
 */

import { useCallback, useRef, useEffect } from "react";
import { useVoiceController } from "../core/useVoiceController";
import { useSmartParser } from "../core/useSmartParser";

interface DashboardAIVoiceOptions {
  language: string;
  setAmount: (v: string) => void;
  setCategory: (v: string) => void;
  setPaymentMode: (v: string) => void;
  setNote: (v: string) => void;
  autoSave?: (text: string) => void; // called automatically when final transcript is available
}

export const useDashboardAIVoice = ({
  language,
  setAmount,
  setCategory,
  setPaymentMode,
  setNote,
  autoSave,
}: DashboardAIVoiceOptions) => {
  const { parseWithAI } = useSmartParser();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleResult = useCallback(
    async (text: string) => {
      try {
        const result = await parseWithAI(text);
        if (!isMounted.current) return;

        if (result.success) {
          // AI‑parsed data
          if (result.data.amount !== undefined) {
            setAmount(result.data.amount.toString());
          }
          if (result.data.category) {
            setCategory(result.data.category);
          }
          if (result.data.paymentMode) {
            setPaymentMode(result.data.paymentMode);
          }
          // Dashboard doesn't have paidBy field – ignore if present.
        } else {
          // Fallback data (only amount and title guaranteed)
          if (result.fallback.amount !== undefined) {
            setAmount(result.fallback.amount.toString());
          }
          // Fallback may also have category/paymentMode if enhanced fallback was used
          if (result.fallback.category) {
            setCategory(result.fallback.category);
          }
          if (result.fallback.paymentMode) {
            setPaymentMode(result.fallback.paymentMode);
          }
          console.warn("Using fallback parser due to:", result.error);
        }
        // Always set the raw note (full transcript)
        setNote(text);
      } catch (err) {
        if (!isMounted.current) return;
        console.error("Unexpected error in voice result handler", err);
        setNote(text); // still set the note as fallback
      }
    },
    [parseWithAI, setAmount, setCategory, setPaymentMode, setNote]
  );

  const voice = useVoiceController({
    language,
    onResult: handleResult,
    autoSave,
  });

  return voice;
};