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
    <div className="w-full bg-background/90 backdrop-blur-sm border-b border-border sticky top-16 z-40">
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
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-primary text-primary-foreground scale-110 shadow-sm" : "bg-muted"
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