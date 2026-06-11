/**
 * DateFilter.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Temporal Navigation Terminal.
 * 🛡️ LOGIC LOCK: Range validation and selection logic 100% untouched.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
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
    { key: 'this_week', label: 'Weekly' },
    { key: 'this_month', label: 'Monthly' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'custom', label: 'Custom Range' },
  ];

  const handleFromSelect = (date: Date | undefined) => {
    onChange({ ...value, customFrom: date ?? undefined });
    setFromOpen(false);
  };

  const handleToSelect = (date: Date | undefined) => {
    if (date && value.customFrom && date < value.customFrom) {
      toast({
        title: "Invalid Range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    onChange({ ...value, customTo: date ?? undefined });
    setToOpen(false);
  };

  return (
    <Card className="fintech-card overflow-hidden w-full border-border/50 shadow-premium">
      <CardContent className="p-4 sm:p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Header & Export */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Perspective</p>
                <p className="text-sm font-bold text-foreground tracking-tight mt-1">Audit Filter</p>
              </div>
            </div>
            
            <div className="md:border-l md:border-border/60 md:pl-6">
              <ExportMenu data={filteredData} reportTitle={`BachatKaro_Report_${value.preset}`} />
            </div>
          </div>

          {/* Preset Selector */}
          <div className="flex flex-wrap gap-2.5 p-1.5 bg-muted/20 border border-border/40 rounded-xl">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => onChange({ preset: p.key, customFrom: value.customFrom, customTo: value.customTo })}
                className={cn(
                  "h-10 px-5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95",
                  value.preset === p.key
                    ? "bg-primary text-primary-foreground shadow-premium"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Expansion */}
        {value.preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-muted/30 rounded-2xl border border-border/40 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Start Date</label>
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 px-4 rounded-xl bg-surface border-border/50 text-sm font-semibold justify-between hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="font-mono tabular-nums">
                        {value.customFrom ? format(value.customFrom, 'dd MMM yyyy') : 'Pick Date'}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl bg-surface border border-border shadow-institutional z-[110]" align="start">
                  <Calendar mode="single" selected={value.customFrom} onSelect={handleFromSelect} className="p-3" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">End Date</label>
              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 px-4 rounded-xl bg-surface border-border/50 text-sm font-semibold justify-between hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="font-mono tabular-nums">
                        {value.customTo ? format(value.customTo, 'dd MMM yyyy') : 'Pick Date'}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl bg-surface border border-border shadow-institutional z-[110]" align="start">
                  <Calendar mode="single" selected={value.customTo} onSelect={handleToSelect} className="p-3" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DateFilter;
