import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SmartUniversalInput from "../SmartUniversalInput";

/**
 * BottomNav.tsx - BachatKaro Premium Monochrome Mobile Navigation
 * Design: AMOLED Black + Soft Accent System
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
  const applePhysics = "transition-all duration-300 ease-butter-soft active:scale-[0.98] touch-action-manipulation";

  return (
    <>
      <nav
        className="safe-x safe-bottom md:hidden fixed bottom-0 left-0 right-0 z-[100] w-full min-h-[84px] bg-surface border-t border-border flex items-center justify-around px-3 pt-2 pb-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {navItems.map((item) => {
          if (item.hidden) {
            // Render invisible placeholder to prevent layout shift
            return <div key={`placeholder-${item.path}`} className="w-[64px] min-h-[52px]" aria-hidden="true" />;
          }
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <div key="center-fab" className={cn("relative -top-6 flex items-center justify-center", applePhysics)}>
                {/* 3. Toggle Logic */}
                <button
                  type="button"
                  onClick={() => setIsOpen(prev => !prev)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Close add transaction panel" : "Open add transaction panel"}
                  className={cn(
                    "relative z-10 flex flex-col items-center justify-center w-[64px] h-[64px] rounded-full bg-foreground border border-border shadow-lg touch-manipulation active:scale-95 transition-transform duration-200"
                  )}
                >
                  <item.icon className={cn("h-7 w-7 text-surface transition-transform duration-300", isOpen ? "rotate-45" : "rotate-0")} />
                </button>
                
                <span className="absolute -bottom-7 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
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
                "flex flex-col items-center justify-center min-w-[64px] min-h-[52px] gap-1.5 rounded-2xl group",
                applePhysics
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                active ? "text-foreground bg-background" : "text-text-secondary group-hover:text-foreground"
              )}>
                <item.icon className={cn("h-5 w-5")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                active ? "text-foreground" : "text-text-secondary"
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
