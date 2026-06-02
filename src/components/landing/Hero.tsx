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
    <section className="relative overflow-hidden px-6 md:px-8 pb-20 pt-32 text-center">
      {/* Background Orbs - Updated to Neon Purple and Dynamic Pink */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(95,10,135,0.15)_0%,transparent_70%)] blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] bg-[#ff0f7b]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-10">
        
        {/* Trust Badge - Glassmorphism with Hot Neon Edges and Silver Mist Label */}
        <div className="inline-flex items-center gap-3 rounded-full border border-[#ff0f7b]/[0.35] bg-white/[0.06] px-6 py-3 text-sm font-semibold animate-fade-in backdrop-blur-[32px]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ff0f7b] shadow-[0_0_10px_#ff0f7b]" />
          <span className="text-xs uppercase tracking-wide text-[#b3b3b3]">
            {t("hero_badge", "Trusted by 100+ Beta Testers ❤️")}
          </span>
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {/* Main Title with Neon Bloom */}
          <h1 className="text-6xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-neon-bloom md:text-8xl">
            BachatKaro.
          </h1>
          <p className="animate-neon-flash bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] bg-clip-text py-2 text-4xl font-black tracking-tighter text-transparent drop-shadow-neon-bloom md:text-7xl">
            {t("hero_title", "Sapne Pure Karo. ✨")}
          </p>
        </div>

        {/* Subtitle in Silver Mist */}
        <p
          className="mx-auto max-w-2xl animate-fade-in text-lg font-medium leading-relaxed text-[#b3b3b3] md:text-xl"
          style={{ animationDelay: "0.3s" }}
        >
          {t(
            "hero_sub",
            "India's smartest way to track expenses, build savings habits, and achieve your financial goals — all in one app.",
          )}
        </p>

        {/* Main Info Card - High Refraction Glass */}
        <div
          className="mx-auto max-w-3xl rounded-[32px] border border-[#ff0f7b]/[0.35] bg-white/[0.06] p-6 md:p-8 text-left backdrop-blur-[32px] animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#b3b3b3]">Alpha Launch Momentum</p>
              <p className="mt-2 text-lg font-semibold text-white">Founder access is opening in controlled waves.</p>
            </div>
            <div className="launch-pulse inline-flex items-center gap-2 rounded-full border border-[#ff0f7b]/[0.35] bg-[#ff0f7b]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              <Sparkles className="h-4 w-4 text-[#ff0f7b]" />
              ✨ Launching Soon
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {launchBullets.map((bullet, index) => (
              <div
                key={bullet}
                className="stagger-fade rounded-2xl border border-[#ff0f7b]/[0.35] bg-[#0a0014]/80 p-6"
                style={{ animationDelay: `${0.12 * (index + 1)}s` }}
              >
                {/* Data in Monospaced White */}
                <p className="text-sm font-mono text-white leading-6">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in pt-2" style={{ animationDelay: "0.45s" }}>
          <div className="flex flex-col items-center gap-5">
            <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center p-6 md:p-8">
              {/* Primary Action Button - Butter Soft Touch Physics */}
              <button
                type="button"
                onClick={onJoinWaitlist}
                className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] px-10 py-5 text-lg font-bold text-white shadow-[0_0_30px_rgba(255,15,123,0.4)] transition-all duration-300 ease-butter-soft hover:scale-105 active:scale-[0.965]"
              >
                <ArrowRight className="h-6 w-6" />
                {t("join_waitlist", "Free Registration Early")}
              </button>

              {/* Secondary Action Button - Glassmorphism */}
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#ff0f7b]/[0.35] bg-white/[0.06] px-10 py-5 text-lg font-bold text-[#b3b3b3] backdrop-blur-[32px]"
              >
                <Download className="h-6 w-6" />
                {t("btn_download_apk", "Download Android App with Premium")}
                <span className="ml-2 font-bold text-pink-400 animate-pulse">
                  COMING SOON 🚀
                </span>
              </button>
            </div>

            {/* Links in Silver Mist */}
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#b3b3b3] transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {t("btn_open_web", "Open Web App")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
