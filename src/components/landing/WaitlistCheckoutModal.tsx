import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { featureFlags } from "@/config/featureFlags";
import { supabase } from "@/integrations/supabase/client";
/* 
import {
  startVipWaitlistCheckout,
  type ProcessWaitlistResponse,
} from "@/services/vipWaitlistCheckout";
*/

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (email: string, count: number) => void;
}

const WaitlistCheckoutModal = ({ open, onOpenChange, onSuccess }: WaitlistCheckoutModalProps) => {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const submitLockedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      submitLockedRef.current = false;
      setIsProcessing(false);
      setShowSparkle(false);
    }
  }, [open]);

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLockedRef.current) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Invalid email", {
        description: "Enter a valid email address for your VIP waitlist access.",
      });
      return;
    }

    setShowSparkle(true);
    submitLockedRef.current = true;
    setIsProcessing(true);

    try {
      // 1. Check if user already joined (Database Check for Consistency)
      const { data: existingEntry, error: checkError } = await supabase
        .from("waitlist_users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (checkError) {
        console.error("Waitlist check error:", checkError);
      }

      if (existingEntry) {
        localStorage.setItem("waitlist_joined", "true");
        toast.info("You are already part of our family.");
        setIsProcessing(false);
        submitLockedRef.current = false;
        return;
      }

      // 2. DIRECT WAITLIST SUBMISSION (If not already joined)
      const { error: dbError } = await supabase
        .from("waitlist_users")
        .insert([{ email: normalizedEmail }]);

      if (dbError) throw dbError;

      const { data: countData, error: incError } = await supabase
        .rpc("increment_waitlist_count");

      if (incError) throw incError;

      localStorage.setItem("waitlist_joined", "true");

      // Trigger welcome email with dynamic count returned from RPC
      await supabase.functions.invoke("send-welcome-email", {
        body: { email: normalizedEmail, waitlistCount: countData },
        headers: {
          "x-api-key": import.meta.env.VITE_APP_SECRET_KEY || "",
        },
      });

      toast.success("Welcome to the waitlist! 🏆", {
        description: "You're on the waitlist. Early access will be shared soon.",
      });
      onSuccess(normalizedEmail, countData || 0);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "";
      if (errorMsg.toLowerCase().includes("duplicate") || errorMsg.toLowerCase().includes("unique")) {
        localStorage.setItem("waitlist_joined", "true");
        toast.info("You are already part of our family.");
      } else {
        toast.error("Submission failed", {
          description: error instanceof Error ? error.message : "Unable to join the waitlist.",
        });
      }
    } finally {
      setIsProcessing(false);
      submitLockedRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-md overflow-hidden border-none bg-transparent p-0 shadow-none sm:w-full">
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-surface shadow-2xl backdrop-blur-3xl">
          <div className="relative z-10 space-y-8 p-6 sm:p-10">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Priority Access Protocol
                </span>
              </div>

              <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">Secure Slot Activation</DialogTitle>
              <DialogDescription className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/40 leading-relaxed">
                Initialize your founding credentials for early system deployment.
              </DialogDescription>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Mail, label: "Identity Locked" },
                { icon: CheckCircle2, label: "Slot Reserved" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                >
                  <item.icon className="mb-2 h-4 w-4 text-white/40" />
                  <span className="text-center text-[8px] font-bold uppercase leading-tight tracking-widest text-white/20">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="space-y-8">
              <div className="space-y-3">
                <label className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                  Dispatch Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@network.com"
                  className="h-14 w-full rounded-xl bg-background border border-white/5 px-6 text-white font-mono text-sm outline-none transition-all placeholder:text-white/10 focus:border-white/20 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white text-background shadow-lg transition-all active:scale-[0.98] disabled:opacity-20 uppercase font-black tracking-widest text-xs"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </div>
                ) : (
                  <span>Activate My Access</span>
                )}
              </button>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 text-center">
                  <p className="mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-white">
                    Protocol Benefits
                  </p>
                  <ul className="space-y-3 text-[8px] font-bold tracking-[0.15em] text-white/40 uppercase">
                    <li>• Wave-0 Entry Authorization</li>
                    <li>• Founding Member status</li>
                    <li>• Early Feature Deployment</li>
                  </ul>
                </div>

                <p className="text-center text-[8px] leading-relaxed text-white/20 uppercase font-bold tracking-widest px-4">
                  By joining, you agree to the{" "}
                  <Link to="/terms" className="text-white hover:opacity-60 transition-opacity">
                    Operational Terms
                  </Link>
                  . Beta cycle access enabled.
                </p>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistCheckoutModal;
