import { Mic, Bell, Users, Smartphone, Scan, WifiOff } from "lucide-react";

const Features = () => {
  // Using Mock Data matching the new Dark Neon UI
  const features = [
    { 
      icon: <Mic className="h-7 w-7 text-[#EC4899]" />, 
      title: "Voice Entry", 
      desc: "Speak to add expenses instantly. No typing required! Just say '50 rupees for tea'." 
    },
    { 
      icon: <Bell className="h-7 w-7 text-[#7C3AED]" />, 
      title: "Smart EMI Alerts", 
      desc: "Never miss a due date. Get automated reminders for all your loans and split bills." 
    },
    { 
      icon: <Users className="h-7 w-7 text-purple-400" />, 
      title: "Family Sync", 
      desc: "Manage your family budget together. Real-time sync across all your devices." 
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EC4899]">BachatKaro?</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
          Everything you need to master your personal finance, wrapped in a beautiful, lightning-fast dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {features.map((f, i) => (
          <div 
            key={i} 
            className="group relative bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-md hover:bg-white/[0.06] hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(124,58,237,0.15)] overflow-hidden"
          >
            {/* Subtle background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/0 to-[#EC4899]/0 group-hover:from-[#7C3AED]/10 group-hover:to-[#EC4899]/10 transition-colors duration-500" />
            
            <div className="relative z-10">
              <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Exclusive Features Section */}
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.02] p-8 md:p-12 backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <Smartphone className="h-32 w-32 text-purple-500 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-8">
            <Smartphone className="h-3 w-3" />
            Mobile Exclusive Features
          </div>
          
          <h3 className="text-3xl font-black text-white mb-8 tracking-tight">Available Only in App</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Scan className="h-4 w-4 text-purple-400" />
                </div>
                <h4 className="text-xl font-bold text-white">SMS Auto Expense Detection</h4>
              </div>
              <p className="text-slate-400 leading-relaxed font-medium pl-11">
                Automatically reads bank transaction SMS and converts them into expenses. No manual entry needed for your card or UPI payments.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                  <WifiOff className="h-4 w-4 text-[#EC4899]" />
                </div>
                <h4 className="text-xl font-bold text-white">Offline Expense Logging</h4>
              </div>
              <p className="text-slate-400 leading-relaxed font-medium pl-11">
                Users can add expenses even without internet connection. Data syncs automatically once the device reconnects.
              </p>
            </div>
          </div>
          
          <p className="mt-12 text-sm font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-8">
            Note: These features are only available in the mobile app version built with Capacitor.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;