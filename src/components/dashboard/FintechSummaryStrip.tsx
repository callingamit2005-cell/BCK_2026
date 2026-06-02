import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useLanguage } from '@/contexts/LanguageContext';

interface FintechSummaryStripProps {
  totalCredit: number;
  totalDebit: number;
  className?: string;
}

export const FintechSummaryStrip: React.FC<FintechSummaryStripProps> = ({
  totalCredit,
  totalDebit,
  className
}) => {
  const { t } = useLanguage();

  const items = [
    {
      label: t('dashboard.totalCredit', 'Total Credit'),
      value: totalCredit,
      icon: ArrowDownRight,
      trendIcon: TrendingUp,
      // Income = green per Financial Color System
      amountClass: 'text-[#16A34A]',
      iconClass: 'text-[#16A34A]',
      bgClass: 'bg-[#16A34A]/5',
      borderClass: 'border-[#16A34A]/20',
    },
    {
      label: t('dashboard.totalDebit', 'Total Debit'),
      value: totalDebit,
      icon: ArrowUpRight,
      trendIcon: TrendingDown,
      // Expense = red per Financial Color System
      amountClass: 'text-[#DC2626]',
      iconClass: 'text-[#DC2626]',
      bgClass: 'bg-[#DC2626]/5',
      borderClass: 'border-[#DC2626]/20',
    },
  ];

  return (
    <div className={cn('px-4 sm:px-6 mb-6', className)}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'relative overflow-hidden bg-surface border rounded-2xl p-4 sm:p-5 shadow-sm group transition-all duration-200',
              item.borderClass
            )}
          >
            {/* Hover tint */}
            <div
              className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                item.bgClass
              )}
            />

            <div className="relative z-10 flex flex-col gap-1.5">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  {item.label}
                </span>
                <item.icon className={cn('h-3.5 w-3.5 opacity-50', item.iconClass)} />
              </div>

              {/* Amount */}
              <span className={cn('text-lg sm:text-xl font-bold font-mono tabular-nums', item.amountClass)}>
                {formatCurrency(item.value)}
              </span>
            </div>

            {/* Decorative background icon */}
            <div className="absolute -bottom-1 -right-1 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none">
              <item.trendIcon className="h-12 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
