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
import ExportMenu from './ExportMenu';

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

  // ==================== TRUE DARK NEON UI SYSTEM ====================
  const neonGlass = "bg-[#0a0014]/80 backdrop-blur-xl border border-[#ff0f7b]/30 shadow-2xl rounded-[28px]";
  const activeBtn = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border-none";
  const labelText = "text-white/40 font-black uppercase tracking-[0.2em] text-[10px]";
  const applePhysics = "transition-all duration-300 ease-butter-soft active:scale-95 transform-gpu";

  return (
    <>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <Card className={cn(neonGlass, "overflow-hidden w-full border-[#ff0f7b]/20")}>
        <CardContent className="p-4 sm:p-6 w-full space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
            
            {/* Left Action Area */}
            <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-6">
              {console.log('[DateFilter_Received_Count]', filteredData?.length)}
              <ExportMenu data={filteredData} />
              <div className="h-10 w-[1px] bg-white/10 hidden lg:block" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                  <Filter className="h-4 w-4 text-[#ff0f7b]" />
                </div>
                <span className={labelText}>Filter Analytics</span>
              </div>
            </div>

            {/* Right: Scrollable Preset Row - FIXED CLIPPING */}
            <div className="w-full lg:w-auto">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-[22px] border border-white/5 shadow-inner w-full lg:w-auto">
                  {presets.map((p) => (
                    <Button
                      key={p.key}
                      size="sm"
                      variant={value.preset === p.key ? 'default' : 'ghost'}
                      className={cn(
                        'h-10 px-5 whitespace-nowrap rounded-[18px] text-[11px] font-black uppercase tracking-wider shrink-0',
                        applePhysics,
                        value.preset === p.key
                          ? activeBtn
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      )}
                      onClick={() =>
                        onChange({ preset: p.key, customFrom: value.customFrom, customTo: value.customTo })
                      }
                    >
                      {value.preset === p.key && <Sparkles className="mr-2 h-3.5 w-3.5 text-white animate-pulse" />}
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Range Display - REPAIRED UI */}
          {value.preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500 w-full p-4 bg-white/5 rounded-3xl border border-white/5">
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-6 text-[11px] font-black rounded-2xl border-white/10 bg-black/40 text-white hover:bg-white/5 hover:border-[#ff0f7b]/40 flex-1 sm:flex-none",
                      applePhysics
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-[#ff0f7b] shrink-0" />
                    <span className="tracking-widest">{value.customFrom ? format(value.customFrom, 'dd MMM yyyy') : 'START DATE'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[32px] bg-[#0a0014] border border-[#ff0f7b]/30 shadow-3xl transform-gpu" align="start">
                  <Calendar
                    mode="single"
                    selected={value.customFrom}
                    onSelect={handleFromSelect}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>

              <div className="h-12 flex items-center justify-center px-2">
                <ArrowRight className="h-4 w-4 text-white/20 shrink-0" />
              </div>

              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-6 text-[11px] font-black rounded-2xl border-white/10 bg-black/40 text-white hover:bg-white/5 hover:border-[#ff0f7b]/40 flex-1 sm:flex-none",
                      applePhysics
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-[#ff0f7b] shrink-0" />
                    <span className="tracking-widest">{value.customTo ? format(value.customTo, 'dd MMM yyyy') : 'END DATE'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[32px] bg-[#0a0014] border border-[#ff0f7b]/30 shadow-3xl transform-gpu" align="start">
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
