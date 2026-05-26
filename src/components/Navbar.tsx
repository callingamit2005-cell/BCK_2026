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
  const navBackground = "bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm";
  const linkStyle = "text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all duration-300";
  const mobileLinkStyle = "block text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white py-3";

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-[100] transition-all duration-500", navBackground)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 md:py-5">
        
        {/* 🏢 Brand Logo - High Contrast Monochrome */}
        <Link to="/" className="relative group">
          <span className={cn("text-2xl font-black tracking-tighter text-white group-hover:opacity-80 transition-opacity inline-block")}>
            Bachat<span className="text-white/40">Karo</span>
          </span>
        </Link>

        {/* 💻 DESKTOP MENU - Crystal Clear */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8 mr-4">
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
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-8">
            {/* 🌐 Desktop Language Button */}
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase text-[9px] font-bold tracking-widest">{language}</span>
            </button>

            {/* 🚀 Primary CTA Button */}
            <Link 
              to="/auth" 
              className={cn(
                "bg-white text-background px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-white/90 active:scale-[0.98] transition-all"
              )}
            >
              {t('nav_get_started', 'Access App')}
            </Link>
          </div>
        </div>

        {/* 📱 MOBILE TOGGLE BUTTON */}
        <button 
          className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/60" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU - High Contrast Glass */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[69px] bg-background/98 backdrop-blur-3xl border-b border-white/10 px-8 py-10 space-y-8 shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="space-y-2">
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
          
          <div className="pt-8 border-t border-white/5 space-y-5">
            {/* 🌐 Mobile Language Button */}
            <button 
              onClick={() => {
                setShowLanguageModal(true);
                closeMenu();
              }}
              className="flex w-full items-center justify-center gap-3 text-white/40 bg-white/5 px-4 py-4 rounded-2xl border border-white/5"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-[10px] font-bold tracking-[0.2em]">{language} Selection</span>
            </button>

            {/* 🚀 Mobile Action Button */}
            <Link 
              to="/auth" 
              onClick={closeMenu}
              className={cn(
                "block w-full text-center bg-white text-background py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
              )}
            >
              {t('nav_get_started', 'Launch Experience')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
