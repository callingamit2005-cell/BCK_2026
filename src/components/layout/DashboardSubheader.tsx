/**
 * DashboardSubheader.tsx - BachatKaro Premium Monochrome Edition
 * UI: Compact Segmented Control (Luxury Fintech Minimalism)
 * Logic: 100% Intact (Tab Switching Logic Preserved)
 * UX: Reduces vertical bloat, eliminates duplicate navigation hierarchy
 */

import { Calendar, Calculator, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardSubheaderProps {
  activeTab: 'daily' | 'planning' | 'future' | 'dreams';
  onTabChange: (tab: 'daily' | 'planning' | 'future' | 'dreams') => void;
}

export default function DashboardSubheader({ activeTab, onTabChange }: DashboardSubheaderProps) {
  const { t } = useLanguage();
  const tabs = [
    { id: 'daily', icon: Calendar, label: t('tabs.daily', 'Daily') },
    { id: 'planning', icon: Calculator, label: t('tabs.planning', 'Planning') },
    { id: 'future', icon: TrendingUp, label: t('tabs.future', 'Future') },
    { id: 'dreams', icon: Target, label: t('tabs.dreams', 'Dreams') },
  ] as const;

  return (
    <div className="w-full flex justify-center py-4 sm:py-6 px-4 relative overflow-hidden">
      {/* Edge Gradient Masks for scrolling overflow - Narrower for better visibility */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none md:hidden" />

      {/* Compact Segmented Control Container */}
      <div 
        className="flex items-center p-1 bg-card border border-border/40 rounded-3xl overflow-x-auto hide-scrollbar max-w-full shadow-sm relative z-30 mx-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex items-center min-w-max px-0.5">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  'flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 rounded-2xl transition-all duration-700 ease-in-out touch-manipulation whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md scale-105 z-10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80 active:scale-[0.98] opacity-80'
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-all duration-700",
                  isActive ? "scale-110 opacity-100" : "opacity-70"
                )} />
                <span className={cn(
                  "text-xs uppercase tracking-wider",
                  isActive ? "font-black" : "font-bold"
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
}
