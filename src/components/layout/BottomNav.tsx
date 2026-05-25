import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SmartUniversalInput from "../SmartUniversalInput";

/**
 * BottomNav.tsx - BachatKaro Modern-Style Mobile Navigation
 * Design: True Dark Neon Glass V2
 * Physics: Apple-grade touch precision
 */
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  // 1. Purge "Savings" - Only 3 items remain
  const isHome = isActive("/dashboard") || isActive("/");
  const isGroupPage = isActive("/group-expenses");

  // Reset modal on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { path: "#", icon: Plus, label: "Add", isCenter: true, hidden: isGroupPage }, // Hidden ONLY on Group page
    { path: "/group-expenses", icon: Users, label: "Groups" },
  ];

  // Physics & Touch System
  const applePhysics = "transition-all duration-300 ease-butter-soft active:scale-[0.965] touch-action-manipulation";

  return (
    <>
      <nav
        className="safe-x safe-bottom md:hidden fixed bottom-0 left-0 right-0 z-[100] w-full min-h-[84px] bg-[#0a0014]/88 backdrop-blur-[32px] border-t border-[#ff0f7b]/30 flex items-center justify-around px-3 pt-2 pb-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <style>{`
          @keyframes neon-halo-rotate {
            0% { transform: translate(-50%, -50%) rotateZ(0deg); }
            100% { transform: translate(-50%, -50%) rotateZ(360deg); }
          }
        `}</style>
        {navItems.map((item) => {
          if (item.hidden) {
            // Render invisible placeholder to prevent layout shift
            return <div key={`placeholder-${item.path}`} className="w-[64px] min-h-[52px]" aria-hidden="true" />;
          }
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <div key="center-fab" className={cn("relative -top-5 flex items-center justify-center", applePhysics)}>
                {/* 2. Rainbow Halo Wrapper */}
                <div 
                  className="absolute top-1/2 left-1/2 w-[76px] h-[76px] rounded-full blur-[14px] opacity-90 pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, #FF0000, #FFA500, #FFFF00, #008000, #0000FF, #4B0082, #EE82EE, #FF0000)',
                    animation: 'neon-halo-rotate 3s linear infinite',
                    zIndex: 0,
                    willChange: 'transform'
                  }}
                />
                
                {/* 3. Toggle Logic */}
                <button
                  type="button"
                  onClick={() => setIsOpen(prev => !prev)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Close add transaction panel" : "Open add transaction panel"}
                  className={cn(
                    "relative z-10 flex flex-col items-center justify-center w-[64px] h-[64px] rounded-full shadow-[0_0_25px_rgba(236,72,153,0.5)] bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#D946EF] border-4 border-[#0a0014] touch-manipulation"
                  )}
                >
                  <item.icon className={cn("h-8 w-8 text-white transition-transform duration-300", isOpen ? "rotate-45" : "rotate-0")} />
                </button>
                
                <span className="absolute -bottom-6 text-[10px] font-black uppercase tracking-widest text-white/50">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (active) e.preventDefault();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[52px] gap-1 rounded-2xl group",
                applePhysics
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                active ? "bg-[#ff0f7b]/20 text-[#ff0f7b]" : "text-white/40 group-hover:text-white/70"
              )}>
                <item.icon className={cn("h-6 w-6", active && "drop-shadow-[0_0_8px_rgba(255,15,123,0.8)]")} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                active ? "text-[#ff0f7b]" : "text-white/40"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* FAB Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="mobile-scroll w-[95vw] max-w-lg max-h-[min(88dvh,720px)] overflow-y-auto bg-transparent border-none p-0 shadow-none">
          <DialogTitle className="sr-only">Add New Transaction</DialogTitle>
          <DialogDescription className="sr-only">Quickly add an expense or income via voice, text, or manual entry.</DialogDescription>
          <SmartUniversalInput />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BottomNav;
