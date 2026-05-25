import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, Users, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/savings', icon: PiggyBank, label: 'Savings' },
  { path: '/group-expenses', icon: Users, label: 'Split' },
];

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0 active:scale-95 transition-transform">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Bachat<span className="text-pink-200 font-extrabold">Karo</span>
            </h1>
          </Link>

          {/* Desktop Nav - Clean & Minimal */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all',
                  isActive(item.path)
                    ? 'bg-white text-purple-700 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="hidden sm:flex text-white hover:bg-white/10 rounded-full"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white bg-white/10 rounded-xl"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer - Instagram Style List */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-purple-800/95 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 p-4 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all',
                  isActive(item.path)
                    ? 'bg-white text-purple-700 shadow-lg'
                    : 'text-white/90 bg-white/5'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-base">{item.label}</span>
              </Link>
            ))}
            <button onClick={signOut} className="flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-pink-300 bg-red-500/10 mt-2">
              <LogOut className="h-6 w-6" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;