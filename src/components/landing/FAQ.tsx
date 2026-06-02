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
    <section id="faq" className="py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto"> {/* 🛠️ Width thodi badhai hai */}
        <h2 className="text-4xl md:text-6xl font-black text-center mb-6 text-white tracking-tighter">
          {t('faq_title_1', 'Frequently Asked')} <span className="text-primary">{t('faq_title_2', 'Questions')}</span>
        </h2>
        <p className="text-center text-slate-400 text-lg md:text-xl mb-16 max-w-2xl mx-auto font-medium">
          {t('faq_sub', 'Everything you need to know about BachatKaro.')}
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              // 🛠️ Padding 'px-8' ki hai aur border ko thoda bold kiya hai
              className="border-2 border-white/5 rounded-2xl px-8 bg-card/50 backdrop-blur-sm data-[state=open]:border-primary/50 data-[state=open]:bg-card transition-all duration-300"
            >
              {/* 🛠️ Text size 'text-xl' aur 'font-bold' kiya hai */}
              <AccordionTrigger className="text-left text-xl md:text-2xl font-bold text-white hover:no-underline py-7">
                {faq.question}
              </AccordionTrigger>
              {/* 🛠️ Answer ka size 'text-lg' kiya hai readability ke liye */}
              <AccordionContent className="text-slate-300 text-lg md:text-xl leading-relaxed pb-7">
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
