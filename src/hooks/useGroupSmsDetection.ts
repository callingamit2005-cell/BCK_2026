
import { useEffect, useRef, useState, useCallback } from 'react';
import { addSmsListener } from '@/integrations/smsBridge';
import { toast } from '@/hooks/use-toast';

interface Debt {
  from: string; // user_id
  to: string;   // user_id
  amount: number; // in paisa
}

interface Member {
  id: string;
  user_id: string;
  name: string;
}

interface ActivePayment {
  amount: number;
  toUserId: string;
  toUpiId: string;
  toName: string;
  timestamp: number;
}

export const useGroupSmsDetection = (
  debts: Debt[],
  members: Member[],
  onSettle: (fromName: string, toName: string, amount: number) => Promise<void>
) => {
  const [activePayment, setActivePayment] = useState<ActivePayment | null>(null);
  const debtsRef = useRef(debts);
  const membersRef = useRef(members);
  const activePaymentRef = useRef<ActivePayment | null>(null);

  useEffect(() => {
    debtsRef.current = debts;
    membersRef.current = members;
  }, [debts, members]);

  useEffect(() => {
    activePaymentRef.current = activePayment;
  }, [activePayment]);

  const trackPayment = useCallback((amount: number, toUserId: string) => {
    const targetMember = membersRef.current.find(m => m.user_id === toUserId || m.id === toUserId);
    const upiId = (targetMember as any)?.upi_id || null;
    const name = targetMember?.name || "User";

    if (import.meta.env.DEV) {
      console.log("🎯 [SMS DETECT] Tracking UPI Payment:", { amount, toUserId, upiId, name });
    }
    
    if (!upiId) {
        if (import.meta.env.DEV) {
          console.warn("⚠️ [SMS DETECT] Cannot track payment without valid UPI ID.");
        }
        return;
    }

    setActivePayment({
      amount,
      toUserId,
      toUpiId: upiId,
      toName: name,
      timestamp: Date.now()
    });
  }, []);

  useEffect(() => {
    let listener: any = null;
    let isMounted = true;

    const initListener = async () => {
      const l = await addSmsListener('newTransaction', async (data: any) => {
        if (!isMounted) return;
        const now = Date.now();
        const currentActive = activePaymentRef.current;

        // 🛡️ 1. CHECK: Is there an active payment window?
        if (!currentActive) {
          console.log("ℹ️ [SMS DETECT] SMS received but no active payment being tracked.");
          return;
        }

        // 🛡️ 2. CHECK: Time limit (2 minutes)
        if (now - currentActive.timestamp > 120000) {
          if (import.meta.env.DEV) {
            console.log("⚠️ [SMS DETECT] Tracking window expired. Resetting state.");
          }
          setActivePayment(null);
          return;
        }

        if (import.meta.env.DEV) {
          console.log("🚀 [SMS DETECT] Incoming SMS Data:", data);
        }
        
        const message = (data.message || "").toLowerCase();
        const smsAmount = Number(data.amount); // amount in paisa
        const smsMerchant = (data.merchantName || "").toLowerCase();

        // 🛡️ 3. CHECK: Keywords (Debit detection)
        const keywords = ["debited", "paid", "upi", "sent to", "transfer to"];
        const hasKeyword = keywords.some(k => message.includes(k));

        if (!hasKeyword) {
          console.log("ℹ️ [SMS DETECT] IGNORE: No debit/payment keywords found.");
          return;
        }

        // 🛡️ 4. CHECK: Amount Match (Strict 1 rupee tolerance)
        const isAmountMatch = Math.abs(currentActive.amount - smsAmount) < 100;
        if (!isAmountMatch) {
          console.log("❌ [SMS DETECT] MISMATCH (Amount):", { expected: currentActive.amount, received: smsAmount });
          return;
        }

        // 🛡️ 5. CHECK: Receiver Validation (Name or UPI ID fragment)
        const vpaFragment = currentActive.toUpiId.split('@')[0].toLowerCase();
        const targetName = currentActive.toName.toLowerCase();
        
        const isReceiverMatch = 
          message.includes(vpaFragment) || 
          message.includes(targetName) || 
          smsMerchant.includes(vpaFragment) || 
          smsMerchant.includes(targetName);

        if (!isReceiverMatch) {
          console.log("❌ [SMS DETECT] MISMATCH (Receiver): SMS message/merchant does not contain receiver name or VPA fragment.", {
            expectedName: targetName,
            expectedVPA: vpaFragment,
            smsMessage: message,
            smsMerchant: smsMerchant
          });
          return;
        }

        // 🛡️ 6. CHECK: Ambiguity Check
        const ambiguousDebts = debtsRef.current.filter(d => Math.abs(d.amount - smsAmount) < 100);
        if (ambiguousDebts.length > 1) {
          console.warn("⚠️ [SMS DETECT] AMBIGUITY: Multiple debts with same amount. Matching against active user intent only.");
        }

        // ✨ FINAL VERIFICATION SUCCESS
        const toMember = membersRef.current.find(m => m.user_id === currentActive.toUserId);
        if (toMember) {
          const matchingDebt = debtsRef.current.find(d => d.to === currentActive.toUserId && Math.abs(d.amount - currentActive.amount) < 100);
          const fromName = matchingDebt ? (membersRef.current.find(m => m.user_id === matchingDebt.from)?.name || "User") : "User";

          console.log("✅ [SMS DETECT] SECURITY VERIFIED. Auto-settling:", {
            to: toMember.name,
            amount: smsAmount,
            method: "Verified SMS Intent"
          });

          toast({
            title: "Payment Verified! ✅",
            description: `Auto-settled ₹${(smsAmount / 100).toFixed(2)} to ${toMember.name}`,
            className: "bg-emerald-600 text-white font-bold"
          });

          setActivePayment(null); // Prevents double processing
          await onSettle(fromName, toMember.name, currentActive.amount);
        }
      });
      if (isMounted) {
        listener = l;
      }
    };

    initListener();

    return () => {
      isMounted = false;
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [onSettle]);

  return { trackPayment };
};
