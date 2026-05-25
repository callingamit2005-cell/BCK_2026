import { Download, Globe } from "lucide-react";

const HeroSection = () => (
  <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
    {/* Radial glow behind hero */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(263_70%_58%/0.12),transparent_70%)] pointer-events-none" />

    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-body animate-fade-in">
        <span className="w-2 h-2 rounded-full gradient-brand glow-brand-sm animate-neon-pulse" />
        <span className="text-foreground">1M+ Indians Saving Daily</span>
      </div>

      {/* Heading */}
      <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight text-foreground">
          BachatKaro.
        </h1>
        <p className="text-4xl md:text-6xl font-bold font-display tracking-tight gradient-brand-text animate-neon-pulse">
          Sapne Pure Karo. ✨
        </p>
      </div>

      <p className="text-lg text-muted-foreground font-body max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
        India's smartest way to track expenses, build savings habits, and achieve your financial goals — all in one app.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.45s" }}>
        <button className="gradient-brand glow-brand text-primary-foreground font-display font-semibold px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform">
          <Globe className="w-5 h-5" />
          Open Web App
        </button>
        <button className="glass-card text-foreground font-display font-semibold px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform">
          <Download className="w-5 h-5" />
          Download APK
        </button>
      </div>
    </div>
  </section>
);

export default HeroSection;
