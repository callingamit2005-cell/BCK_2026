import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ExportMenu from './ExportMenu';
import { useLanguage } from '@/contexts/LanguageContext';

export type FilterPreset = 'today' | 'this_week' | 'last_week' | 'this_month' | 'custom';

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
  const { t } = useLanguage();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const presets: { key: FilterPreset; label: string }[] = [
    { key: 'today', label: t('dateFilter.today') },
    { key: 'this_week', label: t('dateFilter.thisWeek') },
    { key: 'last_week', label: t('dateFilter.lastWeek') },
    { key: 'this_month', label: t('dateFilter.thisMonth') },
    { key: 'custom', label: t('dateFilter.custom') },
  ];

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-200/40 rounded-2xl">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Export button on the left side */}
          <div className="flex items-center gap-2">
            <ExportMenu data={filteredData} />
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>{t('dateFilter.filterLabel')}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={value.preset === p.key ? 'default' : 'outline'}
                className={cn(
                  'rounded-lg text-xs h-8',
                  value.preset === p.key &&
                    'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-md'
                )}
                onClick={() =>
                  onChange({ preset: p.key, customFrom: value.customFrom, customTo: value.customTo })
                }
              >
                {p.label}
              </Button>
            ))}
          </div>

          {value.preset === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 text-xs rounded-lg justify-start',
                      !value.customFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {value.customFrom ? format(value.customFrom, 'dd MMM yyyy') : t('dateFilter.from')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.customFrom}
                    onSelect={(d) => {
                      onChange({ ...value, customFrom: d ?? undefined });
                      setFromOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">{t('dateFilter.to')}</span>

              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 text-xs rounded-lg justify-start',
                      !value.customTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {value.customTo ? format(value.customTo, 'dd MMM yyyy') : t('dateFilter.to')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.customTo}
                    onSelect={(d) => {
                      onChange({ ...value, customTo: d ?? undefined });
                      setToOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DateFilter;