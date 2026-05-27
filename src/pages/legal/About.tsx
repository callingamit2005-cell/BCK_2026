import { Link } from "react-router-dom"; 
import LegalLayout from "@/components/layout/LegalLayout";
import { useLanguage } from '@/contexts/LanguageContext';
import { featureFlags } from "@/config/featureFlags";
import { Award, ShieldCheck, Target, ArrowLeft, Gem, Zap } from "lucide-react"; 

const About = () => {
  const { t } = useLanguage();

  return (
    <LegalLayout title={t('about_title', 'About BachatKaro')}>
      <div className="space-y-10 animate-fade-in font-body pb-10">
        
        {/* 🔙 Home Button */}
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 text-[#111111] font-black hover:text-primary transition-all active:scale-[0.965] group"
          >
            <div className="p-3 rounded-full bg-surface group-hover:bg-primary/10 transition-colors">
              <ArrowLeft size={22} />
            </div>
            {t('btn_back_home', 'Home')}
          </Link>
        </div>

        {/* 🚀 Section 1: The Brand's Vision */}
        <section className="relative p-8 rounded-3xl bg-surface border-2 border-border overflow-hidden shadow-sm">
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold text-[#111111] mb-4 flex items-center gap-2">
              <Award className="text-primary" /> {t('about_vision_title', 'The Vision Behind BachatKaro')}
            </h2>
            <p className="text-[#111111] leading-relaxed text-lg font-medium">
              <strong>BachatKaro</strong> India ka sabse smart expense tracking platform hai. 
              Hamara maanna hai ki paisa bachana mushkil nahi hona chahiye. Isliye humne ek aisa tool banaya hai jo aapke daily kharche track karne mein madad karta hai, taaki aap apni mehnat ki kamai ko fizool kharchi se bacha sakein.
            </p>
          </div>
        </section>

        {/* 🎯 Section 2: Mission & Security */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 p-6 rounded-2xl border-2 border-border bg-background">
            <h3 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <Target className="text-primary" /> {t('about_mission_title', 'Our Mission')}
            </h3>
            <p className="text-[#111111] font-semibold leading-relaxed">
              Hamara mission simple hai: Har Hindustani ke liye finance ko aasan banana. 
              <strong> Bachat karega India, tabhi toh sapne pure karega India!</strong>
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl border-2 border-border bg-background">
            <h3 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="text-primary" /> {t('about_security_title', 'Bank-Grade Security')}
            </h3>
            <p className="text-[#111111] font-semibold leading-relaxed">
              Aapka data 100% secure hai. BachatKaro <strong>Bank-grade encryption</strong> use karta hai aur aapka data aapke device par hi process hota hai, taaki privacy hamesha bani rahe.
            </p>
          </div>
        </section>

        {/* 💎 Section 3: The Freemium Model (Naya Section for Clarity) */}
        {!featureFlags.hidePricing && (
          <section className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border-b-4 border-primary shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
                <Gem size={48} className="text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Simple & Transparent Pricing</h3>
                <p className="text-slate-300 font-medium leading-relaxed">
                  BachatKaro ka <span className="text-white font-bold underline decoration-primary">Basic Version hamesha FREE rahega</span>. 
                  Hum chahte hain ki har koi apna hisaab rakh sake. Extra power aur AI features ke liye humara **Premium Plan** available hai, jisme koi hidden charges nahi hain.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 💡 Section 4: Stats */}
        <section className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-8 bg-surface border-2 border-border rounded-2xl hover:border-primary/30 transition-all">
            <div className="text-4xl font-black text-[#111111] mb-2">100%</div>
            <p className="text-xs text-[#999999] uppercase tracking-widest font-bold">Secure Data</p>
          </div>
          <div className="text-center p-8 bg-primary rounded-2xl shadow-lg shadow-primary/20">
            <div className="text-4xl font-black text-white mb-2">
              {featureFlags.hidePricing ? "Beta Access" : "Freemium"}
            </div>
            <p className="text-xs text-white/80 uppercase tracking-widest font-bold">
              {featureFlags.hidePricing ? "Free During Beta" : "Basic is Always Free"}
            </p>
          </div>
          <div className="text-center p-8 bg-surface border-2 border-border rounded-2xl hover:border-primary/30 transition-all">
            <div className="text-4xl font-black text-[#111111] mb-2">₹5,000+</div>
            <p className="text-xs text-[#999999] uppercase tracking-widest font-bold">Monthly Savings</p>
          </div>
        </section>

        {/* 🤝 Section 5: Brand Promise */}
        <section className="text-center py-12 border-t-2 border-border">
          <p className="italic text-[#111111] text-xl max-w-2xl mx-auto font-bold leading-relaxed">
            "Hum jaante hain aapki mehnat ki kamai ke ek-ek rupaye ki keemat kya hai."
          </p>
          <div className="mt-6 font-display font-bold text-[#111111] text-2xl">— Team BachatKaro</div>
        </section>

      </div>
    </LegalLayout>
  );
};

export default About;
