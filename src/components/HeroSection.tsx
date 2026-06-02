import { Download, Globe } from "lucide-react";

const HeroSection = () => (
  <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
    {/* Clean background foundation */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-background opacity-40 blur-[120px] pointer-events-none" />

    <div className="relative z-10 max-w-4xl mx-auto space-y-10">
      {/* Badge - Premium Fintech Style */}
      <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-surface border border-border shadow-sm text-xs font-black uppercase tracking-wider animate-fade-in">
        <span className="w-2.5 h-2.5 rounded-full bg-foreground shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
        <span className="text-foreground">Verified by 1M+ Users</span>
      </div>

      {/* Heading - Absolute High Contrast */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-foreground uppercase">
          BachatKaro.
        </h1>
        <p className="text-3xl md:text-6xl font-black tracking-tight text-text-muted opacity-40 uppercase">
          Financial Intelligence. ✨
        </p>
      </div>

      <p className="text-sm md:text-lg text-text-muted font-black uppercase tracking-wider max-w-2xl mx-auto animate-fade-in leading-relaxed opacity-60" style={{ animationDelay: "0.3s" }}>
        India's elite financial operating system. Track, Audit, and Scale your wealth with forensic precision.
      </p>

      {/* CTA Buttons - Premium Monochrome */}
      <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in pt-6" style={{ animationDelay: "0.45s" }}>
        <button className="bg-foreground text-surface font-black px-10 py-5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl hover:bg-foreground/90 active:scale-[0.965] transition-all">
          <Globe className="w-5 h-5" />
          Access Terminal
        </button>
        <button className="bg-surface text-foreground border border-border font-black px-10 py-5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-sm hover:border-foreground/20 active:scale-[0.965] transition-all">
          <Download className="w-5 h-5" />
          Get Native APK
        </button>
      </div>
    </div>
  </section>
);

export default HeroSection;
