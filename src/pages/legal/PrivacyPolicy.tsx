import LegalLayout from "@/components/layout/LegalLayout";

const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy">
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-slate-100 font-sans">
      
      {/* 📅 Date Badge */}
      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full mb-12 shadow-sm">
        Last Updated: March 2026
      </div>

      {/* 🛑 Section 1 */}
      <div className="mb-12 group">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-4 transition-all group-hover:text-primary">
          <span className="text-primary/30 text-5xl font-black bg-clip-text">1.</span> 
          Information We Collect
        </h2>
        <p className="text-slate-600 text-lg leading-relaxed font-medium pl-10 md:pl-14 border-l-4 border-transparent group-hover:border-primary/20 transition-all">
          At BachatKaro, we collect minimal data required to track your expenses, including salary inputs and transaction details you manually provide.
        </p>
      </div>

      {/* 🍪 Section 2 */}
      <div className="mb-12 group">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-4 transition-all group-hover:text-primary">
          <span className="text-primary/30 text-5xl font-black bg-clip-text">2.</span> 
          Google AdSense & Cookies
        </h2>
        <p className="text-slate-600 text-lg leading-relaxed font-medium pl-10 md:pl-14 border-l-4 border-transparent group-hover:border-primary/20 transition-all">
          We use Google AdSense to serve ads. Google uses cookies to serve ads based on a user's prior visits to our website.
        </p>
      </div>

      {/* 📞 Section 3 */}
      <div className="group">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-4 transition-all group-hover:text-primary">
          <span className="text-primary/30 text-5xl font-black bg-clip-text">3.</span> 
          Contact Us
        </h2>
        <p className="text-slate-600 text-lg leading-relaxed font-medium pl-10 md:pl-14 border-l-4 border-transparent group-hover:border-primary/20 transition-all">
          For any privacy concerns, email us at: <br className="md:hidden" />
          <strong className="inline-block mt-3 md:mt-0 text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 font-black tracking-wide cursor-pointer hover:bg-primary/10 transition-colors">
            help@bachatkaro.co.in
          </strong>.
        </p>
      </div>

    </div>
  </LegalLayout>
);

export default PrivacyPolicy;
