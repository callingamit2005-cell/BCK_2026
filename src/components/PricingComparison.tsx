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
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 mb-6">
          <Sparkles className="h-3 w-3" />
          Comparison
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight uppercase">
          Standard vs Elite
        </h2>
        <p className="text-white/40 text-lg max-w-2xl mx-auto font-bold uppercase tracking-wide">
          Evaluate the features available in each service tier.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.01] backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="py-8 px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Capability</th>
                <th className="py-8 px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Standard</th>
                <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparisonData.map((item, index) => (
                <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 px-8 text-white font-bold text-sm uppercase tracking-widest">{item.feature}</td>
                  <td className="py-6 px-8 text-white/20 font-medium text-xs">
                    <div className="flex items-center gap-3">
                      {item.free === "Not Available" ? (
                        <Minus className="h-4 w-4 text-white/10" />
                      ) : (
                        <Check className="h-4 w-4 text-white/20" />
                      )}
                      {item.free}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-white font-bold text-xs uppercase tracking-widest">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-white" />
                      {item.premium}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 md:p-12 border-t border-white/10 bg-white/5">
          <p className="text-center text-white/40 font-bold italic text-sm uppercase tracking-widest">
            "All system capabilities are currently unlocked during the beta cycle."
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
