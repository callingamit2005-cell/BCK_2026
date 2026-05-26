/**
 * Footer.tsx - BachatKaro Live Launch Edition
 * UI: High-Contrast Light Mode with Signature Purple/Pink Gradients.
 * Logic: Production routing links enabled for all footer destinations.
 */

import { Link } from "react-router-dom";
import { PiggyBank, ShieldCheck, Globe, Twitter, Linkedin } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from "@/lib/utils";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-background border-t border-white/5 pt-16 pb-12 font-sans overflow-hidden antialiased">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 text-center md:text-left">
            <Link to="/" className="flex items-center justify-center md:justify-start gap-3 group">
              <div className={cn("p-2 rounded-xl bg-white text-background shadow-lg transition-transform group-hover:scale-105")}>
                <PiggyBank size={24} />
              </div>
              <span className={cn("text-2xl font-black tracking-tighter text-white uppercase")}>
                Bachat<span className="text-white/40">Karo</span>
              </span>
            </Link>
            <div className="space-y-2 text-white/40 font-bold text-[10px] uppercase tracking-widest">
              <p>India's definitive AI wealth management system.</p>
              <p className="text-white">OPERATIONAL HQ: INDIA</p>
            </div>
            <div className="flex justify-center md:justify-start gap-4">
              {[
                { Icon: Twitter, href: "https://x.com/bachatkaro", label: "X Terminal" },
                { Icon: Linkedin, href: "https://linkedin.com/company/bachatkaro", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-sm"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">System</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors">{t('about_title', 'About')}</Link></li>
              <li><Link to="/contact" className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors">{t('contact_title', 'Contact')}</Link></li>
              <li><Link to="/#faq" className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">Documentation</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Protocol</h4>
            <ul className="space-y-4">
              {[
                { to: '/privacy-policy', label: t('footer_privacy', 'Privacy Policy') },
                { to: '/terms', label: t('footer_terms', 'Terms & Conditions') },
                { to: '/disclaimer', label: t('footer_disclaimer', 'Disclaimer') },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Verification</h4>
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit">
                <Globe size={14} className="text-white/40" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Endpoint</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/10">
            © {new Date().getFullYear()} BachatKaro Archive. All systems nominal.
          </p>

          <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-lg border border-white/5 shadow-sm">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {t('footer_made_with_ORV', 'Engineered by ORV Technology')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
