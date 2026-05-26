/**
 * AppHeader.tsx - BachatKaro Premium Command Center (Web)
 * UI: Luxury Fintech Monochrome (AMOLED Black + Soft Accent)
 * Logic: 100% Intact (Auth & Routing Preserved)
 */

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, Users, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Clean Professional Labels
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/savings', icon: PiggyBank, label: 'Savings' },
    { path: '/group-expenses', icon: Users, label: 'Groups' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-300",
      "border-b border-white/5 bg-background/95"
    )}>
      <div className="safe-x max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Section */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group active:scale-95 transition-all"
          >
            <div className={cn(
              "p-2.5 rounded-2xl shadow-sm transform transition-all duration-500",
              "bg-surface border border-white/10"
            )}>
              <Wallet className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Bachat<span className="text-text-muted">Karo</span>
            </h1>
          </Link>

          {/* Desktop Nav - Monochrome Hierarchy */}
          <nav className="hidden md:flex items-center gap-1 bg-surface p-1 rounded-2xl border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 relative group',
                  isActive(item.path)
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5 transition-transform", isActive(item.path) ? "text-white" : "text-text-muted")} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block p-1 bg-surface rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <ThemeToggle />
            </div>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-11 w-11 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
