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
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,15,123,0.35)] bg-white/[0.06] shadow-[0_0_60px_rgba(10,0,20,0.8)] backdrop-blur-[32px] sm:rounded-[2.5rem]">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#ff0f7b] blur-[80px]" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#5f0a87] blur-[80px]" />
          </div>

          <div className="relative z-10 space-y-6 bg-[#0a0014]/90 p-6 sm:space-y-8 sm:p-8">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#ff0f7b]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#b3b3b3]">
                  VIP Waitlist Access
                </span>
              </div>

              <DialogTitle className="neon-bloom text-3xl sm:text-4xl uppercase">JOIN BACHATKARO FAMILY</DialogTitle>
              <DialogDescription className="px-2 text-xs leading-relaxed text-[#b3b3b3] sm:text-sm">
                Unlock early access and stay ahead of the public launch.
              </DialogDescription>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Mail, label: "Email Locked" },
                { icon: CheckCircle2, label: "Spot Reserved" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-[#ff0f7b]/30"
                >
                  <item.icon className="mb-2 h-5 w-5 text-[#ff0f7b]" />
                  <span className="text-center text-[9px] font-bold uppercase leading-tight tracking-tight text-[#b3b3b3]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b3b3b3]">
                  Email Destination
                </label>
                <div className="rounded-2xl border border-[#ff0f7b]/35 bg-white/[0.06] p-[1px] shadow-[0_0_18px_rgba(255,15,123,0.12)]">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="h-14 w-full rounded-[15px] bg-[#14041f] px-6 text-white outline-none transition-all duration-300 ease-butter-soft placeholder:text-white/20 focus:bg-white/[0.04] focus:ring-1 focus:ring-[#ff0f7b]/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-soft relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] text-white shadow-[0_0_28px_rgba(255,15,123,0.3)] active:scale-[0.965] disabled:cursor-not-allowed disabled:opacity-70 group"
              >
                {showSparkle && (
                  <>
                    <Sparkles className="absolute left-4 top-4 h-4 w-4 animate-ping text-white/40" />
                    <Sparkles className="absolute right-4 bottom-4 h-4 w-4 animate-ping text-white/40" />
                    <Sparkles className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 animate-bounce text-white/60" />
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {isProcessing ? (
                  <span className="animate-soft-pulse inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 shadow-[0_0_24px_rgba(255,15,123,0.35)]">
                    <Loader2 className="h-5 w-5 animate-spin text-white drop-shadow-[0_0_12px_rgba(255,15,123,0.8)]" />
                    <span className="text-sm font-black uppercase tracking-[0.15em] text-white">
                      Processing...
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    SECURE MY EARLY ACCESS
                  </span>
                )}
              </button>

              <div className="space-y-4 px-2">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#ff0f7b]">
                    🚀 You're officially on the waitlist
                  </p>
                  <ul className="space-y-2 text-[10px] font-bold tracking-wide text-[#b3b3b3]">
                    <li>• Priority access before public launch</li>
                    <li>• Early user perks & founder benefits</li>
                    <li>• First access to all new features</li>
                  </ul>
                  <p className="mt-3 text-[10px] italic text-[#b3b3b3]/60">
                    Your invite is coming soon.
                  </p>
                </div>

                <p className="text-center text-[10px] leading-tight text-[#b3b3b3]/70">
                  By joining, you agree to our{" "}
                  <Link to="/terms" className="text-white underline transition-colors hover:text-[#ff0f7b]">
                    Terms
                  </Link>
                  . * All features are currently available during beta testing.
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
