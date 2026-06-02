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
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted mb-6">
          <Sparkles className="h-3 w-3" />
          Comparison
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 tracking-tight uppercase">
          Standard vs Elite
        </h2>
        <p className="text-text-muted text-lg max-w-2xl mx-auto font-bold uppercase tracking-wide">
          Evaluate the features available in each service tier.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-premium border border-border bg-background backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="py-8 px-8 text-xs font-bold uppercase tracking-wider text-text-muted">Capability</th>
                <th className="py-8 px-8 text-xs font-bold uppercase tracking-wider text-text-muted">Standard</th>
                <th className="py-8 px-8 text-xs font-black uppercase tracking-wider text-foreground">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {comparisonData.map((item, index) => (
                <tr key={index} className="group hover:bg-black/[0.02] transition-colors">
                  <td className="py-6 px-8 text-foreground font-bold text-sm uppercase tracking-wider">{item.feature}</td>
                  <td className="py-6 px-8 text-text-muted font-medium text-xs">
                    <div className="flex items-center gap-3">
                      {item.free === "Not Available" ? (
                        <Minus className="h-4 w-4 text-text-muted/20" />
                      ) : (
                        <Check className="h-4 w-4 text-text-muted/20" />
                      )}
                      {item.free}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-foreground font-bold text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-foreground" />
                      {item.premium}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 md:p-12 border-t border-border bg-background">
          <p className="text-center text-text-muted font-bold italic text-sm uppercase tracking-wider">
            "All system capabilities are currently unlocked during the beta cycle."
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
