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

const DashboardSubheader = ({ activeTab, onTabChange }: DashboardSubheaderProps) => {
  const tabs = [
    { id: 'daily', icon: Calendar, label: 'Daily' },
    { id: 'planning', icon: Calculator, label: 'Planning' },
    { id: 'future', icon: TrendingUp, label: 'Future' },
    { id: 'dreams', icon: Target, label: 'Dreams' },
  ] as const;

  return (
    <div className="w-full flex justify-center py-4 sm:py-6 px-4">
      {/* Compact Segmented Control Container */}
      <div className="flex items-center p-1.5 bg-surface border border-white/5 rounded-[22px] overflow-x-auto hide-scrollbar max-w-full">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 touch-manipulation whitespace-nowrap',
                isActive
                  ? 'bg-white text-background'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isActive ? "scale-105" : "opacity-40"
              )} />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardSubheader;