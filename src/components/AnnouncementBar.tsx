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
    <div className="fixed top-0 left-0 right-0 h-[48px] z-[110] bg-white shadow-sm flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-row items-center justify-center gap-3 md:gap-6">
        <p className="text-black text-[10px] md:text-sm font-bold uppercase tracking-widest truncate">
          🚀 <span className="opacity-60">Start using the</span> BachatKaro Web Version <span className="opacity-60">instantly</span>
        </p>
        
        <Link 
          to="/auth" 
          className="shrink-0 bg-black text-white px-4 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80 active:scale-95 flex items-center gap-2"
        >
          Access Beta
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
