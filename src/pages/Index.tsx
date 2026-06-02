import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Globe,
  Smartphone,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { featureFlags } from "@/config/featureFlags";
import { supabase } from "@/integrations/supabase/client";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

// Internal Components
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import PricingComparison from "@/components/PricingComparison";
import FoundingUsersOffer from "@/components/FoundingUsersOffer";
import FAQ from "@/components/landing/FAQ";
import BlogGrid from "@/components/landing/BlogGrid";
import WaitlistCheckoutModal from "@/components/landing/WaitlistCheckoutModal";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import StatsBar from "@/components/StatsBar";
import AdPlaceholder from "@/components/AdPlaceholder";
import Footer from "@/components/layout/Footer";
import confetti from "canvas-confetti";

// Custom easing for butter‑soft interactions (matches design system)
const BUTTER_CUBIC = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [founderEmail, setFounderEmail] = useState<string | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // 💳 EXTERNAL REDIRECT HANDLER: Triggers Checkout from Protected Pages
  useEffect(() => {
    if (searchParams.get("checkout") === "true") {
      setIsCheckoutOpen(true);
      // Clean up URL parameter to avoid repeated popups
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // SEO Optimization
  useSeoMeta(
    "BachatKaro | Smart Indian Expense Tracker",
    "Track expenses, plan trips, and save more with BachatKaro. The best AI-powered financial companion for modern Indians."
  );

  // Refs for robust anchor scrolling
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollAttemptsRef = useRef(0);
  const MAX_SCROLL_ATTEMPTS = 30; // 3 seconds with 100ms interval

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from("stats")
        .select("waitlist_count")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        setRealtimeCount(data.waitlist_count);
      } else if (error) {
        console.warn("Stats fetch failed:", error.message);
      }
    };

    fetchCount();

    // PERIODIC POLLING (Replaces Real-time Sync for Scalability)
    const interval = setInterval(fetchCount, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * ⚓ ROBUST ANCHOR SCROLLING (handles late DOM rendering)
   */
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");

    const attemptScroll = () => {
      if (typeof window === "undefined") return;
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Clear interval and reset attempts on success
        if (scrollIntervalRef.current) {
          window.clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
        scrollAttemptsRef.current = 0;
      } else {
        scrollAttemptsRef.current++;
        if (scrollAttemptsRef.current >= MAX_SCROLL_ATTEMPTS) {
          // Element not found after max attempts – clean up silently
          if (scrollIntervalRef.current) {
            window.clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
          scrollAttemptsRef.current = 0;
        }
      }
    };

    // Try immediately in case element already exists
    attemptScroll();

    // Set interval to keep trying
    if (!scrollIntervalRef.current && typeof window !== "undefined") {
      scrollIntervalRef.current = window.setInterval(attemptScroll, 100);
    }

    return () => {
      if (scrollIntervalRef.current && typeof window !== "undefined") {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      scrollAttemptsRef.current = 0;
    };
  }, [location.hash]);

  /**
   * 🖱️ INTERACTION HANDLERS (memoized)
   */
  const openCheckout = useCallback(() => {
    trackEvent("waitlist_cta_clicked", { source: "landing_main" });
    setIsCheckoutOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(
    (email: string, count: number) => {
      setFounderEmail(email);
      setWaitlistCount(count);
      trackEvent("founder_onboarding_complete", { domain: email.split("@")[1] });
      
      // Full-page institutional celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563EB", "#4F46E5", "#ffffff"],
      });

      toast({
        title: "Welcome to the waitlist! 🏆",
        description: `You're among our early users getting priority access.`,
        className:
          "bg-surface border-border/40 text-foreground shadow-institutional font-black uppercase text-[10px] tracking-widest",
      });
    },
    [toast]
  );

  // 🛡️ ZERO FLICKER AUTH GUARD
  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Style factory for butter‑soft buttons
  const butterTransitionStyle = {
    transition: `transform 0.3s ${BUTTER_CUBIC}`,
  };

  return (
    <div className="bg-background text-foreground selection:bg-institutional-blue/10 font-sans">
      <div className="relative min-h-screen overflow-x-hidden">
        {/* 🌟 PREMIUM MINIMAL DEPTH */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(var(--text-muted)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>

        <AnnouncementBar />
        <Navbar />

        <main className="relative z-10 pt-12 md:pt-12">
          <Hero onJoinWaitlist={openCheckout} />

          {/* 🚀 BETA ANNOUNCEMENT SECTION */}
          <div className="mx-auto max-w-5xl px-6 py-12 text-center">
            <div className="relative overflow-hidden rounded-premium border border-border/40 bg-surface p-10 shadow-premium transition-all hover:border-institutional-blue/20">
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3 uppercase tracking-tighter leading-tight">
                  BachatKaro Beta is Live 🚀
                </h3>
                <p className="text-text-secondary text-lg font-medium uppercase tracking-wide mb-2 opacity-80">
                  Exclusive Initial Access
                </p>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  The future of Indian finance starts here.
                </p>
              </div>
            </div>
          </div>

          {/* Ad Section - Non-intrusive Glass */}
          <div className="mx-auto max-w-5xl px-6 py-4">
            <AdPlaceholder className="rounded-premium border-border/40 bg-surface shadow-premium" />
          </div>

          <StatsBar />

          {/* 🎯 WAITLIST SECTION: Conversion Engine */}
          <section id="waitlist" className="scroll-mt-24 px-6 py-32">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-modal border border-border/40 bg-surface p-8 md:p-20 shadow-institutional">
              <div className="relative z-10 text-center">
                <span className="mb-8 inline-flex items-center gap-3 rounded-full border border-border/40 bg-background px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  <Sparkles className="h-3.5 w-3.5 text-institutional-blue" />
                  Exclusive Alpha Network
                </span>

                  <h2 className="mb-6 text-5xl font-black tracking-tighter md:text-8xl uppercase text-foreground leading-none">
                    Join the Family
                  </h2>

                <div className="mb-12 flex flex-col items-center justify-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
                    Limited Availability Window
                  </p>
                  {realtimeCount && (
                    <p className="text-institutional-blue font-black uppercase tracking-widest text-[10px] animate-pulse">
                      {realtimeCount.toLocaleString()}+ Members Synced
                    </p>
                  )}
                </div>

                {founderEmail ? (
                  /* ✅ SUCCESS VIEW – fully visible, rest of page remains for exploration */
                  <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 rounded-modal border border-border/40 bg-background p-10 shadow-institutional">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-premium bg-surface border border-border/40 shadow-premium transition-transform hover:scale-105">
                      <CheckCircle2 className="h-12 w-12 text-institutional-blue" />
                    </div>
                    <h3 className="mb-6 text-4xl font-black text-foreground leading-tight uppercase tracking-tighter">
                      Verified Identity
                    </h3>
                    <div className="mb-10 space-y-3">
                      <p className="mx-auto max-w-2xl text-xl text-text-secondary font-medium uppercase tracking-wide opacity-80">
                        Priority access protocols initialized.
                      </p>
                    </div>

                    <div className="mt-8 mx-auto max-w-xl space-y-8 text-[10px] uppercase font-black tracking-widest text-text-secondary leading-relaxed text-left opacity-80">
                      <div className="space-y-4 border-l-2 border-border/40 pl-8">
                        <p>• Wave-based access deployment active.</p>
                        <p>• Notification will be dispatched upon slot activation.</p>
                        <p>• Beta cycle maintains zero-cost status.</p>
                        <p>• Founding credentials secured for future updates.</p>
                      </div>

                      <div className="pt-8 border-t border-border/40 space-y-4">
                        <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.2em]">Operational Channels:</p>
                        <div className="flex gap-8">
                          <a href="https://www.facebook.com/profile.php?id=61585495950118" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-institutional-blue transition-colors underline underline-offset-4 decoration-border/40 font-black">Meta</a>
                          <a href="https://x.com/bachatkaroapp" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-institutional-blue transition-colors underline underline-offset-4 decoration-border/40 font-black">X Terminal</a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 text-left max-w-xl mx-auto border-t border-border/40 pt-10">
                      <p className="text-foreground font-black text-xl tracking-tight">ANKIT PRASER</p>
                      <p className="text-institutional-blue text-[10px] font-black uppercase tracking-[0.2em]">Chief Architect, BachatKaro</p>
                    </div>

                    <div className="mt-14 flex flex-col items-center justify-center gap-6 sm:flex-row">
                      <Link
                        to="/dashboard"
                        className="group flex h-16 items-center justify-center gap-4 rounded-xl bg-foreground px-12 text-[10px] font-black uppercase tracking-widest text-surface shadow-institutional active:scale-[0.98] transition-all hover:bg-foreground/90"
                      >
                        Enter Console
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setFounderEmail(null)}
                        className="h-16 items-center justify-center rounded-xl border border-border/40 bg-surface px-10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-foreground hover:border-foreground active:scale-[0.98] transition-all shadow-sm"
                      >
                        Refer Network
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 🚀 CALL TO ACTION VIEW */
                  <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_0.8fr] lg:text-left">
                    <div className="rounded-modal border border-border/40 bg-background p-8 md:p-12 shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-10 opacity-60">
                        The Founder Protocol
                      </p>
                      <div className="space-y-8">
                        {[
                          {
                            text: "Priority clearance for verified network members.",
                            icon: ShieldCheck,
                          },
                          {
                            text: "Early-stage OTA deployment for Android endpoints.",
                            icon: Smartphone,
                          },
                          {
                            text: "Lifetime operational benefits for early adopters.",
                            icon: Globe,
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-8 rounded-2xl border border-border/40 bg-surface p-6 transition-all hover:border-institutional-blue/20 shadow-premium"
                          >
                            <item.icon className="h-6 w-6 shrink-0 text-institutional-blue mt-0.5" />
                            <p className="text-sm font-black uppercase tracking-tight leading-relaxed text-foreground opacity-90">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-modal border border-border/40 bg-surface p-8 md:p-12 shadow-premium">
                      <div className="space-y-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
                          Slot Allocation
                        </p>
                        <h3 className="text-3xl font-black text-foreground leading-tight uppercase tracking-tighter">
                          Wave 1 Access Closes Soon.
                        </h3>
                        <p className="text-sm font-medium uppercase tracking-wider text-text-secondary leading-relaxed opacity-80">
                          Secure your endpoint now and bypass the global queue in subsequent cycles.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openCheckout}
                        className="mt-14 flex h-18 w-full items-center justify-center gap-4 rounded-xl bg-foreground px-8 text-[10px] font-black uppercase tracking-widest text-surface shadow-institutional hover:bg-foreground/90 active:scale-[0.98] transition-all"
                      >
                        Secure My Slot
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <Features />
          <PricingComparison />
          <FoundingUsersOffer />
          <BlogGrid />

          {/* Bottom Ad / Partner Section */}
          <div className="mx-auto max-w-5xl px-6 py-20">
            <AdPlaceholder className="rounded-premium border-border/40 bg-surface shadow-premium" />
          </div>

          <FAQ />
        </main>

        <Footer />

        {/* 💳 MODAL: Razorpay Orchestrator – onSuccess is memoized */}
        <WaitlistCheckoutModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default Index;
