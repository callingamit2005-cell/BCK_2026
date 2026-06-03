import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const AnnouncementBar = () => {
  return (
    <div className="w-full bg-primary text-primary-foreground border-b border-primary/20 flex items-center justify-center px-4 py-2 sm:py-2.5 z-[110] relative">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 md:gap-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground/80 animate-pulse" />
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center sm:text-left leading-tight">
            Start using the <span className="font-black text-white">BachatKaro Web Version</span> instantly
          </p>
        </div>
        
        <Link 
          to="/auth" 
          className="shrink-0 bg-white text-primary px-4 py-1 sm:px-5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all hover:bg-white/90 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          Access Beta <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
