import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyFormatter";
import { StatusState } from "@/components/ui/StatusState";

/**
 * BudgetPulse — Budget health indicator card
 * Shows spending progress against the monthly budget.
 */

interface BudgetPulseProps {
  spent: number;
  budget: number;
  className?: string;
}

const BudgetPulse = React.memo(({ spent, budget, className }: BudgetPulseProps) => {
  const { t } = useLanguage();
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  // Progress bar color: green → amber → red
  const barColor = useMemo(() => {
    if (percentage >= 100) return 'bg-[#DC2626]';
    if (percentage >= 85) return 'bg-[#D97706]';
    return 'bg-[#16A34A]';
  }, [percentage]);

  // Status config
  const status = useMemo(() => {
    if (budget === 0) return {
      icon: TrendingDown,
      label: t('budgetPulse.noLimit', 'No budget set'),
      sub: t('budgetPulse.noLimitSub', 'Set a budget to track spending'),
      iconColor: 'text-text-muted',
      alertBg: false,
    };
    if (percentage >= 100) return {
      icon: AlertTriangle,
      label: t('budgetPulse.exhausted', 'Budget exceeded'),
      sub: t('budgetPulse.exhaustedSub', 'You\'ve gone over your planned limit'),
      iconColor: 'text-[#DC2626]',
      alertBg: true,
    };
    if (percentage >= 85) return {
      icon: AlertTriangle,
      label: t('budgetPulse.alert', 'Approaching limit'),
      sub: t('budgetPulse.alertSub', 'You\'re close to your monthly budget'),
      iconColor: 'text-[#D97706]',
      alertBg: true,
    };
    return {
      icon: CheckCircle2,
      label: t('budgetPulse.stable', 'On track'),
      sub: t('budgetPulse.stableSub', 'Your spending is within budget'),
      iconColor: 'text-[#16A34A]',
      alertBg: false,
    };
  }, [percentage, budget, t]);

  const Icon = status.icon;

  if (budget === 0) {
    return (
      <StatusState 
        type="empty"
        title={status.label}
        message={status.sub}
        variant="card"
        icon={<TrendingDown className="h-10 w-10 text-muted-foreground/40" />}
      />
    );
  }

  return (
    <div className={cn("w-full max-w-xl mx-auto", className)}>
      <div
        className={cn(
          "relative rounded-2xl p-5 sm:p-6 border transition-colors duration-300",
          "bg-surface border-border/40 shadow-sm",
          status.alertBg && "border-[#DC2626]/20 bg-[#DC2626]/[0.02]"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center shrink-0 border bg-background shadow-sm",
              status.alertBg ? "border-[#DC2626]/20" : "border-border/60"
            )}
          >
            <Icon className={cn("h-5 w-5", status.iconColor)} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Status label + percentage */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {status.label}
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-text-muted">
                {Math.round(percentage)}%
              </span>
            </div>

            {/* Sub-label */}
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              {status.sub}
            </p>

            {/* Progress bar */}
            {budget > 0 && (
              <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/30">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    barColor
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Spent vs Budget summary */}
        {budget > 0 && (
          <div className="mt-5 grid grid-cols-2 divide-x divide-border/40 bg-background/60 rounded-xl border border-border/30 overflow-hidden">
            <div className="p-4">
              <p className="text-xs text-text-muted mb-1">
                {t('common.spent', 'Spent')}
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-[#DC2626]">
                {formatCurrency(spent)}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-text-muted mb-1">
                {t('common.budget', 'Budget')}
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-text-muted">
                {formatCurrency(budget)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BudgetPulse;
