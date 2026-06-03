import { Link } from "react-router-dom";
import { ArrowRight, Download, Globe, Sparkles, CheckCircle2, Zap, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { featureFlags } from "@/config/featureFlags";

type HeroProps = {
  onJoinWaitlist: () => void;
};

const Hero = ({ onJoinWaitlist }: HeroProps) => {
  const { t } = useLanguage();

  const launchBullets = featureFlags.hidePricing
    ? [
        { icon: <Zap className="h-5 w-5 text-[#ff0f7b]" />, title: "Voice + SMS Tracking", desc: "Bol do ya message aaye — expense auto-add ho jayega" },
        { icon: <Gift className="h-5 w-5 text-[#ff0f7b]" />, title: "Early Bird — Free Forever", desc: "Pehle 5K users ko premium features hamesha free milenge" },
        { icon: <CheckCircle2 className="h-5 w-5 text-[#ff0f7b]" />, title: "Priority Onboarding", desc: "Personal setup call — hamare team se seedha" },
      ]
    : [
        { icon: <Zap className="h-5 w-5 text-[#ff0f7b]" />, title: "Secure Alpha Access", desc: "Invite-only wave mein sabse pehle andar aao" },
        { icon: <Gift className="h-5 w-5 text-[#ff0f7b]" />, title: "Founder Pricing — Lock Now", desc: "Public launch se pehle lowest price permanently lock karo" },
        { icon: <CheckCircle2 className="h-5 w-5 text-[#ff0f7b]" />, title: "Priority Onboarding", desc: "Pehle 5K signups ko personal setup milega" },
      ];

  return (
    <section className="relative overflow-hidden px-6 md:px-8 pb-20 pt-32 text-center">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(95,10,135,0.15)_0%,transparent_70%)] blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] bg-[#ff0f7b]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-10">

        {/* Trust Badge */}
        <div className="inline-flex items-center gap-3 rounded-full border border-[#ff0f7b]/[0.35] bg-white/[0.06] px-6 py-3 text-sm font-semibold animate-fade-in backdrop-blur-[32px]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ff0f7b] shadow-[0_0_10px_#ff0f7b]" />
          <span className="text-xs uppercase tracking-wide text-[#b3b3b3]">
            {t("hero_badge", "100+ Founders Already Joined ❤️")}
          </span>
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h1 className="text-6xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-neon-bloom md:text-8xl">
            BachatKaro.
          </h1>
          <p className="animate-neon-flash bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] bg-clip-text py-2 text-4xl font-black tracking-tighter text-transparent drop-shadow-neon-bloom md:text-7xl">
            {t("hero_title", "सपने पूरे करो। ✨")}
          </p>
        </div>

        {/* Subtitle — pain-point focused */}
        <p
          className="mx-auto max-w-2xl animate-fade-in text-lg font-medium leading-relaxed text-[#b3b3b3] md:text-xl"
          style={{ animationDelay: "0.3s" }}
        >
          {t(
            "hero_sub",
            "Har rupaye ka hisaab — voice se, SMS se, ya manual. India ka sabse smart expense tracker, ek app mein.",
          )}
        </p>

        {/* — PRIMARY CTA — placed BEFORE the info card so user sees it first */}
        <div className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <button
            type="button"
            onClick={onJoinWaitlist}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] px-12 py-5 text-xl font-black text-white shadow-[0_0_40px_rgba(255,15,123,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,15,123,0.6)] active:scale-[0.965]"
          >
            {t("join_waitlist", "Free Mein Register Karo →")}
          </button>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#ff0f7b]/70">
            ✦ Sirf pehle 5,000 founders ke liye — abhi {" "}
            <span className="text-[#ff0f7b]">spots limited hain</span>
          </p>
        </div>

        {/* What you get — 3 benefit cards */}
        <div
          className="mx-auto max-w-3xl animate-fade-in"
          style={{ animationDelay: "0.45s" }}
        >
          {/* Card header */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-4 backdrop-blur-[32px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#b3b3b3]">Register karke kya milega?</p>
            </div>
            <div className="launch-pulse inline-flex items-center gap-2 rounded-full border border-[#ff0f7b]/[0.35] bg-[#ff0f7b]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              <Sparkles className="h-4 w-4 text-[#ff0f7b]" />
              Launching Soon
            </div>
          </div>

          {/* Benefit tiles */}
          <div className="grid gap-3 md:grid-cols-3">
            {launchBullets.map((bullet, index) => (
              <div
                key={bullet.title}
                className="stagger-fade flex flex-col gap-3 rounded-2xl border border-[#ff0f7b]/[0.25] bg-[#0a0014]/80 p-5 text-left hover:border-[#ff0f7b]/50 transition-colors duration-300"
                style={{ animationDelay: `${0.12 * (index + 1)}s` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff0f7b]/20 bg-[#ff0f7b]/10">
                  {bullet.icon}
                </div>
                <p className="text-sm font-black text-white">{bullet.title}</p>
                <p className="text-xs leading-relaxed text-[#b3b3b3]">{bullet.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary actions */}
        <div className="animate-fade-in pt-2" style={{ animationDelay: "0.55s" }}>
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#ff0f7b]/[0.25] bg-white/[0.04] px-8 py-4 text-base font-semibold text-[#b3b3b3] backdrop-blur-[32px]"
            >
              <Download className="h-5 w-5" />
              {t("btn_download_apk", "Android App")}
              <span className="ml-1 font-bold text-pink-400 animate-pulse text-sm">
                Coming Soon 🚀
              </span>
            </button>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#b3b3b3] transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {t("btn_open_web", "Already registered? Open Web App →")}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
