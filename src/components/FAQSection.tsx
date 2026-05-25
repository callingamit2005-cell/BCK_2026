import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Is BachatKaro free to use?", a: "Yes! BachatKaro is completely free with optional premium features for power users who want advanced analytics and family budgeting tools." },
  { q: "How does the savings tracker work?", a: "Simply set your savings goals, and our AI-powered engine automatically categorizes your transactions, suggests optimizations, and tracks your progress in real-time." },
  { q: "Is my financial data safe?", a: "Absolutely. We use bank-grade 256-bit AES encryption, and your data never leaves Indian servers. We are RBI-compliant and ISO 27001 certified." },
  { q: "Can I export my data?", a: "Yes, you can export all your financial data in CSV, PDF, or JSON format anytime. Your data belongs to you." },
  { q: "Do you support UPI tracking?", a: "Yes! BachatKaro integrates with all major UPI apps including GPay, PhonePe, and Paytm for automatic transaction tracking." },
];

const FAQSection = () => (
  <section className="py-16 px-6" id="faq">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12 text-foreground">
        Frequently Asked <span className="gradient-brand-text">Questions</span>
      </h2>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="glass-card rounded-xl px-6 border-border">
            <AccordionTrigger className="font-display font-semibold text-foreground text-left hover:no-underline hover:gradient-brand-text py-5">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground font-body pb-5">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
