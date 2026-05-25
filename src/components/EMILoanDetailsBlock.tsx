/**
 * EMILoanDetailsBlock.tsx - BachatKaro Neon Enterprise Edition
 * UI: Deep Pink/Purple Neon Gradient Background with High-Contrast Neon Text.
 * 🛡️ LOGIC LOCK: Math, Form Logic, & Supabase Mappings 100% untouched.
 * FIX: Updated wording and added Bank/EMI Date fields. True Dark Neon styling applied.
 * ✅ ADDED: Prepayment + Foreclosure Simulation Engine (bank-level accuracy)
 */

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast"; 
import { 
  IndianRupee, Calendar, Percent, PieChart, FileQuestion, Trash2,
  Calculator, Landmark, TrendingUp, Receipt, Pencil, CalendarClock, Check, Info,
  Zap // ✅ ADDED: Icon for prepayment section
} from "lucide-react";
import type { EMIEntry } from "@/types/emi";
import { getLoanSummary, getMonthsPaid, formatCurrency } from "@/utils/loanCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { saveAndSync } from "@/integrations/sqliteService";

// TRUE DARK NEON GLASS V2: Standard Neon Button with Butter-Soft Physics
const neonBtn = "px-6 py-2 rounded-xl font-bold transition-all duration-300 ease-butter-soft active:scale-[0.965] bg-[#ff0f7b] text-white shadow-[0_0_15px_rgba(255,15,123,0.4)]";

// ==================== ✅ ADDED: PREPAYMENT + FORECLOSURE ENGINE ====================

/**
 * calculateLoanWithPrepayment
 * Bank-level amortization engine with prepayment simulation.
 * Loops month-by-month, applies lump-sum prepayment at the current month,
 * and returns remaining principal, interest saved, and new tenure.
 *
 * @param principal       - Original loan principal (₹)
 * @param annualRate      - Annual interest rate (%)
 * @param tenureMonths    - Original tenure in months
 * @param monthsPaid      - Number of EMIs already paid
 * @param prepayment      - Lump-sum prepayment amount (₹)
 * @returns               - { remainingPrincipal, interestSaved, newTenure, originalInterestRemaining, newMonthlyEMI }
 */
function calculateLoanWithPrepayment({
  principal,
  annualRate,
  tenureMonths,
  monthsPaid,
  prepayment,
}: {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  monthsPaid: number;
  prepayment: number;
}): {
  remainingPrincipal: number;
  interestSaved: number;
  newTenure: number;
  originalInterestRemaining: number;
  newMonthlyEMI: number;
} {
  // Safe default result to return on any error or edge case
  const safeDefault = {
    remainingPrincipal: 0,
    interestSaved: 0,
    newTenure: 0,
    originalInterestRemaining: 0,
    newMonthlyEMI: 0,
  };

  try {
    // ── Number safety: coerce & validate all inputs ──
    const P = Math.max(0, Number(principal) || 0);
    const R = Math.max(0, Number(annualRate) || 0);
    const N = Math.max(1, Math.round(Number(tenureMonths) || 1));
    const paid = Math.max(0, Math.min(N, Math.round(Number(monthsPaid) || 0)));
    const prepay = Math.max(0, Number(prepayment) || 0);

    // Guard: zero principal or rate means nothing to compute
    if (P <= 0 || R <= 0) return safeDefault;

    const monthlyRate = R / 12 / 100;

    // Guard: prevent division by zero or Infinity in EMI formula
    if (!isFinite(monthlyRate) || monthlyRate <= 0) return safeDefault;

    const ratePow = Math.pow(1 + monthlyRate, N);
    if (!isFinite(ratePow) || ratePow <= 1) return safeDefault;

    // Original EMI (reducing balance formula)
    const originalEMI = (P * monthlyRate * ratePow) / (ratePow - 1);
    if (!isFinite(originalEMI) || originalEMI <= 0) return safeDefault;

    // ── Phase 1: Simulate amortization for months already paid ──
    let balance = P;
    for (let m = 1; m <= paid; m++) {
      const interestForMonth = balance * monthlyRate;
      const principalForMonth = originalEMI - interestForMonth;
      balance = Math.max(0, balance - principalForMonth);
    }

    // Balance after paid months (without prepayment)
    const balanceWithoutPrepay = balance;

    // ── Phase 2: Compute original interest remaining (no prepayment) ──
    let originalInterestRemaining = 0;
    {
      let tempBal = balanceWithoutPrepay;
      const remainingMonths = N - paid;
      for (let m = 1; m <= remainingMonths; m++) {
        if (tempBal <= 0) break;
        const iMonth = tempBal * monthlyRate;
        const pMonth = Math.min(originalEMI - iMonth, tempBal);
        originalInterestRemaining += Math.max(0, iMonth);
        tempBal = Math.max(0, tempBal - pMonth);
      }
    }

    // ── Phase 3: Apply prepayment at current month ──
    const balanceAfterPrepay = Math.max(0, balanceWithoutPrepay - prepay);

    // If loan is fully paid off by prepayment
    if (balanceAfterPrepay <= 0) {
      return {
        remainingPrincipal: 0,
        interestSaved: Math.max(0, originalInterestRemaining),
        newTenure: 0,
        originalInterestRemaining: Math.max(0, originalInterestRemaining),
        newMonthlyEMI: 0,
      };
    }

    // ── Phase 4: Compute new interest remaining after prepayment ──
    let newInterestRemaining = 0;
    let newTenure = 0;
    {
      let tempBal = balanceAfterPrepay;
      // Recalculate EMI on new balance for remaining original tenure
      const remainingOriginalTenure = Math.max(1, N - paid);
      const newRatePow = Math.pow(1 + monthlyRate, remainingOriginalTenure);
      const newEMI = isFinite(newRatePow) && newRatePow > 1
        ? (balanceAfterPrepay * monthlyRate * newRatePow) / (newRatePow - 1)
        : originalEMI;

      // Count actual months needed with original EMI (tenure reduction mode)
      let countMonths = 0;
      let tempBal2 = balanceAfterPrepay;
      const MAX_MONTHS = N * 2; // safety cap
      while (tempBal2 > 0.01 && countMonths < MAX_MONTHS) {
        const iMonth = tempBal2 * monthlyRate;
        if (originalEMI <= iMonth) {
          // EMI cannot cover interest — break to prevent infinite loop
          countMonths = remainingOriginalTenure;
          break;
        }
        const pMonth = Math.min(originalEMI - iMonth, tempBal2);
        newInterestRemaining += Math.max(0, iMonth);
        tempBal2 = Math.max(0, tempBal2 - pMonth);
        countMonths++;
      }
      newTenure = Math.max(0, countMonths);
    }

    const interestSaved = Math.max(0, originalInterestRemaining - newInterestRemaining);

    // Recompute new EMI on reduced balance (same tenure)
    const remainingTenureForEMI = Math.max(1, N - paid);
    const newRatePow2 = Math.pow(1 + monthlyRate, remainingTenureForEMI);
    const newMonthlyEMI = isFinite(newRatePow2) && newRatePow2 > 1
      ? (balanceAfterPrepay * monthlyRate * newRatePow2) / (newRatePow2 - 1)
      : 0;

    return {
      remainingPrincipal: Math.round(Math.max(0, balanceAfterPrepay)),
      interestSaved: Math.round(Math.max(0, interestSaved)),
      newTenure: Math.max(0, newTenure),
      originalInterestRemaining: Math.round(Math.max(0, originalInterestRemaining)),
      newMonthlyEMI: Math.round(Math.max(0, newMonthlyEMI)),
    };
  } catch (_err) {
    // Never crash — return safe defaults
    return safeDefault;
  }
}

// ==================== END: PREPAYMENT + FORECLOSURE ENGINE ====================

// ==================== LOAN DETAILS CONTENT COMPONENT ====================

interface LoanDetailsContentProps {
  entry: EMIEntry;
  loanDetails: NonNullable<EMIEntry['loanDetails']>;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const LoanDetailsContent: React.FC<LoanDetailsContentProps> = ({
  entry,
  loanDetails,
  onDelete,
  onEdit,
  className,
}) => {
  const { t } = useLanguage();

  // ==================== DEEP NEON UI SYSTEM ====================
  const neonGradientBg = "bg-gradient-to-br from-[#1E1B4B] via-[#701A75] to-[#EC4899]";
  // TRUE DARK NEON GLASS V2: Butter-Soft Interactive Button
  const neonBtnInteractive = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all duration-300 ease-butter-soft active:scale-[0.965]";
  const neonText = "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]";
  const brightNeonText = "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] font-black"; 
  const pinkNeonText = "text-pink-300 drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]";
  const glassInside = "bg-black/20 border border-white/10 backdrop-blur-md";

  const monthsPaid = useMemo(() => loanDetails.startDate ? getMonthsPaid(loanDetails.startDate) : 0, [loanDetails.startDate]);
  const summary = useMemo(() => getLoanSummary({
    principal: loanDetails.principal,
    annualRate: loanDetails.annualInterestRate,
    tenureMonths: loanDetails.totalMonths,
    monthsPaid,
    interestCalculationType: loanDetails.interestCalculationType || 'REDUCING',
  }), [loanDetails, monthsPaid]);

  const totalMonths = loanDetails.totalMonths || 0;
  const progressPercent = Math.min(100, Math.max(0, (monthsPaid / totalMonths) * 100));
  const isCompleted = summary.monthsRemaining <= 0;

  // ✅ ADDED: Prepayment state
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);

  // ✅ ADDED: Memoized prepayment simulation
  const prepaymentResult = useMemo(() => {
    return calculateLoanWithPrepayment({
      principal: Number(loanDetails?.principal) || 0,
      annualRate: Number(loanDetails?.annualInterestRate) || 0,
      tenureMonths: Number(loanDetails?.totalMonths) || 0,
      monthsPaid: Number(monthsPaid || 0),
      prepayment: Number(prepaymentAmount || 0),
    });
  }, [loanDetails, monthsPaid, prepaymentAmount]);

  return (
    <div className="space-y-4">
      <Card className={cn("rounded-[36px] overflow-hidden relative border-white/10 shadow-2xl transition-all duration-500", neonGradientBg, className)}>
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none" />
        
        <CardHeader className="pb-4 border-b border-white/10 bg-black/20 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="space-y-3">
              <CardTitle className={cn("flex items-center gap-3 text-2xl font-black tracking-tighter uppercase", neonText)}>
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 shadow-lg">
                  <IndianRupee className="h-6 w-6 text-pink-300" /> 
                </div>
                {loanDetails.loanType || loanDetails.title || t('emi.loanDetails')}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"><Landmark className="h-3 w-3" /> {loanDetails.bank_app_name || "Unknown Bank"}</span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-white"><Percent className="h-3 w-3" /> {loanDetails.annualInterestRate}%</span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-white"><CalendarClock className="h-3 w-3" /> {loanDetails.deduction_date || "5"}th</span>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Badge className={cn("py-1.5 px-4 font-black uppercase tracking-widest text-[9px] border border-white/20 shadow-lg", isCompleted ? "bg-emerald-500/30 text-emerald-300" : "bg-blue-500/30 text-blue-200")}>
                {isCompleted ? t('emi.completed') : t('emi.active')}
              </Badge>
              <div className="flex items-center ml-2 border-l border-white/20 pl-3 gap-2">
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-11 w-11 text-white/50 hover:text-white hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300 ease-butter-soft active:scale-[0.965]">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-11 w-11 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-2xl border border-white/5 transition-all duration-300 ease-butter-soft active:scale-[0.965]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-8 relative z-10">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className={cn("font-black flex items-center gap-2 uppercase tracking-widest text-[10px]", neonText)}>
                <PieChart className="h-4 w-4 text-pink-300" /> {t('emi.loanProgress', 'Progress')}
              </span>
              <span className={cn("font-black text-sm font-mono text-white", neonText)}>
                {monthsPaid} / {totalMonths} <span className="text-white/40 text-[9px] ml-1 uppercase font-sans">{t('emi.months')}</span>
              </span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden shadow-inner border border-white/5">
              <div className={cn("h-full transition-all duration-1500 ease-out relative bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] shadow-[0_0_20px_rgba(236,72,153,0.4)]")} style={{ width: `${progressPercent}%` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className={cn("rounded-3xl p-5 shadow-inner", glassInside)}>
              <p className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-[0.2em] mb-2">{t('emi.principalAmount', 'Principal')}</p>
              <p className={cn("text-xl font-black font-mono", neonText)}>{formatCurrency(loanDetails.principal)}</p>
            </div>
            <div className={cn("rounded-3xl p-5 shadow-inner", glassInside)}>
              <p className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em] mb-2">{t('emi.totalInterest', 'Interest')}</p>
              <p className="text-xl font-black font-mono text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">{formatCurrency(summary.totalInterest)}</p>
            </div>
            <div className={cn("rounded-3xl p-5 border border-purple-500/30 bg-purple-500/10 shadow-lg")}>
              <p className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-[0.2em] mb-2">EMI OUTFLOW</p>
              <p className={cn("text-xl font-black font-mono", brightNeonText)}>{formatCurrency(summary.emi)}</p>
            </div>
          </div>

          <div className="bg-black/50 rounded-[32px] p-7 border border-white/10 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-all duration-1000"><Receipt className="h-32 w-32 text-white" /></div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2", pinkNeonText)}><TrendingUp className="h-4 w-4" /> {t('emi.currentMonthBreakdown', 'Audit')}</p>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-sm"><span className="text-[#b3b3b3] font-bold uppercase tracking-widest text-[10px]">{t('emi.principal')}</span><span className={cn("font-black font-mono", neonText)}>{formatCurrency(summary.principalComponent)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-[#b3b3b3] font-bold uppercase tracking-widest text-[10px]">{t('emi.interest')}</span><span className="font-black font-mono text-rose-400">{formatCurrency(summary.interestComponent)}</span></div>
              <div className="flex justify-between items-center pt-5 mt-5 border-t border-white/10"><span className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-widest">Total Monthly Charge</span><span className={cn("font-black text-3xl font-mono", brightNeonText)}>{formatCurrency(summary.emi)}</span></div>
            </div>
          </div>

          {/* ✅ ADDED: Prepayment + Foreclosure Simulation UI Block */}
          {!isCompleted && (
            <div className="bg-black/50 rounded-[32px] p-7 border border-[#7C3AED]/30 shadow-2xl relative group overflow-hidden">
              {/* Decorative background icon */}
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-all duration-1000">
                <Zap className="h-32 w-32 text-yellow-300" />
              </div>

              {/* Section Header */}
              <p className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]">
                <Zap className="h-4 w-4" /> Prepayment &amp; Foreclosure Simulator
              </p>

              {/* Prepayment Input */}
              <div className="space-y-2 mb-6 relative z-10">
                <Label className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.2em] ml-1">
                  Lump-Sum Prepayment Amount (₹)
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter prepayment amount"
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono focus:border-[#EC4899] focus:ring-[#EC4899]/20 transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)] text-xl"
                    value={prepaymentAmount === 0 ? "" : prepaymentAmount}
                    onChange={(e) =>
                      setPrepaymentAmount(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                {/* Remaining Loan */}
                <div className={cn("rounded-3xl p-5 shadow-inner", glassInside)}>
                  <p className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-[0.2em] mb-2">
                    Remaining Loan
                  </p>
                  <p className={cn("text-xl font-black font-mono", neonText)}>
                    {formatCurrency(prepaymentResult.remainingPrincipal)}
                  </p>
                </div>

                {/* Interest Saved */}
                <div className="rounded-3xl p-5 shadow-inner bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-2">
                    Interest Saved
                  </p>
                  <p className="text-xl font-black font-mono text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                    {formatCurrency(prepaymentResult.interestSaved)}
                  </p>
                </div>

                {/* New Tenure */}
                <div className="rounded-3xl p-5 shadow-inner bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-[10px] font-black text-yellow-300 uppercase tracking-[0.2em] mb-2">
                    New Tenure
                  </p>
                  <p className="text-xl font-black font-mono text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]">
                    {prepaymentResult.newTenure}{" "}
                    <span className="text-yellow-300/50 text-[10px] font-sans uppercase">
                      {t('emi.months')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Foreclosure savings summary line */}
              {prepaymentAmount > 0 && prepaymentResult.interestSaved > 0 && (
                <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-center relative z-10">
                  <span className="text-[10px] font-black text-[#b3b3b3] uppercase tracking-widest flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-white/30" /> Total Interest Without Prepayment
                  </span>
                  <span className="font-black font-mono text-white/40 text-sm">
                    {formatCurrency(prepaymentResult.originalInterestRemaining)}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* ✅ END ADDED: Prepayment + Foreclosure Simulation UI Block */}

        </CardContent>
      </Card>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

interface EMILoanDetailsBlockProps {
  entry?: EMIEntry | null;
  onDelete?: () => void;
  onEdit?: () => void; 
  onSaveNewEMI?: (emiData: any) => void; 
  className?: string;
}

export const EMILoanDetailsBlock: React.FC<EMILoanDetailsBlockProps> = ({
  entry, onDelete, onEdit, onSaveNewEMI, className = "",
}) => {
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const neonBtnInteractive = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all duration-300 ease-butter-soft active:scale-[0.965]";

  if (!entry || !entry.loanDetails) {
    return (
      <div className="space-y-4">
        {onSaveNewEMI && (
          <Button onClick={() => setIsAddOpen(true)} className={cn("w-full sm:w-auto h-14 font-black rounded-[20px] tracking-widest uppercase", neonBtnInteractive)}>
            <Calculator className="w-5 h-5 mr-3" /> Loan and EMI Details
          </Button>
        )}
        <EMIFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={onSaveNewEMI!} />
        <Card className={cn("bg-black/40 border-dashed border-2 border-white/10 p-10 rounded-[32px] backdrop-blur-sm", className)}>
          <div className="flex flex-col items-center text-center gap-4">
            <FileQuestion className="h-12 w-12 text-white/20" />
            <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">No Loan Configuration Found</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <LoanDetailsContent 
      entry={entry} 
      loanDetails={entry.loanDetails} 
      onDelete={onDelete} 
      onEdit={onEdit} 
      className={className} 
    />
  );
};

// ==================== NEON FORM MODAL ====================

interface EMIFormModalProps {
  isOpen: boolean; onClose: () => void; onSave: (data: any) => void; initialData?: any; 
}

const EMIFormModal: React.FC<EMIFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    loanName: "", loanAmount: "", interestRate: "", tenureMonths: "", startDate: "", bankName: "", interestType: "REDUCING", emiDate: "", 
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        loanName: initialData.title || initialData.loanType || "",
        loanAmount: initialData.principal?.toString() || "",
        interestRate: (initialData.annualInterestRate || initialData.annual_rate)?.toString() || "",
        tenureMonths: (initialData.totalMonths || initialData.tenure_months)?.toString() || "",
        startDate: initialData.startDate || initialData.start_date || "",
        bankName: initialData.bank_app_name || "",
        interestType: initialData.interestCalculationType || initialData.interest_type || "REDUCING",
        emiDate: initialData.emiDate || initialData.deduction_date?.toString() || "",
      });
    } else if (!initialData && isOpen) {
      setFormData({ loanName: "", loanAmount: "", interestRate: "", tenureMonths: "", startDate: "", bankName: "", interestType: "REDUCING", emiDate: "" });
    }
  }, [initialData, isOpen]);

  const handleChange = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

    const handleCalculateAndSave = () => {
    const P = parseFloat(formData.loanAmount);
    const R = parseFloat(formData.interestRate);
    const N = parseInt(formData.tenureMonths);
    const emiDay = parseInt(formData.emiDate);

    if (!P || isNaN(R) || !N || !formData.startDate || !formData.loanName || isNaN(emiDay)) {
      toast({ title: "Incomplete Details", description: "All fields are required. Ensure numeric fields are valid.", variant: "destructive" });
      return;
    }

    if (emiDay < 1 || emiDay > 31) {
      toast({ title: "Invalid EMI Day", description: "EMI Day must be between 1 and 31.", variant: "destructive" });
      return;
    }

    let calculatedEMI = 0;
    const monthlyRate = R / 12 / 100;
    if (formData.interestType === "REDUCING") {
      if (R === 0) {
        calculatedEMI = P / N;
      } else {
        calculatedEMI = (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1);
      }
    } else {
      const totalInterest = (P * R * (N / 12)) / 100;
      calculatedEMI = (P + totalInterest) / N;
    }

    // 🛡️ [PAYLOAD_CONTRACT_NORMALIZATION]
    // Standardizes data to match Dashboard.tsx and persistence layer requirements.
    onSave({
      id: initialData?.id,
      name: formData.loanName,
      title: formData.loanName, 
      loanType: formData.loanName, 
      bank_app_name: formData.bankName,
      principal: P, 
      annualInterestRate: R, 
      totalMonths: N, 
      startDate: formData.startDate,
      emiDate: emiDay, 
      emi_day: emiDay,
      deduction_date: emiDay,
      interestCalculationType: formData.interestType, 
      monthly_emi: Math.round(calculatedEMI)
    });

    toast({ title: "Operation Successful! 🚀", className: "bg-emerald-600 text-white border-none shadow-lg" });
    onClose();
  };

  const inputStyle = "h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono focus:border-[#EC4899] focus:ring-[#EC4899]/20 transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)]";
  const labelStyle = "text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.2em] ml-1";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl rounded-[36px] p-0 border border-[#ff0f7b]/30 shadow-2xl overflow-hidden bg-[#0F0C29] backdrop-blur-[32px]">
        <DialogDescription className="sr-only">Loan setup and editing form for entering principal, interest, and tenure details.</DialogDescription>
        <div className="h-2 w-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF]" />
        
        <div className="p-7 sm:p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] uppercase">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                <Landmark className="w-7 h-7 text-pink-400" />
              </div>
              Loan and EMI Details
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 sm:col-span-2">
              <Label className={labelStyle}>Loan Title</Label>
              <Input placeholder="e.g. Dream Home Loan" className={inputStyle} value={formData.loanName} onChange={(e) => handleChange("loanName", e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className={labelStyle}>Bank Name/App Name</Label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input placeholder="e.g. HDFC Bank or KreditBee" className={cn("pl-12", inputStyle)} value={formData.bankName} onChange={(e) => handleChange("bankName", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={labelStyle}>Total Principal (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input type="number" placeholder="5,00,000" className={cn("pl-12 text-xl", inputStyle)} value={formData.loanAmount} onChange={(e) => handleChange("loanAmount", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={labelStyle}>Interest Rate (%)</Label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input type="number" step="0.1" placeholder="8.5" className={cn("pl-12 text-xl", inputStyle)} value={formData.interestRate} onChange={(e) => handleChange("interestRate", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Tenure (Months)</Label>
              <Input type="number" placeholder="60" className={cn("text-xl", inputStyle)} value={formData.tenureMonths} onChange={(e) => handleChange("tenureMonths", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Interest Logic</Label>
              <RadioGroup defaultValue="REDUCING" value={formData.interestType} onValueChange={(v) => handleChange("interestType", v)} className="flex gap-4 h-14">
                <div className="flex items-center space-x-2 bg-white/5 px-4 rounded-2xl border border-white/10 flex-1">
                  <RadioGroupItem value="REDUCING" id="red" className="text-pink-500" />
                  <Label htmlFor="red" className="text-white text-xs font-bold uppercase cursor-pointer">Reducing</Label>
                </div>
                <div className="flex items-center space-x-2 bg-white/5 px-4 rounded-2xl border border-white/10 flex-1">
                  <RadioGroupItem value="FLAT" id="flt" className="text-pink-500" />
                  <Label htmlFor="flt" className="text-white text-xs font-bold uppercase cursor-pointer">Flat</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Inception Date</Label>
              <Input type="date" className={inputStyle} value={formData.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Monthly EMI Day</Label>
              <Input type="number" min="1" max="31" className={inputStyle} value={formData.emiDate} onChange={(e) => handleChange("emiDate", e.target.value)} placeholder="1-31" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 h-14 font-black uppercase tracking-widest text-[#b3b3b3] rounded-2xl hover:bg-white/5 transition-all duration-300 ease-butter-soft active:scale-[0.965]">Cancel</button>
            <Button onClick={handleCalculateAndSave} className={cn("flex-1 h-14 font-black uppercase tracking-widest text-white rounded-2xl", neonBtn)}>
              <Check className="w-5 h-5 mr-3" /> {initialData ? "Save Changes" : "Setup Loan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EMILoanDetailsBlock;
