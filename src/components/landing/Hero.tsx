import { Link } from "react-router-dom";
import { ArrowRight, Download, Globe, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { featureFlags } from "@/config/featureFlags";

type HeroProps = {
  onJoinWaitlist: () => void;
};

const Hero = ({ onJoinWaitlist }: HeroProps) => {
  const { t } = useLanguage();
  const launchBullets = featureFlags.hidePricing 
    ? [
        "Priority access to all features",
        "Early bird benefits for signups",
        "Priority onboarding for the first 5 K signups",
      ]
    : [
        "Secure Alpha Access",
        "Founder-member pricing before public drop",
        "Priority onboarding for the first 5 K signups",
      ];

  return (
    <section className="relative overflow-hidden px-6 md:px-8 pb-24 pt-32 text-center antialiased">
      <div className="relative z-10 mx-auto max-w-5xl space-y-12">
        
        {/* Trust Badge - Monochrome Glass */}
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-6 py-2.5 animate-fade-in backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-[#111111] opacity-40 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
            {t("hero_badge", "Verified by 100+ Early Adopters")}
          </span>
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {/* Main Title */}
          <h1 className="text-6xl font-black leading-[0.9] tracking-tighter text-[#111111] md:text-9xl uppercase">
            BachatKaro
          </h1>
          <p className="text-[#999999] py-2 text-4xl font-black tracking-tighter md:text-7xl uppercase">
            {t("hero_title", "Financial Logic. ✨")}
          </p>
        </div>

        {/* Subtitle */}
        <p
          className="mx-auto max-w-2xl animate-fade-in text-lg font-bold leading-relaxed text-[#999999] uppercase tracking-widest md:text-xl"
          style={{ animationDelay: "0.3s" }}
        >
          {t(
            "hero_sub",
            "The definitive system for expense tracking, wealth planning, and shared bill management for the modern Indian economy.",
          )}
        </p>

        {/* Main Info Card - High Integrity Surface */}
        <div
          className="mx-auto max-w-3xl rounded-[24px] border border-border bg-background p-6 md:p-10 text-left backdrop-blur-3xl animate-fade-in shadow-sm"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#999999]">Operational Status</p>
              <p className="mt-2 text-xl font-black text-[#111111] uppercase tracking-tighter">Initial Alpha Deployment</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#666666]">
              <Sparkles className="h-3.5 w-3.5" />
              Active System
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {launchBullets.map((bullet, index) => (
              <div
                key={bullet}
                className="stagger-fade rounded-xl border border-border bg-background p-5 hover:bg-black/[0.03] transition-all"
                style={{ animationDelay: `${0.12 * (index + 1)}s` }}
              >
                <p className="text-[10px] font-mono font-bold text-[#999999] leading-relaxed uppercase tracking-wider">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in pt-4" style={{ animationDelay: "0.45s" }}>
          <div className="flex flex-col items-center gap-6">
            <div className="flex w-full max-w-2xl flex-col gap-5 sm:flex-row sm:justify-center px-6">
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={onJoinWaitlist}
                className="flex items-center justify-center gap-4 rounded-xl bg-[#111111] px-10 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all duration-300 active:scale-[0.98] hover:bg-[#111111]/90"
              >
                Join Network
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Secondary Action Button */}
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-4 rounded-xl border border-border bg-background px-10 py-5 text-sm font-bold text-[#999999] backdrop-blur-xl cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Mobile APK
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
                  Pending Sync
                </span>
              </button>
            </div>

            {/* Links */}
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#999999] transition-all hover:text-[#111111]"
            >
              <Globe className="h-3.5 w-3.5" />
              {t("btn_open_web", "Launch Web Portal")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
