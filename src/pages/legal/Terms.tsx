import LegalLayout from "@/components/layout/LegalLayout";

const Terms = () => (
  <LegalLayout title="Terms of Service">
    <div className="max-w-4xl mx-auto bg-surface p-8 md:p-12 rounded-modal shadow-premium border-2 border-border/40 font-sans">
      
      {/* ⚖️ Section 1 */}
      <div className="mb-12 group">
        <h2 className="text-2xl md:text-3xl font-black text-foreground mb-4 tracking-tight flex items-center gap-4 transition-all group-hover:text-primary">
          <span className="text-primary/30 text-5xl font-black bg-clip-text">1.</span> 
          Use of Service
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed font-medium pl-10 md:pl-14 border-l-4 border-transparent group-hover:border-primary/20 transition-all">
          BachatKaro is a personal finance tracking tool. We do not provide official financial or investment advice.
        </p>
      </div>

      {/* 👤 Section 2 */}
      <div className="group">
        <h2 className="text-2xl md:text-3xl font-black text-foreground mb-4 tracking-tight flex items-center gap-4 transition-all group-hover:text-primary">
          <span className="text-primary/30 text-5xl font-black bg-clip-text">2.</span> 
          User Responsibility
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed font-medium pl-10 md:pl-14 border-l-4 border-transparent group-hover:border-primary/20 transition-all">
          You are responsible for the accuracy of the salary and EMI data you enter in the dashboard.
        </p>
      </div>

    </div>
  </LegalLayout>
);

export default Terms;
