/**
 * Loan calculation utilities supporting both reducing balance and flat interest methods.
 * All functions are pure and memoization-friendly.
 * 
 * @packageDocumentation
 */

import { InterestCalculationType } from '@/types/emi';

/**
 * Parameters required for loan summary calculation.
 */
export interface LoanSummaryParams {
  /** Original principal amount */
  principal: number;
  /** Annual interest rate as a percentage (e.g., 9 for 9%) */
  annualRate: number;
  /** Total loan tenure in months */
  tenureMonths: number;
  /** Number of months already paid */
  monthsPaid: number;
  /** Interest calculation method */
  interestCalculationType?: InterestCalculationType;
}

/**
 * Result of loan summary calculation.
 */
export interface LoanSummary {
  /** Calculated monthly EMI amount */
  emi: number;
  /** Total interest payable over the full tenure */
  totalInterest: number;
  /** Outstanding balance after monthsPaid */
  outstandingBalance: number;
  /** Principal component of current month's EMI */
  principalComponent: number;
  /** Interest component of current month's EMI */
  interestComponent: number;
  /** Months remaining until loan is fully paid */
  monthsRemaining: number;
}

/**
 * Calculates the number of months paid since the start date.
 * If startDate is missing or invalid, returns 0.
 * 
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @returns Number of full months elapsed (0 if no start date)
 */
export function getMonthsPaid(startDate?: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  if (isNaN(start.getTime())) return 0;

  const yearsDiff = now.getFullYear() - start.getFullYear();
  const monthsDiff = now.getMonth() - start.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;
  return Math.max(0, totalMonths);
}

/**
 * Formats a number as Indian currency (₹).
 * 
 * @param amount - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

/**
 * Calculates monthly interest rate as decimal.
 */
function monthlyRate(annualRate: number): number {
  return annualRate / 12 / 100;
}

/**
 * Calculates EMI using reducing balance method.
 */
function calculateReducingEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;

  const r = monthlyRate(annualRate);
  const n = tenureMonths;
  const denominator = Math.pow(1 + r, n) - 1;
  if (Math.abs(denominator) < 1e-12) return principal / n; // effectively zero interest
  const emi = principal * r * Math.pow(1 + r, n) / denominator;
  return round2(emi);
}

/**
 * Calculates outstanding balance for reducing balance method.
 */
function reducingOutstandingBalance(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsPaid: number
): number {
  if (tenureMonths <= 0) return 0;
  const m = Math.min(monthsPaid, tenureMonths);

  if (annualRate === 0) {
    const monthlyPrincipal = principal / tenureMonths;
    return Math.max(0, principal - monthlyPrincipal * m);
  }

  const r = monthlyRate(annualRate);
  const n = tenureMonths;
  const denominator = Math.pow(1 + r, n) - 1;
  if (Math.abs(denominator) < 1e-12) return principal;

  const numerator = principal * (Math.pow(1 + r, n) - Math.pow(1 + r, m));
  const ob = numerator / denominator;
  return round2(Math.max(0, ob));
}

/**
 * Calculates interest and principal components for reducing balance method.
 */
function reducingCurrentMonthBreakdown(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsPaid: number
): { principal: number; interest: number } {
  if (tenureMonths <= 0 || monthsPaid >= tenureMonths) {
    return { principal: 0, interest: 0 };
  }

  if (annualRate === 0) {
    const monthlyPrincipal = principal / tenureMonths;
    return { principal: monthlyPrincipal, interest: 0 };
  }

  const obPrev = reducingOutstandingBalance(principal, annualRate, tenureMonths, monthsPaid);
  if (obPrev <= 0.01) return { principal: 0, interest: 0 };

  const r = monthlyRate(annualRate);
  const emi = calculateReducingEMI(principal, annualRate, tenureMonths);
  const interest = obPrev * r;
  const principalPart = emi - interest;

  return {
    principal: round2(Math.max(0, principalPart)),
    interest: round2(Math.max(0, interest)),
  };
}

/**
 * Calculates total interest for flat rate method.
 */
function flatTotalInterest(principal: number, annualRate: number, tenureMonths: number): number {
  const years = tenureMonths / 12;
  return principal * (annualRate / 100) * years;
}

/**
 * Calculates EMI for flat rate method.
 */
function calculateFlatEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0;
  const totalInterest = flatTotalInterest(principal, annualRate, tenureMonths);
  const totalAmount = principal + totalInterest;
  return totalAmount / tenureMonths;
}

/**
 * Calculates outstanding balance for flat rate method.
 */
function flatOutstandingBalance(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsPaid: number
): number {
  if (tenureMonths <= 0) return 0;
  const m = Math.min(monthsPaid, tenureMonths);
  const emi = calculateFlatEMI(principal, annualRate, tenureMonths);
  const totalAmount = emi * tenureMonths;
  const paidSoFar = emi * m;
  return Math.max(0, totalAmount - paidSoFar);
}

/**
 * Calculates current month breakdown for flat rate method.
 * In flat rate, interest component is constant each month.
 */
function flatCurrentMonthBreakdown(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsPaid: number
): { principal: number; interest: number } {
  if (tenureMonths <= 0 || monthsPaid >= tenureMonths) {
    return { principal: 0, interest: 0 };
  }

  const totalInterest = flatTotalInterest(principal, annualRate, tenureMonths);
  const monthlyInterest = totalInterest / tenureMonths;
  const emi = calculateFlatEMI(principal, annualRate, tenureMonths);
  const monthlyPrincipal = emi - monthlyInterest;

  return {
    principal: round2(Math.max(0, monthlyPrincipal)),
    interest: round2(Math.max(0, monthlyInterest)),
  };
}

/**
 * Rounds a number to two decimal places.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates comprehensive loan summary including EMI, outstanding balance,
 * interest components, and remaining months.
 * 
 * Supports both reducing balance and flat interest calculation methods.
 * Defaults to reducing balance if not specified.
 */
export function getLoanSummary(params: LoanSummaryParams): LoanSummary {
  const {
    principal,
    annualRate,
    tenureMonths,
    monthsPaid: rawMonthsPaid,
    interestCalculationType = 'REDUCING',
  } = params;

  // Guard against invalid inputs
  if (principal <= 0 || tenureMonths <= 0 || annualRate < 0) {
    return {
      emi: 0,
      totalInterest: 0,
      outstandingBalance: 0,
      principalComponent: 0,
      interestComponent: 0,
      monthsRemaining: 0,
    };
  }

  const monthsPaid = Math.min(rawMonthsPaid, tenureMonths);
  const monthsRemaining = Math.max(0, tenureMonths - monthsPaid);

  if (interestCalculationType === 'FLAT') {
    const emi = calculateFlatEMI(principal, annualRate, tenureMonths);
    const totalInterest = flatTotalInterest(principal, annualRate, tenureMonths);
    const outstandingBalance = flatOutstandingBalance(principal, annualRate, tenureMonths, monthsPaid);
    const { principal: principalComponent, interest: interestComponent } = flatCurrentMonthBreakdown(
      principal,
      annualRate,
      tenureMonths,
      monthsPaid
    );

    return {
      emi,
      totalInterest,
      outstandingBalance,
      principalComponent,
      interestComponent,
      monthsRemaining,
    };
  } else {
    // Reducing balance (default)
    const emi = calculateReducingEMI(principal, annualRate, tenureMonths);
    const totalInterest = emi * tenureMonths - principal;
    const outstandingBalance = reducingOutstandingBalance(principal, annualRate, tenureMonths, monthsPaid);
    const { principal: principalComponent, interest: interestComponent } = reducingCurrentMonthBreakdown(
      principal,
      annualRate,
      tenureMonths,
      monthsPaid
    );

    return {
      emi,
      totalInterest: round2(Math.max(0, totalInterest)),
      outstandingBalance,
      principalComponent,
      interestComponent,
      monthsRemaining,
    };
  }
}