/**
 * Internationalization (i18n) Configuration
 * 
 * Lightweight translation readiness for future global rollout.
 * Currently supports English only, but structured to easily add new languages.
 * 
 * Usage: 
 *   import { t } from '@/i18n';
 *   <div>{t('dashboard.title')}</div>
 * 
 * To add a new language:
 *   1. Duplicate the 'en' object and translate the values.
 *   2. Change the active language code below.
 */

export type TranslationKey = 
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.add'
  | 'common.edit'
  | 'common.loading'
  | 'common.error'
  | 'nav.dashboard'
  | 'nav.savings'
  | 'nav.groups'
  | 'nav.logout'
  | 'dashboard.title'
  | 'dashboard.addExpense'
  | 'dashboard.monthlySalary'
  | 'dashboard.currentSalary'
  | 'dashboard.enterSalary'
  | 'dashboard.salaryUpdated'
  | 'dashboard.emiTracker'
  | 'dashboard.emiNamePlaceholder'
  | 'dashboard.emiAmountPlaceholder'
  | 'dashboard.emiDayPlaceholder'
  | 'dashboard.addEmi'
  | 'dashboard.addEmiWithDetails'
  | 'dashboard.totalMonthlyEmi'
  | 'dashboard.yourEmis'
  | 'dashboard.dayOfMonth'
  | 'dashboard.monthlyBudget'
  | 'dashboard.currentBudget'
  | 'dashboard.enterBudget'
  | 'dashboard.budgetUpdated'
  | 'dashboard.quickAdjust'
  | 'emi.loanDetails'
  | 'emi.interestType'
  | 'emi.reducingRecommended'
  | 'emi.flat'
  | 'emi.interestTypeHint'
  | 'emi.providerName'
  | 'emi.providerType'
  | 'emi.bank'
  | 'emi.app'
  | 'emi.loanType'
  | 'emi.interestRate'
  | 'emi.tenureYears'
  | 'emi.tenureMonths'
  | 'emi.startDate'
  | 'emi.principalAmount'
  | 'emi.remainingBalance'
  | 'emi.totalInterest'
  | 'emi.monthsRemaining'
  | 'emi.currentMonthBreakdown'
  | 'emi.principal'
  | 'emi.interest'
  | 'emi.completed'
  | 'emi.active'
  | 'emi.note'
  | 'emi.noteReducing'
  | 'emi.noteFlat'
  | 'emi.calculationError'
  | 'emi.loanProgress'
  | 'emi.of'
  | 'emi.months'
  | 'emi.tenure'
  | 'emi.originalLoanAmountDesc'
  | 'emi.left'
  | 'emi.overFullTenure'
  | 'emi.totalEMI'
  | 'snapshot.income'
  | 'snapshot.budget'
  | 'snapshot.spent'
  | 'snapshot.saved'
  | 'snapshot.monthlyCashFlow'
  | 'section.overview'
  | 'section.recurringCommitments'
  | 'section.insights';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.savings': 'Savings',
    'nav.groups': 'Groups',
    'nav.logout': 'Logout',
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.addExpense': 'Add Expense',
    'dashboard.monthlySalary': 'Monthly Salary',
    'dashboard.currentSalary': 'Current Salary',
    'dashboard.enterSalary': 'Enter monthly salary',
    'dashboard.salaryUpdated': 'Salary updated successfully',
    'dashboard.emiTracker': 'EMI & Fixed Bills',
    'dashboard.emiNamePlaceholder': 'Name (e.g. Home Loan)',
    'dashboard.emiAmountPlaceholder': 'Amount',
    'dashboard.emiDayPlaceholder': 'Day',
    'dashboard.addEmi': 'Add Recurring Bill',
    'dashboard.addEmiWithDetails': 'Add EMI with Loan Details',
    'dashboard.totalMonthlyEmi': 'Total Monthly EMI',
    'dashboard.yourEmis': 'Your EMIs',
    'dashboard.dayOfMonth': 'Day {day} of month',
    'dashboard.monthlyBudget': 'Monthly Budget',
    'dashboard.currentBudget': 'Current Budget',
    'dashboard.enterBudget': 'Set budget limit',
    'dashboard.budgetUpdated': 'Budget updated',
    'dashboard.quickAdjust': 'Quick Adjust',
    // EMI Details
    'emi.loanDetails': 'Loan Details',
    'emi.interestType': 'Interest Type',
    'emi.reducingRecommended': 'Standard EMI (Reducing) — Recommended',
    'emi.flat': 'Flat Interest',
    'emi.interestTypeHint': 'Most bank loans use Standard EMI (Reducing). Flat interest is usually used in some consumer or showroom loans.',
    'emi.providerName': 'Provider Name (e.g. HDFC)',
    'emi.providerType': 'Provider Type',
    'emi.bank': 'Bank',
    'emi.app': 'App',
    'emi.loanType': 'Loan Type (e.g. Home Loan)',
    'emi.interestRate': 'Interest Rate % p.a.',
    'emi.tenureYears': 'Tenure Years',
    'emi.tenureMonths': 'Tenure Months',
    'emi.startDate': 'Start Date (optional)',
    'emi.principalAmount': 'Principal Amount',
    'emi.remainingBalance': 'Remaining Balance',
    'emi.totalInterest': 'Total Interest',
    'emi.monthsRemaining': 'Months Remaining',
    'emi.currentMonthBreakdown': 'This Month\'s EMI Breakdown',
    'emi.principal': 'Principal',
    'emi.interest': 'Interest',
    'emi.completed': 'Completed',
    'emi.active': 'Active',
    'emi.note': 'Note',
    'emi.noteReducing': 'Calculations use the reducing‑balance method. Actual amounts may vary based on your lender\'s practices.',
    'emi.noteFlat': 'Calculations use the flat interest method. Actual amounts may vary based on your lender\'s practices.',
    'emi.calculationError': 'Unable to calculate loan details. Please verify all loan parameters.',
    'emi.loanProgress': 'Loan Progress',
    'emi.of': 'of',
    'emi.months': 'months',
    'emi.tenure': 'tenure',
    'emi.originalLoanAmountDesc': 'Original loan amount',
    'emi.left': 'left',
    'emi.overFullTenure': 'Over full tenure',
    'emi.totalEMI': 'Total EMI',
    // Snapshot
    'snapshot.income': 'Income',
    'snapshot.budget': 'Budget',
    'snapshot.spent': 'Spent',
    'snapshot.saved': 'Saved',
    'snapshot.monthlyCashFlow': 'Monthly cash flow overview',
    // Sections
    'section.overview': 'Overview of your finances',
    'section.recurringCommitments': 'Recurring loan and bill commitments',
    'section.insights': 'Insights and trends',
  },
  // Future languages can be added here
  // es: { ... }
};

// Active language – change this to switch languages in the future
const activeLanguage = 'en';

/**
 * Get translated string for a given key.
 * Falls back to the key itself if translation is missing.
 */
export function t(key: TranslationKey): string {
  return translations[activeLanguage]?.[key] ?? key;
}

/**
 * Get the current language code.
 */
export function getCurrentLanguage(): string {
  return activeLanguage;
}

/**
 * (Optional) Function to change language at runtime – to be implemented later.
 */
// export function setLanguage(lang: string) { ... }