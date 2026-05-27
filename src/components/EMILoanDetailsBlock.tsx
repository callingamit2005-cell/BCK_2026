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
const neonBtn = "h-14 rounded-xl bg-white text-background hover:bg-white/90 font-black uppercase text-[10px] tracking-widest transition-all active:scale-[0.98] shadow-lg";

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

  // ==================== PREMIUM UI SYSTEM ====================
  const neonGradientBg = "bg-surface border border-border shadow-sm";
  // TRUE DARK NEON GLASS V2: Butter-Soft Interactive Button
  const neonBtnInteractive = "bg-[#111111] text-white hover:bg-[#111111]/90 shadow-md transition-all duration-300 active:scale-[0.98]";
  const neonText = "text-[#111111] font-mono";
  const brightNeonText = "text-[#111111] font-black font-mono tracking-tighter"; 
  const pinkNeonText = "text-[#666666] font-bold uppercase tracking-widest";
  const glassInside = "bg-background border border-border";

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
      <Card className={cn("rounded-[24px] overflow-hidden relative border shadow-sm transition-all duration-500", neonGradientBg, className)}>
        
        <CardHeader className="pb-4 border-b border-border bg-background/[0.02] relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="space-y-3">
              <CardTitle className={cn("flex items-center gap-3 text-2xl font-black tracking-tighter uppercase", neonText)}>
                <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm">
                  <IndianRupee className="h-6 w-6 text-[#999999]" /> 
                </div>
                {loanDetails.loanType || loanDetails.title || t('emi.loanDetails')}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#999999]">
                <span className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-xl border border-border"><Landmark className="h-3 w-3" /> {loanDetails.bank_app_name || "Unknown Bank"}</span>
                <span className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-xl border border-border font-mono text-[#666666]"><Percent className="h-3 w-3" /> {loanDetails.annualInterestRate}%</span>
                <span className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-xl border border-border font-mono text-[#666666]"><CalendarClock className="h-3 w-3" /> {loanDetails.deduction_date || "5"}th</span>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Badge className={cn("py-1.5 px-4 font-bold uppercase tracking-widest text-[8px] border border-border shadow-sm", isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-[#111111]/10 text-[#666666]")}>
                {isCompleted ? t('emi.completed') : t('emi.active')}
              </Badge>
              <div className="flex items-center ml-2 border-l border-border pl-3 gap-2">
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-11 w-11 text-[#999999] hover:text-[#111111] hover:bg-background rounded-xl border border-transparent transition-all duration-300 active:scale-[0.98]">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-11 w-11 text-[#999999] hover:text-rose-500 hover:bg-background rounded-xl border border-transparent transition-all duration-300 active:scale-[0.98]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-8 relative z-10">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className={cn("font-bold flex items-center gap-2 uppercase tracking-widest text-[9px]", neonText)}>
                <PieChart className="h-4 w-4 text-[#999999]" /> {t('emi.loanProgress', 'Progress')}
              </span>
              <span className={cn("font-black text-sm font-mono text-[#111111]", neonText)}>
                {monthsPaid} / {totalMonths} <span className="text-[#999999] text-[9px] ml-1 uppercase font-sans">{t('emi.months')}</span>
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border">
              <div className={cn("h-full transition-all duration-1500 ease-butter-soft bg-[#111111]")} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className={cn("rounded-2xl p-5 shadow-inner", glassInside)}>
              <p className="text-[8px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-1">{t('emi.principalAmount', 'Principal')}</p>
              <p className={cn("text-xl font-black font-mono tracking-tighter", neonText)}>{formatCurrency(loanDetails.principal)}</p>
            </div>
            <div className={cn("rounded-2xl p-5 shadow-inner", glassInside)}>
              <p className="text-[8px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-1">{t('emi.totalInterest', 'Interest')}</p>
              <p className={cn("text-xl font-black font-mono text-[#666666] tracking-tighter")}>{formatCurrency(summary.totalInterest)}</p>
            </div>
            <div className={cn("rounded-2xl p-5 border border-border bg-background shadow-sm")}>
              <p className="text-[8px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-1">EMI OUTFLOW</p>
              <p className={cn("text-xl font-black font-mono tracking-tighter", brightNeonText)}>{formatCurrency(summary.emi)}</p>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-7 border border-border shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Receipt className="h-24 w-24 text-[#111111]" /></div>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#999999]")}><TrendingUp className="h-4 w-4" /> {t('emi.currentMonthBreakdown', 'Audit')}</p>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-sm"><span className="text-[#999999] font-bold uppercase tracking-widest text-[9px]">{t('emi.principal')}</span><span className={cn("font-black font-mono tracking-tighter", neonText)}>{formatCurrency(summary.principalComponent)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-[#999999] font-bold uppercase tracking-widest text-[9px]">{t('emi.interest')}</span><span className="font-black font-mono text-[#999999] tracking-tighter">{formatCurrency(summary.interestComponent)}</span></div>
              <div className="flex justify-between items-end pt-5 mt-4 border-t border-border"><span className="text-[9px] font-bold text-[#999999] uppercase tracking-widest">Monthly Charge</span><span className={cn("font-black text-3xl font-mono tracking-tighter", brightNeonText)}>{formatCurrency(summary.emi)}</span></div>
            </div>
          </div>

          {/* ✅ ADDED: Prepayment + Foreclosure Simulation UI Block */}
          {!isCompleted && (
            <div className="bg-background rounded-2xl p-7 border border-border shadow-sm relative group overflow-hidden">
              {/* Decorative background icon */}
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Zap className="h-24 w-24 text-[#111111]" />
              </div>

              {/* Section Header */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#666666]">
                <Zap className="h-4 w-4" /> Prepayment &amp; Foreclosure Simulator
              </p>

              {/* Prepayment Input */}
              <div className="space-y-2 mb-6 relative z-10">
                <Label className="text-[#999999] text-[9px] font-bold uppercase tracking-[0.2em] ml-1">
                  Prepayment Amount (₹)
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter amount"
                    className="pl-12 h-14 rounded-xl bg-background border-border text-[#111111] placeholder:text-[#999999] font-mono focus:border-border transition-all text-xl"
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
                <div className={cn("rounded-xl p-5", glassInside)}>
                  <p className="text-[8px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-1">
                    Remaining
                  </p>
                  <p className={cn("text-lg font-black font-mono tracking-tighter", neonText)}>
                    {formatCurrency(prepaymentResult.remainingPrincipal)}
                  </p>
                </div>

                {/* Interest Saved */}
                <div className="rounded-xl p-5 bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[8px] font-bold text-emerald-600/40 uppercase tracking-[0.2em] mb-1">
                    Saved
                  </p>
                  <p className="text-lg font-black font-mono text-emerald-600 tracking-tighter">
                    {formatCurrency(prepaymentResult.interestSaved)}
                  </p>
                </div>

                {/* New Tenure */}
                <div className="rounded-xl p-5 bg-background border border-border">
                  <p className="text-[8px] font-bold text-[#666666] uppercase tracking-[0.2em] mb-1">
                    Tenure
                  </p>
                  <p className="text-lg font-black font-mono text-[#111111] tracking-tighter">
                    {prepaymentResult.newTenure}{" "}
                    <span className="text-[#999999] text-[8px] font-sans uppercase">
                      {t('emi.months')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Foreclosure savings summary line */}
              {prepaymentAmount > 0 && prepaymentResult.interestSaved > 0 && (
                <div className="mt-5 pt-5 border-t border-border flex justify-between items-center relative z-10">
                  <span className="text-[9px] font-bold text-[#999999] uppercase tracking-widest flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-[#999999]" /> Total Interest No Prepay
                  </span>
                  <span className="font-black font-mono text-[#999999] text-sm tracking-tighter">
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
  const neonBtnInteractive = "bg-[#111111] text-white rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-[#111111]/90 active:scale-[0.98] transition-all";

  if (!entry || !entry.loanDetails) {
    return (
      <div className="space-y-4">
        {onSaveNewEMI && (
          <Button onClick={() => setIsAddOpen(true)} className={cn("w-full sm:w-auto", neonBtnInteractive)}>
            <Calculator className="w-4 h-4 mr-3" /> Loan Details
          </Button>
        )}
        <EMIFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={onSaveNewEMI!} />
        <Card className={cn("bg-surface border-dashed border-2 border-border p-10 rounded-[24px] shadow-sm", className)}>
          <div className="flex flex-col items-center text-center gap-4">
            <FileQuestion className="h-10 w-10 text-[#999999]/10" />
            <p className="text-[#999999] font-bold uppercase tracking-widest text-[9px]">No Loan Configuration Found</p>
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

  const inputStyle = "h-14 rounded-xl bg-background border-border text-[#111111] placeholder:text-[#999999] font-mono focus:border-border transition-all shadow-sm";
  const labelStyle = "text-[#999999] text-[9px] font-bold uppercase tracking-[0.2em] ml-1";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl rounded-[32px] p-0 border border-border shadow-2xl overflow-hidden bg-background">
        <DialogDescription className="sr-only">Loan setup form</DialogDescription>
        <div className="h-1 w-full bg-background" />
        
        <div className="p-7 sm:p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-[#111111] uppercase">
              <div className="p-3 bg-background rounded-2xl border border-border">
                <Landmark className="w-7 h-7 text-[#999999]" />
              </div>
              Loan Audit
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
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
                <Input placeholder="e.g. HDFC Bank" className={cn("pl-12", inputStyle)} value={formData.bankName} onChange={(e) => handleChange("bankName", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={labelStyle}>Total Principal (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
                <Input type="number" placeholder="5,00,000" className={cn("pl-12 text-xl font-black font-mono", inputStyle)} value={formData.loanAmount} onChange={(e) => handleChange("loanAmount", e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={labelStyle}>Interest Rate (%)</Label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
                <Input type="number" step="0.1" placeholder="8.5" className={cn("pl-12 text-xl font-black font-mono", inputStyle)} value={formData.interestRate} onChange={(e) => handleChange("interestRate", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Tenure (Months)</Label>
              <Input type="number" placeholder="60" className={cn("text-xl font-black font-mono", inputStyle)} value={formData.tenureMonths} onChange={(e) => handleChange("tenureMonths", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className={labelStyle}>Interest Logic</Label>
              <RadioGroup defaultValue="REDUCING" value={formData.interestType} onValueChange={(v) => handleChange("interestType", v)} className="flex gap-4 h-14">
                <div className="flex items-center space-x-2 bg-background px-4 rounded-xl border border-border flex-1">
                  <RadioGroupItem value="REDUCING" id="red" className="text-[#111111]" />
                  <Label htmlFor="red" className="text-[#111111] text-[10px] font-bold uppercase cursor-pointer">Reducing</Label>
                </div>
                <div className="flex items-center space-x-2 bg-background px-4 rounded-xl border border-border flex-1">
                  <RadioGroupItem value="FLAT" id="flt" className="text-[#111111]" />
                  <Label htmlFor="flt" className="text-[#111111] text-[10px] font-bold uppercase cursor-pointer">Flat</Label>
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

          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 h-14 font-bold uppercase tracking-widest text-[#999999] rounded-xl hover:bg-background transition-all duration-300 active:scale-[0.98]">Cancel</button>
            <Button onClick={handleCalculateAndSave} className={cn("flex-1 h-14 font-black uppercase tracking-widest text-white bg-[#111111] rounded-xl hover:bg-[#111111]/90 active:scale-[0.98] shadow-lg")}>
              <Check className="w-5 h-5 mr-3" /> {initialData ? "Save Changes" : "Commit Audit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EMILoanDetailsBlock;
