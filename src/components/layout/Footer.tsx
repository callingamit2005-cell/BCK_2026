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
  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF]";

  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 text-center md:text-left">
            <Link to="/" className="flex items-center justify-center md:justify-start gap-2 group">
              <div className={cn("p-2 rounded-xl text-white shadow-lg", primaryGradient)}>
                <PiggyBank size={24} />
              </div>
              <span className={cn("text-2xl font-black tracking-tighter bg-clip-text text-transparent", primaryGradient)}>
                BachatKaro
              </span>
            </Link>
            <div className="space-y-2 text-slate-500 font-medium text-sm">
              <p>India's most trusted AI wealth manager. Helping you save smartly.</p>
              <p className="text-[#EC4899] font-bold">help@bachatkaro.co.in</p>
            </div>
            <div className="flex justify-center md:justify-start gap-4">
              {[
                { Icon: Twitter, href: "https://x.com/bachatkaro", label: "X" },
                { Icon: Linkedin, href: "https://linkedin.com/company/bachatkaro", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-200 transition-all shadow-sm"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors">{t('about_title', 'About Us')}</Link></li>
              <li><Link to="/contact" className="text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors">{t('contact_title', 'Contact Us')}</Link></li>
              <li><Link to="/#faq" className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">FAQ</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6">Legal & Trust</h4>
            <ul className="space-y-4">
              {[
                { to: '/privacy-policy', label: t('footer_privacy', 'Privacy Policy') },
                { to: '/terms', label: t('footer_terms', 'Terms & Conditions') },
                { to: '/disclaimer', label: t('footer_disclaimer', 'Disclaimer') },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6">HQ</h4>
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-fit">
                <Globe size={16} className="text-purple-600" />
                <span className="text-sm font-black text-slate-700 italic uppercase tracking-wider">India</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            © {new Date().getFullYear()} BachatKaro. All rights reserved.
          </p>

          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-2 rounded-full border border-purple-100 shadow-sm">
            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">
              {t('footer_made_with_ORV', 'Made with love By ORV Technology')}
            </span>
            {/* 🚀 Extra Heart Component Removed from here */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
