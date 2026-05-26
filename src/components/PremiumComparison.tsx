import React from "react";
import { Check, X, Sparkles, ArrowRight } from "lucide-react";

const PremiumComparison = () => {
  const features = [
    {
      name: "Expense Entry",
      free: "Manual Entry",
      premium: "AI Voice + SMS Auto Detect",
      isPremiumBetter: true,
    },
    {
      name: "Analytics",
      free: "Monthly Summary",
      premium: "AI Financial Health Score + Wealth Prediction",
      isPremiumBetter: true,
    },
    {
      name: "Trip Planning",
      free: "Manual Planning",
      premium: "AI Generated Travel Plans",
      isPremiumBetter: true,
    },
    {
      name: "Groups",
      free: "Equal Split",
      premium: "Bill Roulette + Smart Settlement",
      isPremiumBetter: true,
    },
    {
      name: "Savings Goals",
      free: "Maximum 3 Goals",
      premium: "Unlimited Goals + AI Progress Tips",
      isPremiumBetter: true,
    },
    {
      name: "Reports",
      free: "Not Available",
      premium: "PDF / Excel Export",
      isPremiumBetter: true,
      freeIcon: <X className="h-5 w-5 text-red-500/50" />,
    },
    {
      name: "UI",
      free: "Standard Theme",
      premium: "Premium Themes",
      isPremiumBetter: true,
    },
    {
      name: "Support",
      free: "Standard Support",
      premium: "Priority Support",
      isPremiumBetter: true,
    },
  ];

  return (
    <section id="pricing" className="relative z-10 py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
            Free vs Premium
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto font-bold uppercase tracking-wide">
            Select the tier that aligns with your financial velocity.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.01] backdrop-blur-xl mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                    Capability
                  </th>
                  <th className="p-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Standard
                  </th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-8 text-xs font-bold text-white/60 uppercase tracking-widest">
                      {feature.name}
                    </td>
                    <td className="p-8 text-xs text-white/20 font-medium">
                      <div className="flex items-center gap-3">
                        {feature.freeIcon || (
                          <Check className="h-4 w-4 text-white/10" />
                        )}
                        {feature.free}
                      </div>
                    </td>
                    <td className="p-8 text-xs font-bold text-white uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-white" />
                        {feature.premium}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Early Access Launch Offer Block */}
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 md:p-16 text-center shadow-sm">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">
            Founder Initiative
          </span>

          <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 uppercase">
            Initial Access Offer
          </h3>
          
          <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto leading-relaxed font-bold uppercase tracking-wide">
            First <span className="text-white">50,000 users</span> secure Elite tier for <span className="text-white font-mono">₹1</span> as part of the founding network.
          </p>

          <button
            onClick={() => {
              const waitlist = document.getElementById("waitlist");
              waitlist?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-4 bg-white text-background font-black uppercase tracking-[0.2em] text-sm px-10 py-5 rounded-xl shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Claim Elite for ₹1
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PremiumComparison;
