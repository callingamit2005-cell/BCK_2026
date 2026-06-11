/**
 * AppHeader.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Command Center.
 * 🛡️ LOGIC LOCK: Authentication, Routing, and Language logic 100% untouched.
 */

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, Users, LogOut, Wallet, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard', 'Dashboard') },
    { path: '/savings', icon: PiggyBank, label: t('nav.saving', 'Savings') },
    { path: '/group-expenses', icon: Users, label: t('nav.split', 'Groups') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-[100] w-full h-16 md:h-20 min-h-16 bg-card/80 backdrop-blur border-b border-border pt-[var(--safe-area-top)] transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* LOGO AREA */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3.5 group active:scale-95 transition-all"
            aria-label="BachatKaro Home"
          >
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Wallet className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-none">
                Bachat<span className="text-primary">Karo</span>
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
                Institutional Terminal
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-border/40 shadow-inner" aria-label="Main Navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                className={cn(
                  'flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 relative group overflow-hidden',
                  isActive(item.path)
                    ? 'bg-card text-primary shadow-sm border border-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-colors", isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-primary")} aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                {isActive(item.path) && (
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* ACTION HUB */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm" role="status">
               <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
               <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Secure session</span>
            </div>
            
            <ThemeToggle />

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-11 w-11 text-muted-foreground hover:text-expense hover:bg-expense/5 rounded-xl transition-all border border-border/40 hover:border-expense/20 shadow-sm group"
                title="Symmetric Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
