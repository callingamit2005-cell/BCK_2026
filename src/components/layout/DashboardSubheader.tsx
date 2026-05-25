/**
 * DashboardSubheader.tsx - BachatKaro Neon Enterprise Edition
 * UI: Deep Neon Purple-Pink Theme with Glassmorphism
 * Logic: 100% Intact (Tab Switching Logic Preserved)
 * UX: Mobile-First Responsive Navigation
 */

 import { Calendar, Calculator, TrendingUp, Target, Sparkles } from 'lucide-react';
 import { cn } from '@/lib/utils';

 interface DashboardSubheaderProps {
  activeTab: 'daily' | 'planning' | 'future' | 'dreams';
  onTabChange: (tab: 'daily' | 'planning' | 'future' | 'dreams') => void;
 }

 const DashboardSubheader = ({ activeTab, onTabChange }: DashboardSubheaderProps) => {
  // World No. 1 Polish: Removed kachra keys and added professional labels
  const tabs = [
    { id: 'daily', icon: Calendar, label: 'Daily' },
    { id: 'planning', icon: Calculator, label: 'Planning' },
    { id: 'future', icon: TrendingUp, label: 'Future' },
    { id: 'dreams', icon: Target, label: 'Dreams' },
  ] as const;

  // Amit bhai's signature Neon Gradients
  const primaryNeonGradient = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF]";
  const deepNeonBg = "bg-[#1E1B4B]/95 bg-gradient-to-r from-[#4C1D95]/30 via-[#701A75]/30 to-[#4C1D95]/30";

  return (
    <div className={cn(
      "w-full sticky z-40 transition-all duration-300",
      "top-16 md:top-20", // Header height matching
      "backdrop-blur-2xl border-b border-[#EC4899]/20 shadow-lg",
      deepNeonBg
    )}>
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Modern Style Scroll: Optimized for Mobile & Desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6 overflow-x-auto scrollbar-hide py-3 sm:py-4 no-scrollbar">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  'flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-4 sm:px-6 py-2.5 rounded-[22px] transition-all duration-500 flex-1 sm:flex-initial min-w-[85px] relative group',
                  'active:scale-90 touch-manipulation',
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                )}
              >
                {/* Neon Icon Container */}
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-500 relative z-10",
                  isActive
                    ? `${primaryNeonGradient} shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110`
                    : "bg-white/5 border border-white/10 group-hover:border-purple-500/50"
                )}>
                  <Icon className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5",
                    isActive ? "text-white" : "text-white/60"
                  )} />
                </div>

                {/* Professional Label */}
                <span className={cn(
                  "text-[10px] sm:text-sm font-black tracking-[0.05em] uppercase sm:capitalize transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-60 group-hover:opacity-100"
                )}>
                  {label}
                </span>

                {/* Active Indicator Sparkle */}
                {isActive && (
                  <Sparkles className="absolute -top-1 right-2 h-3 w-3 text-yellow-300 animate-pulse" />
                )}

                {/* Bottom Active Pill (Desktop) */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-t-full shadow-[0_0_10px_#EC4899] hidden sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardSubheader;