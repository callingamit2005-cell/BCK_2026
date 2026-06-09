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

  // Hide Navbar on app routes (dashboard, savings, groups, auth)
  const APP_ROUTES = ['/dashboard', '/savings', '/group-expenses', '/groups', '/auth', '/setup'];
  const isAppRoute = APP_ROUTES.some(r => location.pathname.startsWith(r));
  if (isAppRoute) return null;

  // ==================== PREMIUM UI SYSTEM ====================
  const navBackground = "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm";
  const linkStyle = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-300 relative group";
  const mobileLinkStyle = "block text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-4";

  return (
    <nav className={cn("sticky top-0 z-[100] transition-all duration-500", navBackground)}>
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 py-4 md:py-5">
        
        {/* 🏢 Brand Logo - High Contrast Monochrome */}
        <Link to="/" className="relative group shrink-0">
          <span className={cn("text-2xl font-black tracking-tighter text-foreground group-hover:opacity-80 transition-opacity inline-block")}>
            Bachat<span className="text-primary">Karo</span>
          </span>
        </Link>

        {/* 💻 DESKTOP MENU - Crystal Clear */}
        <div className="hidden lg:flex items-center flex-1 justify-end gap-10">
          <div className="flex items-center gap-8 xl:gap-12 mr-2">
            <Link to={toLandingAnchor("#features")} className={linkStyle}>
              {t('nav_features', 'Features')}
              <div className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to="/blog" className={linkStyle}>
              {t('nav_blog', 'Blog')}
              <div className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to={toLandingAnchor("#faq")} className={linkStyle}>
              {t('nav_faq', 'FAQ')}
              <div className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to="/about" className={linkStyle}>
              {t('about_title', 'About Us')}
              <div className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to="/contact" className={linkStyle}>
              {t('contact_title', 'Contact')}
              <div className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4 xl:gap-6 border-l border-border/60 pl-8 xl:pl-10">
            {/* 🌐 Desktop Language Button */}
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-muted/10 border border-border/50 px-4 py-2.5 rounded-xl shadow-inner active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-[10px] font-black tracking-widest leading-none mt-0.5">{language}</span>
            </button>

            {/* 🚀 Primary CTA Button */}
            <Link 
              to="/auth" 
              className={cn(
                "flex items-center justify-center bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-primary/90 active:scale-[0.98] transition-all duration-300 min-w-[150px]"
              )}
            >
              {t('nav_get_started', 'Access App')}
            </Link>
          </div>
        </div>

        {/* 📱 MOBILE TOGGLE BUTTON */}
        <button 
          className="lg:hidden p-2.5 rounded-xl bg-muted/20 border border-border/50 text-muted-foreground hover:text-foreground shadow-inner transition-all active:scale-95" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU - High Contrast Glass */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[78px] bg-background/98 backdrop-blur-3xl border-b border-border px-8 py-12 space-y-10 shadow-2xl animate-in slide-in-from-top-5 duration-300">
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
          
          <div className="pt-10 border-t border-border space-y-6">
            {/* 🌐 Mobile Language Button */}
            <button 
              onClick={() => {
                setShowLanguageModal(true);
                closeMenu();
              }}
              className="flex w-full items-center justify-center gap-4 text-muted-foreground bg-background px-6 py-5 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-all"
            >
              <Globe className="w-5 h-5" />
              <span className="uppercase text-xs font-bold tracking-wider">{language} Selection</span>
            </button>

            {/* 🚀 Mobile Action Button */}
            <Link 
              to="/auth" 
              onClick={closeMenu}
              className={cn(
                "block w-full text-center bg-primary text-primary-foreground py-5 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-2xl active:scale-[0.98] transition-all"
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
