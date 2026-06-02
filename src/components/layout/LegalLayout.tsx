import Footer from "./Footer";
import AppHeader from "./AppHeader";

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background selection:bg-institutional-blue/10">
    <AppHeader />
    <main className="max-w-4xl mx-auto px-6 py-32">
      <div className="bg-surface rounded-modal p-8 md:p-16 shadow-institutional border border-border/40 relative overflow-hidden">
        {/* Institutional Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-institutional-blue opacity-20" />
        
        <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-12 border-b border-border/20 pb-10 uppercase">
          {title}
        </h1>
        <div className="prose prose-invert max-w-none text-text-secondary font-medium leading-relaxed prose-headings:text-foreground prose-headings:font-black prose-headings:uppercase prose-strong:text-foreground">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalLayout;
