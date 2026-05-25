import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, AlertCircle } from "lucide-react";
import type { EMIEntry } from "@/types/emi";
import { getLoanSummary, getMonthsPaid, formatCurrency } from "@/utils/loanCalculator";
import { useLanguage } from "@/contexts/LanguageContext";

interface EMILoanDetailsBlockProps {
  entry: EMIEntry;
  className?: string;
}

/**
 * EMILoanDetailsBlock Component
 * Displays detailed loan information including:
 * - Loan progress and remaining balance
 * - Interest breakdown
 * - Key metrics (principal, outstanding, total interest, months left)
 *
 * All calculations are based on the loanDetails and use the selected
 * interest calculation type (Reducing or Flat).
 *
 * NOTE: Currency formatting is handled by centralized formatter (defaults to ₹).
 * Icon updated to IndianRupee for better regional alignment.
 */
export const EMILoanDetailsBlock: React.FC<EMILoanDetailsBlockProps> = ({
  entry,
  className = "",
}) => {
  const { t } = useLanguage();

  // Guard: if no loanDetails, render nothing (parent should already check)
  if (!entry.loanDetails) return null;

  const loanDetails = entry.loanDetails;

  // Calculate months already paid based on start date
  const monthsPaid = useMemo(
    () => getMonthsPaid(loanDetails.startDate),
    [loanDetails.startDate]
  );

  // Get comprehensive loan summary
  const summary = useMemo(
    () =>
      getLoanSummary({
        principal: loanDetails.principal,
        annualRate: loanDetails.annualInterestRate,
        tenureMonths: loanDetails.totalMonths,
        monthsPaid,
        interestCalculationType: loanDetails.interestCalculationType,
      }),
    [loanDetails, monthsPaid]
  );

  // Progress percentage
  const totalMonths = loanDetails.totalMonths;
  const progressPercent = (monthsPaid / totalMonths) * 100;
  const progressDisplay = Math.min(100, Math.max(0, progressPercent));

  // Edge case: invalid parameters
  const isInvalid = loanDetails.principal <= 0 || totalMonths <= 0 || summary.emi <= 0;
  const isCompleted = summary.monthsRemaining <= 0;

  if (isInvalid) {
    return (
      <Card className={`bg-amber-50 border border-amber-200 ${className}`}>
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            {t('emi.calculationError')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-purple-600" />
              {loanDetails.loanType || t('emi.loanDetails')}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {loanDetails.annualInterestRate}% p.a. | {totalMonths} {t('emi.months')} {t('emi.tenure')}
              {loanDetails.interestCalculationType === 'FLAT' && (
                <span className="ml-2 text-purple-600 font-medium">({t('emi.flat')})</span>
              )}
            </p>
          </div>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              {t('emi.completed')}
            </Badge>
          )}
          {!isCompleted && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              {t('emi.active')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">{t('emi.loanProgress')}</span>
            <span className="text-gray-600 font-semibold">
              {monthsPaid} {t('emi.of')} {totalMonths} {t('emi.months')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500"
              style={{ width: `${progressDisplay}%` }}
            />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Principal Amount */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs text-gray-600 mb-1">{t('emi.principalAmount')}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(loanDetails.principal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('emi.originalLoanAmountDesc')}</p>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs text-gray-600 mb-1">{t('emi.remainingBalance')}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(summary.outstandingBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((summary.outstandingBalance / loanDetails.principal) * 100).toFixed(1)}% {t('emi.left')}
            </p>
          </div>

          {/* Total Interest */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs text-gray-600 mb-1">{t('emi.totalInterest')}</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(summary.totalInterest)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('emi.overFullTenure')}</p>
          </div>

          {/* Months Remaining */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs text-gray-600 mb-1">{t('emi.monthsRemaining')}</p>
            <p className="text-lg font-bold text-gray-900">
              {summary.monthsRemaining}
            </p>
          </div>
        </div>

        {/* Current Month Breakdown */}
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <p className="text-xs text-gray-600 mb-2">{t('emi.currentMonthBreakdown')}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">{t('emi.principal')}:</span>
            <span className="font-semibold text-green-700">
              {formatCurrency(summary.principalComponent)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-700">{t('emi.interest')}:</span>
            <span className="font-semibold text-orange-600">
              {formatCurrency(summary.interestComponent)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200">
            <span className="text-sm font-medium text-gray-800">{t('emi.totalEMI')}:</span>
            <span className="font-bold text-purple-700">
              {formatCurrency(summary.emi)}
            </span>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">ℹ️ {t('emi.note')}:</span>{' '}
            {loanDetails.interestCalculationType === 'FLAT' 
              ? t('emi.noteFlat') 
              : t('emi.noteReducing')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EMILoanDetailsBlock;