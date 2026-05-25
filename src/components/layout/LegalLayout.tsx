import Footer from "./Footer";
import AppHeader from "./AppHeader";

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50">
    <AppHeader />
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-white">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-12 border-b pb-8">
          {title}
        </h1>
        <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalLayout;