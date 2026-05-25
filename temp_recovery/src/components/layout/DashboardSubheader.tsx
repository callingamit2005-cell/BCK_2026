import { Calendar, Calculator, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSubheaderProps {
  activeTab: 'daily' | 'planning' | 'future' | 'dreams';
  onTabChange: (tab: 'daily' | 'planning' | 'future' | 'dreams') => void;
}

const DashboardSubheader = ({ activeTab, onTabChange }: DashboardSubheaderProps) => {
  const tabs = [
    { id: 'daily', icon: Calendar, label: 'Daily' },
    { id: 'planning', icon: Calculator, label: 'Planning' },
    { id: 'future', icon: TrendingUp, label: 'Future' },
    { id: 'dreams', icon: Target, label: 'Dreams' },
  ] as const;

  return (
    <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* Instagram Style: Justify center on mobile, Start on desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-4 overflow-x-auto scrollbar-hide py-2 sm:py-3">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  // Mobile: Stacked Icon + Text | Desktop: Row Icon + Text
                  'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl transition-all duration-300 flex-1 sm:flex-initial min-w-[70px]',
                  'active:scale-90 touch-manipulation',
                  isActive
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-[0_4px_12px_rgba(147,51,234,0.1)]'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white scale-110 shadow-lg" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className={cn(
                  "text-[10px] sm:text-sm font-bold tracking-tight uppercase sm:capitalize",
                  isActive ? "opacity-100" : "opacity-70"
                )}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardSubheader;