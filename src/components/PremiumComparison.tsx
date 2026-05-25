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
      {/* Background glow effects matching the Index.tsx theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff0f7b]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
            Free vs{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87]">
              Premium
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your financial journey. Upgrade to unlock
            AI-powered insights and automation.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-slate-500">
                    Feature
                  </th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-slate-200">
                    Free
                  </th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-[#ff7bc0]">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-8 font-bold text-slate-300">
                      {feature.name}
                    </td>
                    <td className="p-8 text-slate-400 font-medium">
                      <div className="flex items-center gap-3">
                        {feature.freeIcon || (
                          <Check className="h-5 w-5 text-slate-500/50" />
                        )}
                        {feature.free}
                      </div>
                    </td>
                    <td className="p-8 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-[#ff0f7b]" />
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
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[3rem] border border-[#ff0f7b]/30 bg-gradient-to-br from-[#ff0f7b]/10 to-[#5f0a87]/10 p-10 md:p-16 backdrop-blur-2xl text-center shadow-[0_0_50px_rgba(255,15,123,0.15)]">
          {/* Animated Sparkle */}
          <div className="absolute top-8 right-8 animate-pulse">
            <Sparkles className="h-8 w-8 text-[#ff0f7b]" />
          </div>

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff0f7b]/30 bg-[#ff0f7b]/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7bc0]">
            Limited Time Offer
          </span>

          <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
            Founding Users Launch Offer
          </h3>
          
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            First <span className="text-white font-bold">50,000 users</span> can unlock Premium for just{" "}
            <span className="text-white font-mono font-bold text-2xl px-2">₹1</span> as part of the BachatKaro Early Access program.
          </p>

          <button
            onClick={() => {
              const waitlist = document.getElementById("waitlist");
              waitlist?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-4 bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] text-white font-black uppercase tracking-[0.2em] text-sm px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(255,15,123,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            Get Premium for ₹1
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Decorative Corner Gradients */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#5f0a87]/20 blur-3xl rounded-full" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff0f7b]/20 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default PremiumComparison;
