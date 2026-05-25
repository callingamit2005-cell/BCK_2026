import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export const SuccessState = ({ email, count = 0 }: { email: string; count?: number }) => {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff0f7b", "#5f0a87", "#ffffff"],
    });
  }, []);

  const finalCount = 31000 + count;

  return (
    <div className="animate-in fade-in zoom-in duration-700 flex flex-col items-center justify-center min-h-[60vh] space-y-8 px-6 text-center">
      {/* Animated Icon Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#ff0f7b] blur-[50px] opacity-20 animate-pulse" />
        <div className="relative bg-[#0a0014] border border-[#ff0f7b]/40 rounded-full p-8 shadow-[0_0_40px_rgba(255,15,123,0.4)]">
          <CheckCircle2 className="w-20 h-20 text-[#ff0f7b] animate-bounce" />
        </div>
      </div>

      {/* Main Message */}
      <div className="space-y-4">
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          You're on the list! 🚀
        </h2>
        <p className="text-[#b3b3b3] text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
          Aapka spot secure ho gaya hai. Humne ek confirmation email <br />
          <span className="font-mono text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">{email}</span> par bhej diya hai.
        </p>
        <p className="text-[#ff0f7b] font-black text-2xl mt-4 drop-shadow-[0_0_10px_rgba(255,15,123,0.3)]">
          You’re among the first {finalCount.toLocaleString()}+ early signups.
        </p>
        
        <div className="mt-8 mx-auto max-w-xl space-y-4 text-sm text-[#888] leading-relaxed text-left">
          <div className="space-y-1">
            <p>• Founder access is being released in controlled waves.</p>
            <p>• You’ll be notified as soon as your access is ready.</p>
          </div>
          
          <div className="space-y-1">
            <p>• Early users are helping shape the product direction.</p>
            <p>• Early access members will receive exclusive 50% launch pricing.</p>
          </div>

          <p>• We respect your inbox — no spam, ever.</p>

          <div className="pt-4 space-y-2">
            <p className="text-white font-bold text-xs uppercase tracking-widest">Follow our journey:</p>
            <div className="flex gap-4 text-[10px]">
              <a href="https://www.facebook.com/profile.php?id=61585495950118" target="_blank" rel="noopener noreferrer" className="text-[#ff0f7b] hover:underline">Facebook</a>
              <a href="https://x.com/bachatkaroapp" target="_blank" rel="noopener noreferrer" className="text-[#ff0f7b] hover:underline">X (Twitter)</a>
            </div>
          </div>
        </div>

        <div className="mt-10 text-left max-w-xl mx-auto">
          <p className="text-white font-bold text-lg">Ankit Parasr</p>
          <p className="text-[#ff0f7b] text-[10px] font-black uppercase tracking-widest">Founder, BachatKaro</p>
        </div>
      </div>

      <button 
        onClick={() => window.location.href = '/dashboard'}
        className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-[0.965]"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </button>
    </div>
  );
};
