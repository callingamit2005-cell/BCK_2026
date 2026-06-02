import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const FoundingUsersOffer = () => {
  return (
    <section className="relative z-10 py-16 px-6 overflow-hidden">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-6 md:p-10 text-center shadow-sm">
          {/* Animated Sparkle */}
          <div className="absolute top-6 right-6 opacity-20">
            <Sparkles className="h-6 w-6 text-foreground" />
          </div>

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Limited Time Opportunity
          </span>

          <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-foreground leading-tight uppercase">
            Founding Access
          </h3>
          
          <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto leading-relaxed font-bold uppercase tracking-wide">
            Join the early network and define the evolution of AI-driven finance.
          </p>

          <button
            onClick={() => {
              const waitlist = document.getElementById("waitlist");
              waitlist?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-4 bg-foreground text-surface font-black uppercase tracking-wider text-xs px-8 py-4 rounded-xl shadow-lg hover:bg-foreground/90 active:scale-[0.98] transition-all"
          >
            Claim Access
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-8 text-text-muted text-xs font-bold uppercase tracking-wider">
            * Full system capability enabled during beta cycle.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FoundingUsersOffer;
