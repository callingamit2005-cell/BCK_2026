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
    <div className="fixed top-0 left-0 right-0 h-[48px] z-[110] bg-surface border-b border-border shadow-sm flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-row items-center justify-center gap-4 md:gap-8">
        <p className="text-foreground text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] truncate">
          🚀 <span className="text-text-secondary">Start using the</span> BachatKaro Web Version <span className="text-text-secondary">instantly</span>
        </p>
        
        <Link 
          to="/auth" 
          className="shrink-0 bg-foreground text-surface px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-foreground/90 active:scale-95 flex items-center gap-2 shadow-md"
        >
          Access Beta
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
