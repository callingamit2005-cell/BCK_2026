import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const FoundingUsersOffer = () => {
  return (
    <section className="relative z-10 py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-10 md:p-16 backdrop-blur-2xl text-center shadow-sm">
          {/* Animated Sparkle */}
          <div className="absolute top-8 right-8 opacity-20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">
            Limited Time Opportunity
          </span>

          <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white leading-tight uppercase">
            Founding Access
          </h3>
          
          <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto leading-relaxed font-bold uppercase tracking-wide">
            Join the early network and define the evolution of AI-driven finance.
          </p>

          <button
            onClick={() => {
              const waitlist = document.getElementById("waitlist");
              waitlist?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-4 bg-white text-background font-black uppercase tracking-[0.2em] text-sm px-10 py-5 rounded-xl shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Claim Access
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-8 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
            * Full system capability enabled during beta cycle.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FoundingUsersOffer;
