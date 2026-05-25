/**
 * Navbar.tsx - BachatKaro Enterprise Edition
 * UI: High-Contrast Light Mode with Signature Purple/Pink Gradients.
 * 🛡️ LOGIC LOCK: Routing, Hash-links, and Language logic 100% untouched.
 * ✅ FEATURES: Glassmorphic Blur, Neon Brand Text, High-Visibility Navigation.
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils"; // ✅ Added for seamless enterprise styling

const Navbar = () => {
  const { setShowLanguageModal, language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 🛠️ LOGIC ENGINE (UNTOUCHED)
  const closeMenu = () => setOpen(false);
  const toLandingAnchor = (anchor: string) =>
    location.pathname === "/" ? anchor : `/${anchor}`;

  // ==================== PREMIUM UI SYSTEM ====================
  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF]";
  const navBackground = "bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm";
  const linkStyle = "text-sm font-black uppercase tracking-widest text-slate-600 hover:text-[#EC4899] transition-all duration-300";
  const mobileLinkStyle = "block text-base font-black uppercase tracking-widest text-slate-700 hover:text-[#EC4899] py-2";

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-[100] transition-all duration-500", navBackground)}>
      {/* Signature Top Accent Line */}
      <div className={cn("h-1 w-full", primaryGradient)} />
      
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 md:py-5">
        
        {/* 🏢 Brand Logo - High Contrast Neon */}
        <Link to="/" className="relative group">
          <span className={cn("text-2xl font-black tracking-tighter bg-clip-text text-transparent group-hover:scale-105 transition-transform inline-block", primaryGradient)}>
            BachatKaro
          </span>
          <div className={cn("absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300", primaryGradient)} />
        </Link>

        {/* 💻 DESKTOP MENU - Crystal Clear */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-7 mr-4">
            <Link to={toLandingAnchor("#features")} className={linkStyle}>
              {t('nav_features', 'Features')}
            </Link>
            <Link to="/blog" className={linkStyle}>
              {t('nav_blog', 'Blog')}
            </Link>
            <Link to={toLandingAnchor("#faq")} className={linkStyle}>
              {t('nav_faq', 'FAQ')}
            </Link>
            
            <Link to="/about" className={linkStyle}>
              {t('about_title', 'About')}
            </Link>
            
            <Link to="/contact" className={linkStyle}>
              {t('contact_title', 'Contact')}
            </Link>
          </div>
          
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            {/* 🌐 Desktop Language Button - Glassmorphic */}
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors bg-slate-50 hover:bg-purple-50 px-3 py-2 rounded-xl border border-slate-200"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-[10px] font-black tracking-widest">{language}</span>
            </button>

            {/* 🚀 Primary CTA Button */}
            <Link 
              to="/auth" 
              className={cn(
                "text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all",
                primaryGradient
              )}
            >
              {t('nav_get_started', 'Login / Signup')}
            </Link>
          </div>
        </div>

        {/* 📱 MOBILE TOGGLE BUTTON */}
        <button 
          className="md:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU - High Contrast Glass */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[69px] bg-white/95 backdrop-blur-3xl border-b border-slate-200 px-6 py-8 space-y-6 shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="space-y-4">
            <Link to={toLandingAnchor("#features")} onClick={closeMenu} className={mobileLinkStyle}>
              {t('nav_features', 'Features')}
            </Link>
            <Link to="/blog" onClick={closeMenu} className={mobileLinkStyle}>
              {t('nav_blog', 'Blog')}
            </Link>
            <Link to={toLandingAnchor("#faq")} onClick={closeMenu} className={mobileLinkStyle}>
              {t('nav_faq', 'FAQ')}
            </Link>
            
            <Link to="/about" onClick={closeMenu} className={mobileLinkStyle}>
              {t('about_title', 'About Us')}
            </Link>
            
            <Link to="/contact" onClick={closeMenu} className={mobileLinkStyle}>
              {t('contact_title', 'Contact Us')}
            </Link>
          </div>
          
          <div className="pt-6 border-t border-slate-100 space-y-4">
            {/* 🌐 Mobile Language Button */}
            <button 
              onClick={() => {
                setShowLanguageModal(true);
                closeMenu();
              }}
              className="flex w-full items-center justify-center gap-3 text-slate-600 bg-slate-50 px-4 py-4 rounded-2xl border border-slate-200"
            >
              <Globe className="w-5 h-5 text-purple-600" />
              <span className="uppercase text-xs font-black tracking-[0.2em]">{language} Selection</span>
            </button>

            {/* 🚀 Mobile Action Button */}
            <Link 
              to="/auth" 
              onClick={closeMenu}
              className={cn(
                "block w-full text-center text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl",
                primaryGradient
              )}
            >
              {t('nav_get_started', 'Login / Signup')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
