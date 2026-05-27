/**
 * DateFilter.tsx - BachatKaro Neon Enterprise Edition
 * UI: True Dark Neon Glass V2
 * 🛡️ LOGIC LOCK: Validation & Selection Logic 100% Intact.
 * ✅ FEATURES: Fixed Clipping for Custom Range, Horizontal Swipe, GPU Optimized.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Sparkles, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type FilterPreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export interface DateFilterValue {
  preset: FilterPreset;
  customFrom?: Date;
  customTo?: Date;
}

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  filteredData?: any[];
}

const DateFilter = ({ value, onChange, filteredData = [] }: DateFilterProps) => {
  const { toast } = useToast();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const presets: { key: FilterPreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'custom', label: 'Custom Date' },
  ];

  const handleFromSelect = (date: Date | undefined) => {
    onChange({ ...value, customFrom: date ?? undefined });
    setFromOpen(false);
  };

  const handleToSelect = (date: Date | undefined) => {
    if (date && value.customFrom && date < value.customFrom) {
      toast({
        title: "Invalid Range",
        description: "To date must be after From date.",
        variant: "destructive",
      });
      return;
    }
    onChange({ ...value, customTo: date ?? undefined });
    setToOpen(false);
  };

  // ==================== PREMIUM MONOCHROME UI SYSTEM ====================
  const premiumSurface = "bg-surface border border-border shadow-sm rounded-[28px]";
  const activeBtn = "bg-foreground text-surface shadow-md border-none hover:bg-foreground/90 transition-all";
  const labelText = "text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]";
  const applePhysics = "transition-all duration-300 ease-out active:scale-95 transform-gpu";

  return (
    <>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <Card className={cn(premiumSurface, "overflow-hidden w-full border-border")}>
        <CardContent className="p-4 sm:p-7 w-full space-y-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
            
            {/* Left Action Area */}
            <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-background border border-border shadow-inner">
                  <Filter className="h-5 w-5 text-text-secondary" />
                </div>
                <span className={labelText}>Filter Analytics</span>
              </div>
            </div>

            {/* Right: Scrollable Preset Row */}
            <div className="w-full lg:w-auto">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2.5 bg-background p-1.5 rounded-[24px] border border-border shadow-inner w-full lg:w-auto">
                  {presets.map((p) => (
                    <Button
                      key={p.key}
                      size="sm"
                      variant={value.preset === p.key ? 'default' : 'ghost'}
                      className={cn(
                        'h-11 px-6 whitespace-nowrap rounded-[20px] text-[11px] font-bold uppercase tracking-widest shrink-0 transition-all',
                        applePhysics,
                        value.preset === p.key
                          ? activeBtn
                          : 'text-text-secondary hover:text-foreground hover:bg-surface border border-transparent hover:border-border'
                      )}
                      onClick={() =>
                        onChange({ preset: p.key, customFrom: value.customFrom, customTo: value.customTo })
                      }
                    >
                      {value.preset === p.key && <Sparkles className="mr-2 h-4 w-4 text-surface" />}
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Range Display */}
          {value.preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 w-full p-6 bg-background rounded-[24px] border border-border shadow-inner">
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-14 px-8 text-[11px] font-bold rounded-2xl border-border bg-surface text-foreground hover:bg-background flex-1 sm:flex-none shadow-sm",
                      applePhysics
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-text-muted shrink-0" />
                    <span className="tracking-widest">{value.customFrom ? format(value.customFrom, 'dd MMM yyyy') : 'START DATE'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[32px] bg-surface border border-border shadow-3xl transform-gpu z-[110]" align="start">
                  <Calendar
                    mode="single"
                    selected={value.customFrom}
                    onSelect={handleFromSelect}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>

              <div className="h-14 flex items-center justify-center px-2">
                <ArrowRight className="h-5 w-5 text-text-muted shrink-0" />
              </div>

              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-14 px-8 text-[11px] font-bold rounded-2xl border-border bg-surface text-foreground hover:bg-background flex-1 sm:flex-none shadow-sm",
                      applePhysics
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-text-muted shrink-0" />
                    <span className="tracking-widest">{value.customTo ? format(value.customTo, 'dd MMM yyyy') : 'END DATE'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[32px] bg-surface border border-border shadow-3xl transform-gpu z-[110]" align="start">
                  <Calendar
                    mode="single"
                    selected={value.customTo}
                    onSelect={handleToSelect}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default DateFilter;
