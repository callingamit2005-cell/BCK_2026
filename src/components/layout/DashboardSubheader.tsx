/**
 * DashboardSubheader.tsx - BachatKaro Premium Monochrome Edition
 * UI: Compact Segmented Control (Luxury Fintech Minimalism)
 * Logic: 100% Intact (Tab Switching Logic Preserved)
 * UX: Reduces vertical bloat, eliminates duplicate navigation hierarchy
 */

import { Calendar, Calculator, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSubheaderProps {
  activeTab: 'daily' | 'planning' | 'future' | 'dreams';
  onTabChange: (tab: 'daily' | 'planning' | 'future' | 'dreams') => void;
}

export default function DashboardSubheader({ activeTab, onTabChange }: DashboardSubheaderProps) {
  const tabs = [
    { id: 'daily', icon: Calendar, label: 'Daily' },
    { id: 'planning', icon: Calculator, label: 'Planning' },
    { id: 'future', icon: TrendingUp, label: 'Future' },
    { id: 'dreams', icon: Target, label: 'Dreams' },
  ] as const;

  return (
    <div className="w-full flex justify-center py-4 sm:py-6 px-4">
      {/* Compact Segmented Control Container */}
      <div className="flex items-center p-2 bg-surface border border-border/40 rounded-[32px] overflow-x-auto hide-scrollbar max-w-full shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex items-center gap-3 px-8 py-3 rounded-[24px] transition-all duration-700 ease-butter-soft touch-manipulation whitespace-nowrap',
                isActive
                  ? 'bg-[#1a1a1a] text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] scale-105 z-10'
                  : 'text-[#525252] hover:text-[#1a1a1a] hover:bg-background/80 active:scale-[0.98] opacity-80'
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-all duration-700",
                isActive ? "scale-110 opacity-100" : "opacity-70"
              )} />
              <span className={cn(
                "text-[11px] uppercase tracking-[0.25em]",
                isActive ? "font-black" : "font-black"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}