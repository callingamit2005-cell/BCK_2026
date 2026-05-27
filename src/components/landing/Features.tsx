import { Mic, Bell, Users, Smartphone, Scan, WifiOff } from "lucide-react";

const Features = () => {
  // Using Mock Data matching the new Dark Neon UI
  const features = [
    { 
      icon: <Mic className="h-6 w-6 text-[#999999]" />, 
      title: "Voice Logic", 
      desc: "Instant expense extraction via natural language processing. No manual interface required." 
    },
    { 
      icon: <Bell className="h-6 w-6 text-[#999999]" />, 
      title: "Active Monitoring", 
      desc: "Automated commitment tracking for loans and recurring liabilities. Zero-miss due dates." 
    },
    { 
      icon: <Users className="h-6 w-6 text-[#999999]" />, 
      title: "Network Sync", 
      desc: "Unified ledger management for multi-device environments and shared family budgeting." 
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-[#111111] mb-6 tracking-tight uppercase">
          System Core
        </h2>
        <p className="text-[#999999] text-lg max-w-2xl mx-auto font-bold uppercase tracking-wide">
          Engineered for high-integrity personal finance management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {features.map((f, i) => (
          <div 
            key={i} 
            className="group relative bg-background border border-border p-8 rounded-[24px] backdrop-blur-md transition-all duration-500 hover:bg-black/[0.02] overflow-hidden"
          >
            <div className="relative z-10">
              <div className="bg-background border border-border w-14 h-14 rounded-xl flex items-center justify-center mb-8 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-xl font-black text-[#111111] mb-4 tracking-tighter uppercase">{f.title}</h3>
              <p className="text-[11px] text-[#999999] leading-relaxed font-bold uppercase tracking-widest">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Exclusive Features Section */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-background p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Smartphone className="h-32 w-32 text-[#111111]" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#999999] mb-10">
            <Smartphone className="h-3.5 w-3.5" />
            Endpoint Exclusives
          </div>
          
          <h3 className="text-3xl font-black text-[#111111] mb-10 tracking-tighter uppercase">Native Mobile Capabilities</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center">
                  <Scan className="h-4.5 w-4.5 text-[#999999]" />
                </div>
                <h4 className="text-lg font-black text-[#111111] uppercase tracking-tighter">SMS Auto-Sync</h4>
              </div>
              <p className="text-[11px] text-[#999999] leading-relaxed font-bold uppercase tracking-widest pl-14">
                Automated detection of transactional SMS packets with immediate conversion to ledger entries. Zero manual overhead.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center">
                  <WifiOff className="h-4.5 w-4.5 text-[#999999]" />
                </div>
                <h4 className="text-lg font-black text-[#111111] uppercase tracking-tighter">Offline Persistence</h4>
              </div>
              <p className="text-[11px] text-[#999999] leading-relaxed font-bold uppercase tracking-widest pl-14">
                Full-stack operation without active network connection. Guaranteed sync upon session resumption.
              </p>
            </div>
          </div>
          
          <p className="mt-12 text-[8px] font-bold text-[#999999]/20 uppercase tracking-[0.3em] border-t border-border pt-8">
            * Capability restricted to Android endpoints built with Capacitor.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;