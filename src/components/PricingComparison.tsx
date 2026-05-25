import React from 'react';
import { Check, Minus, Sparkles } from 'lucide-react';

const PricingComparison = () => {
  const comparisonData = [
    { feature: "Expense Entry", free: "Manual Entry", premium: "AI Voice + SMS Auto Detect" },
    { feature: "Analytics", free: "Monthly Summary", premium: "AI Health Score + Wealth Prediction" },
    { feature: "Trip Planning", free: "Manual Planning", premium: "AI Generated Travel Plans" },
    { feature: "Groups", free: "Equal Split", premium: "Bill Roulette + Smart Settlement" },
    { feature: "Savings Goals", free: "Max 3 Goals", premium: "Unlimited Goals + AI Advice" },
    { feature: "Reports", free: "Not Available", premium: "PDF / Excel Export" },
    { feature: "UI", free: "Standard Theme", premium: "Premium Themes" },
    { feature: "Support", free: "Standard Support", premium: "Priority Support" },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="pricing">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ff0f7b]/30 bg-[#ff0f7b]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff7bc0] mb-6">
          <Sparkles className="h-3 w-3" />
          Comparison
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Core vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87]">Premium Features</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
          Compare what is available for free and what will be part of Premium in the future.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-8 px-8 text-sm font-black uppercase tracking-widest text-slate-400">Feature</th>
                <th className="py-8 px-8 text-sm font-black uppercase tracking-widest text-white">Core (Basic)</th>
                <th className="py-8 px-8 text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87]">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparisonData.map((item, index) => (
                <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 px-8 text-white font-bold text-lg md:text-xl tracking-tight">{item.feature}</td>
                  <td className="py-6 px-8 text-slate-400 font-medium text-base md:text-lg">
                    <div className="flex items-center gap-3">
                      {item.free === "Not Available" ? (
                        <Minus className="h-5 w-5 text-slate-600" />
                      ) : (
                        <Check className="h-5 w-5 text-slate-500" />
                      )}
                      {item.free}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-slate-200 font-bold text-base md:text-lg">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-[#ff0f7b]" />
                      {item.premium}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 md:p-12 border-t border-white/10 bg-white/[0.03]">
          <p className="text-center text-slate-400 font-bold italic text-lg md:text-xl">
            "All features are currently available during beta testing. Premium plans will be introduced later."
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
