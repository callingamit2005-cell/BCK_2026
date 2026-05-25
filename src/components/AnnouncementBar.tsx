import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AnnouncementBar = () => {
  // We use a small hack to push the fixed Navbar down without modifying its code
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) {
      nav.style.top = '48px'; // Height of the announcement bar
    }
    return () => {
      if (nav) nav.style.top = '0px';
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[48px] z-[110] bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center px-4 overflow-hidden">
      {/* Subtle animated light sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-row items-center justify-center gap-3 md:gap-6">
        <p className="text-white text-[10px] md:text-sm font-medium tracking-wide truncate">
          🚀 Start using the <span className="font-black text-white decoration-[#ff0f7b] underline underline-offset-4 decoration-2">BachatKaro Web Version</span> instantly — all features are currently free during beta.
        </p>
        
        <Link 
          to="/auth" 
          className="shrink-0 bg-white text-[#EC4899] px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
        >
          Login / Signup
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default AnnouncementBar;
