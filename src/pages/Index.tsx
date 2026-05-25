import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Globe,
  Smartphone,
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
      
      // Full-page sparkle animation
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff0f7b", "#5f0a87", "#ffffff"],
      });

      toast({
        title: "Welcome to the waitlist! 🏆",
        description: `You're among our early users getting priority access.`,
        className:
          "bg-[#0a0014] border-[#ff0f7b] text-white shadow-[0_0_20px_rgba(255,15,123,0.4)]",
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
    <div className="dark">
      <div className="relative min-h-screen overflow-x-hidden bg-[#0a0014] font-sans text-white selection:bg-[#ff0f7b]/30">
        {/* 🌟 TRUE DARK NEON GLASS V2 – GPU‑accelerated layers */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-[-10%] h-[800px] w-full -translate-x-1/2 rounded-full bg-[#5f0a87]/10 blur-[150px] will-change-transform"
            style={{ transform: "translateZ(0)" }}
          />
          <div
            className="absolute right-[-10%] top-[20%] h-[600px] w-[600px] rounded-full bg-[#ff0f7b]/10 blur-[130px] will-change-transform"
            style={{ transform: "translateZ(0)" }}
          />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        </div>

        <AnnouncementBar />
        <Navbar />

        <main className="relative z-10 pt-12 md:pt-12">
          <Hero onJoinWaitlist={openCheckout} />

          {/* 🚀 BETA ANNOUNCEMENT SECTION */}
          <div className="mx-auto max-w-5xl px-6 py-12 text-center">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5 p-8 backdrop-blur-md">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                  BachatKaro Beta is Live 🚀
                </h3>
                <p className="text-slate-300 text-lg font-medium mb-2">
                  EARLY ACCESS — FREE DURING BETA
                </p>
                <p className="text-purple-400 text-sm font-bold uppercase tracking-widest">
                  You're not late. You're early.
                </p>
              </div>
            </div>
          </div>

          {/* Ad Section - Non-intrusive Glass */}
          <div className="mx-auto max-w-5xl px-6 py-4">
            <AdPlaceholder className="rounded-[2rem] border-white/5 bg-white/5 backdrop-blur-md" />
          </div>

          <StatsBar />

          {/* 🎯 WAITLIST SECTION: Conversion Engine */}
          <section id="waitlist" className="scroll-mt-24 px-6 py-32">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-[40px] md:p-16">
              {/* Dynamic Aura for Section */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,15,123,0.1),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(95,10,135,0.1),transparent_50%)] pointer-events-none" />

              <div className="relative z-10 text-center">
                <span className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#ff0f7b]/30 bg-[#ff0f7b]/10 px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-[#ff7bc0] shadow-[0_0_15px_rgba(255,15,123,0.2)]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Exclusive Alpha Access
                </span>

                  <h2 className="mb-6 text-5xl font-black tracking-tighter md:text-8xl">
                    Join the{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87]">
                      BachatKaro Family
                    </span>
                  </h2>

                <div className="mb-12 flex flex-col items-center justify-center gap-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#b3b3b3]">
                    Limited Early Access
                  </p>
                  {realtimeCount && (
                    <p className="text-pink-500 font-bold animate-pulse">
                      {realtimeCount.toLocaleString()}+ people already joined
                    </p>
                  )}
                </div>

                {founderEmail ? (
                  /* ✅ SUCCESS VIEW – fully visible, rest of page remains for exploration */
                  <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 rounded-[2.5rem] border border-[#ff0f7b]/40 bg-white/[0.06] p-10 shadow-[0_0_50px_rgba(255,15,123,0.2)] backdrop-blur-[32px]">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ff0f7b]/20 shadow-[0_0_20px_rgba(255,15,123,0.3)]">
                      <CheckCircle2 className="h-12 w-12 text-[#ff0f7b]" />
                    </div>
                    <h3 className="mb-6 text-5xl font-black text-white leading-tight">
                      You're on the list! 🚀
                    </h3>
                    <div className="mb-8 space-y-3">
                      <p className="mx-auto max-w-2xl text-2xl text-[#ff0f7b] font-black drop-shadow-[0_0_10px_rgba(255,15,123,0.3)]">
                        You’re among our early users getting priority access.
                      </p>
                    </div>

                    <div className="mt-8 mx-auto max-w-xl space-y-4 text-base text-slate-300 leading-relaxed text-left">
                      <div className="space-y-1">
                        <p>• Founder access is being released in controlled waves.</p>
                        <p>• You’ll be notified as soon as your access is ready.</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p>• Early access is FREE during beta.</p>
                        <p>• Premium will launch later with founder benefits.</p>
                      </div>

                      <p>• We respect your inbox — no spam, ever.</p>

                      <div className="pt-4 space-y-2">
                        <p className="text-white font-bold text-sm uppercase tracking-widest">Follow our journey:</p>
                        <div className="flex gap-4 text-xs">
                          <a href="https://www.facebook.com/profile.php?id=61585495950118" target="_blank" rel="noopener noreferrer" className="text-[#ff0f7b] hover:underline">Facebook</a>
                          <a href="https://x.com/bachatkaroapp" target="_blank" rel="noopener noreferrer" className="text-[#ff0f7b] hover:underline">X (Twitter)</a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 text-left max-w-xl mx-auto">
                      <p className="text-white font-bold text-xl">Ankit Praser</p>
                      <p className="text-[#ff0f7b] text-xs font-black uppercase tracking-widest">Founder, BachatKaro</p>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
                      <Link
                        to="/dashboard"
                        className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] px-10 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(255,15,123,0.4)] active:scale-[0.965]"
                        style={butterTransitionStyle}
                      >
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setFounderEmail(null)}
                        className="h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-black uppercase tracking-[0.2em] text-[#b3b3b3] hover:text-white hover:bg-white/10 active:scale-[0.965]"
                        style={butterTransitionStyle}
                      >
                        Invite Friends
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 🚀 CALL TO ACTION VIEW */
                  <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_0.8fr] lg:text-left">
                    <div className="rounded-[2.5rem] border border-white/10 bg-[#0a0014]/60 p-8 md:p-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff7bc0] mb-6">
                        The Founder Strategy
                      </p>
                      <div className="space-y-4">
                        {[
                          {
                            text: "Priority access for verified early members.",
                            icon: ShieldCheck,
                          },
                          {
                            text: "Verified status unlocks priority Android OTA.",
                            icon: Smartphone,
                          },
                          {
                            text: "Exclusive early bird benefits for lifetime.",
                            icon: Globe,
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-5 rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] hover:border-[#ff0f7b]/20"
                          >
                            <item.icon className="mt-1 h-6 w-6 shrink-0 text-[#ff7bc0]" />
                            <p className="text-base font-medium leading-relaxed text-slate-200">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-[2.5rem] border border-[#ff0f7b]/20 bg-white/[0.05] p-8 md:p-10 backdrop-blur-sm">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          Limited Availability
                        </p>
                        <h3 className="text-3xl font-black text-white leading-tight">
                          Founder Access closes when Wave 1 fills.
                        </h3>
                        <p className="text-base text-slate-400">
                          Secure your spot now and skip the 5000+ public queue
                          later.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openCheckout}
                        className="mt-12 flex h-16 w-full items-center justify-center gap-4 rounded-[1.5rem] bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] px-8 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_35px_rgba(255,15,123,0.3)] hover:scale-[1.02] active:scale-[0.965]"
                        style={butterTransitionStyle}
                      >
                        Secure My Spot Now
                        <ArrowRight className="h-5 w-5" />
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
            <AdPlaceholder className="rounded-[3rem] border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl" />
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
