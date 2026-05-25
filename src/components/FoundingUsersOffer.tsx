import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const FoundingUsersOffer = () => {
  return (
    <section className="relative z-10 py-24 px-6 overflow-hidden">
      {/* Background glow effects matching the Index.tsx theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff0f7b]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[3rem] border border-[#ff0f7b]/30 bg-gradient-to-br from-[#ff0f7b]/10 to-[#5f0a87]/10 p-10 md:p-16 backdrop-blur-2xl text-center shadow-[0_0_50px_rgba(255,15,123,0.15)]">
          {/* Animated Sparkle */}
          <div className="absolute top-8 right-8 animate-pulse">
            <Sparkles className="h-8 w-8 text-[#ff0f7b]" />
          </div>

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff0f7b]/30 bg-[#ff0f7b]/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7bc0]">
            Limited Time Offer
          </span>

          <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white leading-tight">
            Founding Users Early Access
          </h3>
          
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed font-medium">
            Join early and help shape the future of AI-powered financial planning in India.
          </p>

          <button
            onClick={() => {
              const waitlist = document.getElementById("waitlist");
              waitlist?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-4 bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] text-white font-black uppercase tracking-[0.2em] text-sm px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(255,15,123,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            Get Early Access
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-[0.1em]">
            * All features are currently available during beta testing.
          </p>

          {/* Decorative Corner Gradients */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#5f0a87]/20 blur-3xl rounded-full" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff0f7b]/20 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default FoundingUsersOffer;
