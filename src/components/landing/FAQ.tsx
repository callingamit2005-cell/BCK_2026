import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      question: t('faq_q1', "Is BachatKaro completely free?"),
      answer: t('faq_a1', "Yes! The core expense tracking and family budgeting features are 100% free with no hidden charges."),
    },
    {
      question: t('faq_q2', "When will BachatKaro be available on the Google Play Store?"),
      answer: t('faq_a2', "BachatKaro is built to help India save smarter. Our goal is simple — make money management easy, intelligent, and accessible for everyone. We are continuously improving the app across platforms. The Android version will soon be available on the Play Store for a seamless experience. Bachat karega India, tabhi toh sapne pure karega India 🇮🇳"),
    },
    {
      question: t('faq_q3', "How is my financial data secured?"),
      answer: t('faq_a3', "We use bank-grade encryption. Your SMS data is processed locally on your device by our advanced SMS Engine and is never read directly by our servers."),
    },
    {
      question: t('faq_q4', "Why don't you give Reward Points or Cashbacks?"),
      answer: t('faq_a4', "Because we focus on REAL savings, not marketing gimmicks. Cashbacks psychologically trick you into spending more. Our goal is to help you save a solid ₹5,000+ every month."),
    },
    {
      question: t('faq_q5', "How is BachatKaro different from other apps?"),
      answer: t('faq_a5', "No clutter, no annoying ads forcing you to take personal loans. Just a clean, automated dashboard for your family's budget, trip splitting, and smart EMI tracking."),
    },
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-background antialiased">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black text-center mb-6 text-[#111111] tracking-tighter uppercase">
          {t('faq_title_1', 'Operational')} <span className="text-[#999999]">{t('faq_title_2', 'Queries')}</span>
        </h2>
        <p className="text-center text-[#999999] text-lg md:text-xl mb-16 max-w-2xl mx-auto font-bold uppercase tracking-wide">
          {t('faq_sub', 'Essential documentation for BachatKaro utilization.')}
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-6 bg-background backdrop-blur-sm data-[state=open]:border-[#111111]/20 data-[state=open]:bg-white transition-all duration-300"
            >
              <AccordionTrigger className="text-left text-lg font-black text-[#111111] uppercase tracking-tighter hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#666666] text-sm font-medium leading-relaxed pb-6 uppercase tracking-widest opacity-80">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
