/**
 * AppHeader.tsx - BachatKaro Neon Enterprise Edition
 * UI: Deep Neon Purple-Pink Theme with Glassmorphism
 * Logic: 100% Intact (Auth & Routing Preserved)
 */

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, Users, LogOut, Wallet, Sparkles } from 'lucide-react';
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

  // Amit bhai's Deep Neon Pink-Purple Theme Config
  const neonTextGradient = "bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6]";
  // Deep Purple-Pink base gradient overlay on #1E1B4B
  const deepNeonBg = "bg-[#1E1B4B] bg-gradient-to-r from-[#4C1D95]/40 via-[#701A75]/40 to-[#4C1D95]/40";

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-300",
      "backdrop-blur-2xl border-b border-[#EC4899]/30 shadow-[0_4px_30px_rgba(236,72,153,0.15)]",
      deepNeonBg
    )}>
      {/* Top Neon Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6] opacity-80" />

      <div className="safe-x max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Section */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group active:scale-95 transition-all"
          >
            <div className={cn(
              "p-2.5 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transform group-hover:rotate-12 transition-all duration-500",
              "bg-gradient-to-br from-[#EC4899] to-[#7C3AED]"
            )}>
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white">
              Bachat<span className={cn("text-transparent bg-clip-text animate-pulse", neonTextGradient)}>Karo</span>
            </h1>
          </Link>

          {/* Desktop Nav - Neon Glass Pill */}
          <nav className="hidden md:flex items-center gap-2 bg-black/30 p-1.5 rounded-[22px] border border-white/10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-2xl transition-all duration-300 relative group',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive(item.path) ? "text-white" : "text-white/40")} />
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-pink-300 animate-bounce" />
                )}
              </Link>
            ))}
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block p-1 bg-white/5 rounded-xl border border-white/10 hover:border-[#EC4899]/50 transition-colors">
              <ThemeToggle />
            </div>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-11 w-11 text-white/70 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all border border-transparent hover:border-pink-500/30"
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
