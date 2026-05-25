import { useMemo, useState, useEffect, useCallback, lazy, Suspense, memo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus, Sparkles, BrainCircuit, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Core System Components
import AppHeader from '@/components/layout/AppHeader';
import DashboardSubheader from '@/components/layout/DashboardSubheader';
import RecentExpenses from '@/components/dashboard/RecentExpenses';

const CategoryChart = lazy(() => import('@/components/dashboard/CategoryChart'));
const SmartFinancialMentor = lazy(() => import('@/components/dashboard/SmartFinancialMentor'));
const MarketIntelligence = lazy(() => import('@/components/dashboard/MarketIntelligence'));
import FinancialHealthScore from '@/components/dashboard/FinancialHealthScore';
const FutureWealthPredictor = lazy(() => import('@/components/dashboard/FutureWealthPredictor'));
const GoalProgress = lazy(() => import('@/components/dashboard/GoalProgress'));
const BudgetPulse = lazy(() => import('@/components/dashboard/BudgetPulse'));
const SmartUniversalInput = memo(lazy(() => import('@/components/SmartUniversalInput')));
const MonthlyComparison = lazy(() => import('@/features/dashboard-analytics/MonthlyComparison'));
import DateFilter, { type DateFilterValue } from '@/components/dashboard/DateFilter';
import { isCurrentMonth, isLastMonth, isValidDate, safeDate } from '@/utils/dateFilters';

// Utils
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, convertToRupees } from '@/utils/currencyFormatter';
import { useI18nNamespaces } from "@/hooks/useI18nNamespaces";
import { cn } from "@/lib/utils";
import {
  getLedgerRetentionMessage,
  getLedgerWindow,
  purgeExpiredCloudLedgerData,
} from '@/features/transactions/ledger';
import { hasPremiumAccess } from '@/features/premium/access';

import { fetchLocalOrCloud, saveAndSync, deleteAndSync } from '@/integrations/sqliteService';
import { getDB, enqueueSync } from '@/integrations/sqlite';

// Native Bridge
import {
  purgeExpiredNativeTransactions,
} from '@/integrations/smsBridge';

// AI Intelligence
import { getRichStructuredAIAdvice } from '@/utils/smartAdvisor';
import { predictMonthlySpend } from '@/utils/predictionEngine';
import { getOverspendingAlerts } from '@/utils/alertEngine';

// Hooks & Helpers
import { DashboardTransaction, getSalaryAmount, SalaryRecord } from '@/utils/dashboardHelpers';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { restoreService } from '@/services/restoreService';
import { Capacitor } from '@capacitor/core';

// Cards
import { AIInsightsCard } from '@/components/dashboard/cards/AIInsightsCard';
import { MonthlySnapshotCard } from '@/components/dashboard/cards/MonthlySnapshotCard';
import { IncomeEngineCard } from '@/components/dashboard/cards/IncomeEngineCard';
import { SafeSpendCard } from '@/components/dashboard/cards/SafeSpendCard';
import { DebtLedgerSection } from '@/components/dashboard/cards/DebtLedgerSection';

// Forensic Lab (Isolated)
const ForensicDashboard = lazy(() => import('@/test/forensic/ForensicDashboard'));

import { forensicEngine } from '@/test/forensic/validationSuite';

const Dashboard = () => {
  if (process.env.NODE_ENV === 'development') {
    forensicEngine.trackRender('Dashboard');
  }
  console.log('[Dashboard_Forensic] Component Executing');
  const { user } = useAuth();
  console.log('[Dashboard_Forensic] Auth state:', { hasUser: !!user });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  useI18nNamespaces(["dashboard", "common", "savings", "split"]);

  const now = useMemo(() => {
    console.log('[Dashboard_Forensic] useMemo: now');
    return new Date();
  }, []);
  const currentMonthYear = format(now, 'yyyy-MM');
  console.log('[Dashboard_Forensic] currentMonthYear:', currentMonthYear);
  const ledgerWindow = useMemo(() => getLedgerWindow(user?.created_at, now), [user?.created_at, now]);
  const retentionMessage = useMemo(
    () => getLedgerRetentionMessage(ledgerWindow),
    [ledgerWindow],
  );
  const canReadSms = hasPremiumAccess(user, 'sms');

  // --- UI NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<'daily' | 'planning' | 'future' | 'dreams'>('daily');
  const [salaryInput, setSalaryInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ preset: 'this_month' });
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSQLiteReady, setIsSQLiteReady] = useState(false);

  useEffect(() => {
    // Listen for restoration progress
    restoreService.onProgress = (restoring: boolean) => setIsRestoring(restoring);
    
    // Trigger restore once on mount if on Android
    if (Capacitor.getPlatform() === 'android') {
      void restoreService.restoreFromCloud();
    }
  }, []);

  // Modal State for Loans
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bankName, setBankName] = useState('');
  const [emiDate, setEmiDate] = useState('5');
  const [interestType, setInterestType] = useState('REDUCING');

  // Privacy Visibility Logic
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleForceTab = (e: any) => setActiveTab(e.detail);
      const handleStressData = (e: any) => {
        // Optimistically add stress data to local state if possible
        // This is purely for UI rendering stress testing
        console.log('[FORENSIC] Stress Data Received:', e.detail.length);
      };
      window.addEventListener('bk_force_tab', handleForceTab);
      window.addEventListener('bk_inject_stress_data', handleStressData);
      return () => {
        window.removeEventListener('bk_force_tab', handleForceTab);
        window.removeEventListener('bk_inject_stress_data', handleStressData);
      };
    }
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setVisibleStep(1), 300);

    return () => {
      clearTimeout(t1);
    };
  }, []);

  // --- DATA FETCHING & SYNC ---
  console.log('[Dashboard_Forensic] Calling useDashboardData');
  const {
    salaryData,
    budgetData,
    emiList,
    isLoadingNativeTransactions,
    loadingExpenses,
    loadNativeTransactions,
    allUnifiedTransactions,
    currentMonthExpenses,
    lastMonthExpenses,
    filteredViewData
  } = useDashboardData(user, canReadSms, ledgerWindow, currentMonthYear, dateFilter, isSQLiteReady);
  console.log('[Dashboard_Filtered_Count]', filteredViewData?.length);
  console.log('[Dashboard_Forensic] useDashboardData returned');

  useDashboardSync(user, canReadSms, ledgerWindow, isReady, loadNativeTransactions, () => setIsSQLiteReady(true));

  useEffect(() => {
    if (isReady && canReadSms) {
      console.log('[Dashboard_Forensic] Triggering initial native transaction load.');
      loadNativeTransactions();
    }
  }, [isReady, canReadSms, loadNativeTransactions]);

  useEffect(() => {
    console.log('[Dashboard_Forensic] Readiness check:', { loadingExpenses, isLoadingNativeTransactions });
    if (!loadingExpenses && !isLoadingNativeTransactions) {
      setIsReady(true);
    }
  }, [loadingExpenses, isLoadingNativeTransactions]);

  useEffect(() => {
    if (!salaryData) return;
    // 🛡️ [UI_NORMALIZATION] Convert stored Paisa to Rupees for input pre-fill
    const rupees = convertToRupees(getSalaryAmount(salaryData as SalaryRecord | undefined));
    setSalaryInput(rupees.toString());
  }, [salaryData]);

  useEffect(() => {
    if (budgetData?.monthly_budget !== undefined) {
      // 🛡️ [UI_NORMALIZATION] Convert stored Paisa to Rupees for input pre-fill
      const rupees = convertToRupees(budgetData.monthly_budget);
      setBudgetInput(rupees.toString());
    }
  }, [budgetData]);

  // --- CALCULATIONS ---
  const salaryVal = getSalaryAmount(salaryData as SalaryRecord | undefined);
  const budgetVal = Number(budgetData?.monthly_budget) || 0;
  const monthlyExpenseSum = useMemo(() => currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [currentMonthExpenses]);
  const lastMonthTotal = useMemo(() => lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [lastMonthExpenses]);

  const monthlyEMI = useMemo(() => {
    return emiList.reduce((sum, emi) => {
      const principal = Number(emi.loanDetails?.principal || 0);
      const rate = Number(emi.loanDetails?.annualInterestRate || 0) / 12 / 100;
      const months = Number(emi.loanDetails?.totalMonths || 0);

      if (!principal || !rate || !months) return sum;

      const emiAmount =
        (principal * rate * Math.pow(1 + rate, months)) /
        (Math.pow(1 + rate, months) - 1);

      return sum + Math.round(emiAmount);
    }, 0);
  }, [emiList]);

  const monthlyExtraIncome = useMemo(() => allUnifiedTransactions
    .filter((t) => {
      if (!t?.date || !isValidDate(t.date)) return false;
      const d = safeDate(t.date);
      if (!d) return false;
      return t.type === 'income' && t.source !== 'salary' && format(d, 'yyyy-MM') === currentMonthYear;
    })
    .reduce((sum, e) => sum + Number(e?.amount || 0), 0), [allUnifiedTransactions, currentMonthYear]);

  const totalInflow = salaryVal + monthlyExtraIncome;
  const totalOutflow = monthlyExpenseSum + monthlyEMI;
  const netSaved = totalInflow - totalOutflow;

  // 🛡️ [ANALYTICS_STABILIZATION] Filter-Responsive Totals
  // Ensures UI analytics cards accurately reflect Today/Week/Month/Custom selections
  const filteredSpent = useMemo(() => 
    filteredViewData.filter(t => t.type !== 'income' && t.direction !== 'credit').reduce((sum, e) => sum + Number(e?.amount || 0), 0), 
  [filteredViewData]);
  
  const filteredIncome = useMemo(() => 
    filteredViewData.filter(t => t.type === 'income' || t.direction === 'credit').reduce((sum, e) => sum + Number(e?.amount || 0), 0), 
  [filteredViewData]);

  // 🛡️ [AI_STABILIZATION] Financial Fingerprint & In-flight Lock
  // Ensures AI only refreshes when material financial state changes, not on every render.
  const financialFingerprint = useMemo(() => {
    if (!allUnifiedTransactions || allUnifiedTransactions.length === 0) return 'empty';
    // Use length and sum for quick stability check
    const sum = allUnifiedTransactions.reduce((acc, t) => acc + t.amount, 0);
    return `in:${totalInflow}_out:${totalOutflow}_bd:${budgetVal}_mo:${currentMonthYear}_len:${allUnifiedTransactions.length}_sum:${sum}_lang:${language}`;
  }, [totalInflow, totalOutflow, budgetVal, currentMonthYear, allUnifiedTransactions, language]);

  const lastProcessedFingerprintRef = useRef<string | null>(null);
  const isAIRequestInFlightRef = useRef(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  useEffect(() => {
    // Prevent storm: skip if request already in flight, fingerprint hasn't changed, 
    // or if the component is still in an initial loading state
    if (!isReady || isAIRequestInFlightRef.current || lastProcessedFingerprintRef.current === financialFingerprint) {
      return;
    }

    const fetchRichAdvice = async () => {
      try {
        isAIRequestInFlightRef.current = true;
        console.log(`🧠 [AI_ENGINE] Requesting advice for fingerprint: ${financialFingerprint}`);
        const richAdvice = await getRichStructuredAIAdvice(allUnifiedTransactions || [], language);
        setAiAdvice(richAdvice);
        lastProcessedFingerprintRef.current = financialFingerprint;
      } catch (err) {
        console.error("[AI_ADVICE_ERROR]", err);
      } finally {
        isAIRequestInFlightRef.current = false;
      }
    };
    
    // Add 500ms debounce to allow ledger to settle after sync events
    const timer = setTimeout(() => {
      void fetchRichAdvice();
    }, 500);

    return () => clearTimeout(timer);
  }, [financialFingerprint, allUnifiedTransactions, language, isReady]);

  const aiPrediction = useMemo(() => predictMonthlySpend(currentMonthExpenses), [currentMonthExpenses]);
  const aiAlerts = useMemo(() => getOverspendingAlerts((allUnifiedTransactions || []).filter(t => t.type === 'expense')), [allUnifiedTransactions]);

  // --- HANDLERS ---
  const resetLoanForm = useCallback(() => {
    setEditingLoanId(null);
    setLoanName('');
    setLoanAmount('');
    setInterestRate('');
    setTenureMonths('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setBankName('');
    setEmiDate('5');
    setInterestType('REDUCING');
  }, []);

  const handleSaveIncome = useCallback(async () => {
    if (!user) return;
    setIsSavingIncome(true);
    try {
      const { convertToPaisa } = await import('@/utils/currencyFormatter');
      const salaryAmountPaise = convertToPaisa(salaryInput);

      const payload = {
        user_id: user.id,
        month_year: currentMonthYear,
        amount: salaryAmountPaise,
        updated_at: new Date().toISOString()
      };

      await saveAndSync('salaries', payload, 'UPSERT');
      toast({ title: "Salary saved successfully", className: "bg-[#0a0014] text-white border-[#ff0f7b]/40 shadow-lg" });
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['salaries'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })
      ]);
    } catch (err) {
      console.error("Income save error:", err);
      toast({ title: "System temporarily unavailable", description: "Error saving income record.", variant: "destructive" });
    } finally {
      setIsSavingIncome(false);
    }
  }, [user, salaryInput, currentMonthYear, queryClient, toast]);

  const handleSaveBudget = useCallback(async () => {
    if (!user) return;
    setIsSavingBudget(true);
    try {
      const { convertToPaisa } = await import('@/utils/currencyFormatter');
      const budgetAmountPaise = convertToPaisa(budgetInput);

      const payload = {
        user_id: user.id,
        monthly_budget: budgetAmountPaise,
        month_year: currentMonthYear,
        updated_at: new Date().toISOString()
      };

      await saveAndSync('budgets', payload, 'UPSERT');

      toast({ title: "Budget Locked!", className: "bg-[#0a0014] text-white border-[#ff0f7b]/40 shadow-lg" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })
      ]);
    } catch (err: any) {
      console.error("Budget save error:", err);
      toast({ title: "System temporarily unavailable", description: "Set Failed.", variant: "destructive" });
    }
    finally { setIsSavingBudget(false); }
  }, [user, budgetInput, currentMonthYear, queryClient, toast]);

  const adjustBudget = useCallback((amount: number) => {
    const current = Number(budgetInput) || 0;
    const nextValue = Math.max(0, current + amount);
    setBudgetInput(nextValue.toString());
  }, [budgetInput]);

  const handleAddLoan = useCallback(async (e: any) => {
    // 🛡️ [RUNTIME_CONTRACT_BRIDGE]
    // Web flow sends React.FormEvent. Android modal sends a raw data object.
    const isEvent = e && typeof e.preventDefault === 'function';
    if (isEvent) e.preventDefault();
    
    if (!user) return;

    // Use values from event (state) OR from the passed object (Android Modal)
    const incomingData = isEvent ? null : e;
    const finalLoanName = incomingData?.title || incomingData?.name || loanName;
    const finalLoanAmount = incomingData?.principal || loanAmount; // Raw rupees if from Modal, state if from web
    const finalInterestRate = incomingData?.annualInterestRate || interestRate;
    const finalTenureMonths = incomingData?.totalMonths || tenureMonths;
    const finalStartDate = incomingData?.startDate || startDate;
    const finalInterestType = incomingData?.interestCalculationType || interestType;
    const finalBankName = incomingData?.bank_app_name || bankName;
    const finalEmiDay = incomingData?.emi_day || incomingData?.deduction_date || emiDate;

    const { convertToPaisa } = await import('@/utils/currencyFormatter');
    const principalInPaisa = convertToPaisa(finalLoanAmount);

    const loanDetails = {
      loanName: finalLoanName, 
      loanAmount: principalInPaisa, 
      interestRateAnnual: Number(finalInterestRate),
      tenureMonths: Number(finalTenureMonths), 
      startDate: finalStartDate, 
      loanType: finalLoanName, 
      interestType: finalInterestType,
      bankName: finalBankName, 
      emiDate: finalEmiDay
    };

    // 🛡️ [MONETARY_INTEGRITY] Calculate Monthly EMI for top-level amount field
    let calculatedEMI = 0;
    const principal = principalInPaisa;
    const rate = Number(finalInterestRate) / 12 / 100;
    const months = Number(finalTenureMonths);

    if (principal > 0 && months > 0) {
      if (finalInterestType === 'REDUCING') {
        if (rate === 0) {
          calculatedEMI = principal / months;
        } else {
          calculatedEMI = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        }
      } else {
        // Flat Interest
        const totalInterest = (principal * Number(finalInterestRate) * (months / 12)) / 100;
        calculatedEMI = (principal + totalInterest) / months;
      }
    }

    const payload = {
      id: editingLoanId || incomingData?.id || crypto.randomUUID(),
      user_id: user.id, 
      name: finalLoanName, 
      amount: Math.round(calculatedEMI), // Store Monthly EMI in Paisa
      emi_day: Number(finalEmiDay) || 5,  // Store Deduction Day
      loan_details: loanDetails,
      updated_at: new Date().toISOString()
    };

    // 🛡️ [HARD_SAFETY_VALIDATION]
    // Prevents malformed data from reaching the SQLite engine.
    if (!payload.name || typeof payload.amount !== 'number' || isNaN(payload.amount) || !payload.user_id) {
      console.error("❌ [PAYLOAD_VALIDATION_FAIL]", payload);
      toast({ 
        title: "Data Validation Error", 
        description: "Missing required fields for loan record. Please check Loan Title and Amounts.", 
        variant: "destructive" 
      });
      return;
    }

    if (payload.emi_day < 1 || payload.emi_day > 31) {
      toast({ title: "Invalid EMI Day", description: "EMI Day must be between 1 and 31.", variant: "destructive" });
      return;
    }

    try {
      await saveAndSync('emis', payload, 'UPSERT');
      
      setShowLoanModal(false);
      resetLoanForm();
      queryClient.invalidateQueries({ queryKey: ['emis'] });
      toast({ title: "Loan Recorded Locally! 🚀", description: "Syncing to cloud...", className: "bg-emerald-600 text-white" });
    } catch (err: any) {
      console.error("Loan sync error:", err);
      toast({ title: "Operation Failed", description: "Could not save loan details.", variant: "destructive" });
    }
  }, [user, loanAmount, loanName, interestRate, tenureMonths, startDate, interestType, bankName, emiDate, editingLoanId, queryClient, toast, resetLoanForm]);

  const handleDeleteEMI = useCallback(async (id: string) => {
    if (!window.confirm("Nuke this loan record?")) return;
    try {
      await deleteAndSync('emis', id);
      queryClient.invalidateQueries({ queryKey: ['emis'] });
      toast({ title: "Loan Deleted Locally", className: "bg-rose-600 text-white" });
    } catch (err) { toast({ title: "Delete Failed", variant: "destructive" }); }
  }, [queryClient, toast]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    // OFFLINE DELETE GUARD (TEMP=0.0): block delete before ANY mutation when offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast({
        title: "Connect to internet to delete expenses safely.",
        className: "bg-[#0a0014] text-white border-[#ff0f7b]/40 shadow-lg",
      });
      return;
    }
    if (!window.confirm("Nuke this record?")) return;

    // Use allUnifiedTransactions to detect origin
    const expense = allUnifiedTransactions.find(t => t.id === id);
    const isNative = expense?.origin === 'native-transaction' || !!expense?.smsHash;

    try {
      console.log(`[FORENSIC_DELETE_START] ID: ${id}, Native: ${isNative}`);
      
      if (isNative) {
        // 🛡️ [CANONICAL_DELETE_PIPELINE]
        // 1. Mark as deleted in local SQLite (Tombstone)
        // 2. Queue for cloud sync
        await deleteAndSync('transactions', id);

        // 3. Physical cleanup in native bridge (if on Android)
        if (Capacitor.getPlatform() === 'android') {
          const { deleteNativeTransaction } = await import('@/integrations/smsBridge');
          await deleteNativeTransaction(id);
        }
      } else {
        // Legacy/Web fallback: Try deleteAndSync first (covers 'transactions' table)
        // Then direct delete for 'expenses' table (legacy manual entries)
        await deleteAndSync('transactions', id);
        await supabase.from('expenses').delete().eq('id', id);
      }

      // 🛡️ [DETERMINISTIC_REFRESH] 
      // Await all invalidations to ensure the next render sees the tombstone.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] })
      ]);
      
      toast({ title: "Record Nuked Locally", className: "bg-rose-600 text-white shadow-xl" });
    } catch (err) {
      console.error("[FORENSIC_DELETE_FAIL]", err);
      toast({ title: "Delete Failed", description: "Record could not be removed.", variant: "destructive" });
    }
  }, [user, allUnifiedTransactions, queryClient, toast]);
  const handleClearAll = useCallback(async () => {
    if (!user) return;
    // OFFLINE DELETE GUARD (TEMP=0.0): block delete before ANY mutation when offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast({
        title: "Connect to internet to delete expenses safely.",
        className: "bg-[#0a0014] text-white border-[#ff0f7b]/40 shadow-lg",
      });
      return;
    }
    const confirmClear = window.confirm("⚠️ This will WIPE ALL your financial records (SMS, Manual, Income, Planning) from this device and cloud. Proceed?");
    if (!confirmClear) return;
    
    try {
      console.log(`[FORENSIC_CLEAR_ALL_START] User: ${user.id}`);
      const now = new Date().toISOString();

      // 🛡️ [CANONICAL_MASS_DELETE]
      // We must clear ALL tables that contribute to the ledger or financial state.
      const tablesToClear = ['transactions', 'expenses', 'salaries', 'budgets', 'emis'];
      
      const clearPromises = tablesToClear.map(async (tableName) => {
        // 1. Cloud Clear (Soft delete for transactions, hard delete for others per contract)
        if (tableName === 'transactions') {
          await supabase.from(tableName).update({ is_deleted: true, updated_at: now }).eq('user_id', user.id);
        } else {
          await supabase.from(tableName).delete().eq('user_id', user.id);
        }

        // 2. Local SQLite Clear (if on Android)
        if (Capacitor.getPlatform() === 'android') {
          const db = getDB();
          if (db) {
            await db.run(`UPDATE ${tableName} SET is_deleted = 1, updated_at = ? WHERE user_id = ?`, [now, user.id]);
          }
        }
      });

      await Promise.allSettled([
        ...clearPromises,
        (async () => {
          const { clearNativeTransactions } = await import('@/integrations/smsBridge');
          return await clearNativeTransactions();
        })()
      ]);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['budgets', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['salaries', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['emis', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] })
      ]);
      
      toast({ title: "All records cleared", className: "bg-rose-600 text-white" });
    } catch (err) {
      console.error("[FORENSIC_CLEAR_ALL_FAIL]", err);
      toast({ title: "Clear Failed", description: "System error during data wipe.", variant: "destructive" });
    }
  }, [user, queryClient, toast]);

  // ==================== UI STYLING CONSTANTS ====================
  const applePhysics = "transition-all duration-500 ease-butter-soft transform-gpu active:scale-[0.965]";
  const neonGlass = `bg-[#0a0014]/80 backdrop-blur-xl border border-[#ff0f7b]/35 shadow-2xl rounded-[32px] overflow-hidden transform-gpu will-change-transform`;
  const inputStyle = `h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#ff0f7b]/50 focus:ring-1 focus:ring-[#ff0f7b]/50 text-white font-mono font-black transition-all`;
  const stepperBtn = `h-10 px-4 bg-[rgba(255,15,123,0.2)] border border-[#ff0f7b]/30 text-[#ff0f7b] rounded-xl font-black transition-all hover:bg-[rgba(255,15,123,0.3)] active:scale-90`;

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0014] text-white gap-4">
        <div className="w-12 h-12 border-4 border-[#ff0f7b] border-t-transparent rounded-full animate-spin" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[#0a0014] overflow-y-auto selection:bg-pink-500/30 relative antialiased scroll-smooth custom-scrollbar`}>
      {/* Restore Indicator */}
      {isRestoring && (
        <div className="fixed top-0 left-0 w-full z-[100] bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-xl">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Restoring your data from cloud...</span>
        </div>
      )}

      {/* Dynamic Background Glows */}
      <div className={`fixed -top-24 -right-24 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none transform-gpu will-change-transform`} />
      <div className={`fixed -bottom-24 -left-24 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none transform-gpu will-change-transform`} />

      <AppHeader />
      <DashboardSubheader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={`flex flex-col gap-8 sm:gap-10 w-full max-w-xl lg:max-w-6xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 relative z-10`}>

        {activeTab === 'daily' && (
          <>
            <div className="sticky top-16 z-[40] -mx-6 px-6 bg-[#0a0014]/60 backdrop-blur-md py-3 flex gap-3 overflow-x-auto hide-scrollbar border-b border-white/5">
              <DateFilter value={dateFilter} onChange={setDateFilter} filteredData={filteredViewData || []} />
            </div>

            <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-3xl" />}><div className={applePhysics}><SmartUniversalInput /></div></Suspense>
            <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-3xl" />}><BudgetPulse spent={filteredSpent} budget={budgetVal} /></Suspense>
            <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-3xl" />}><MonthlyComparison currentMonthTotal={filteredSpent} lastMonthTotal={lastMonthTotal} /></Suspense>

            <div className={cn(neonGlass, "p-8 relative border-[#ff0f7b]/35 shadow-[0_0_40px_-10px_rgba(255,15,123,0.3)]")}>
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-[#ff0f7b]/20 border border-[#ff0f7b]/40 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#ff0f7b] rounded-full animate-pulse shadow-[0_0_8px_#ff0f7b]" />
                <span className="text-[8px] font-black text-[#ff0f7b] uppercase tracking-widest">{t('common.aiActive', 'AI Active')}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <h3 className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-[0.3em] mb-6">{t('dashboard.aiEngine', 'Deep Insight Engine')}</h3>
                <div className="min-h-[80px] flex items-center justify-center mb-6">
                  <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-[#ff0f7b]" />}>
                    <SmartFinancialMentor
                      advice={aiAdvice ? { action: aiAdvice.action, reason: aiAdvice.reason, steps: aiAdvice.steps, confidence: aiAdvice.confidence } : null}
                    />
                  </Suspense>
                </div>
                <p className="text-[#b3b3b3] text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 mt-4 opacity-50">
                  <BrainCircuit className="h-3 w-3" /> {t('common.hardwareAccelerated', 'Hardware Accelerated Logic')}
                </p>
              </div>
            </div>

            <Suspense fallback={<div className="h-48 animate-pulse bg-white/5 rounded-3xl" />}>
              <CategoryChart expenses={filteredViewData} loading={loadingExpenses} budget={budgetVal} />
            </Suspense>

            <Suspense fallback={<div className="h-48 animate-pulse bg-white/5 rounded-3xl" />}>
              <MarketIntelligence 
                transactions={filteredViewData} 
                currentMonthExpenses={filteredViewData} 
                advice={aiAdvice ? { 
                  growth: aiAdvice.growth, 
                  confidence: aiAdvice.confidence,
                  investmentOptions: aiAdvice.investmentOptions,
                  platforms: aiAdvice.platforms,
                  personalizedPlan: aiAdvice.personalizedPlan
                } : null}
              />
            </Suspense>

            <AIInsightsCard 
              aiAdvice={aiAdvice ? { insights: aiAdvice.insights, projection: aiAdvice.projection, confidence: aiAdvice.confidence } : null} 
              aiAlerts={aiAlerts} 
              aiPrediction={aiPrediction} 
              t={t} 
              neonGlass={neonGlass} 
            />

            <FinancialHealthScore 
              salary={filteredIncome} 
              totalExpenses={filteredSpent} 
              advice={aiAdvice ? { healthScore: aiAdvice.healthScore, healthReason: aiAdvice.healthReason, confidence: aiAdvice.confidence } : null}
            />
            <RecentExpenses 
              expenses={filteredViewData} 
              loading={loadingExpenses || isLoadingNativeTransactions} 
              onDelete={handleDeleteTransaction} 
              onClearAll={handleClearAll}
              userId={user?.id}
              dateFilter={dateFilter}
            />
          </>
        )}

        {activeTab === 'planning' && (
          <>
            <MonthlySnapshotCard totalInflow={totalInflow} budgetVal={budgetVal} totalOutflow={totalOutflow} netSaved={netSaved} t={t} neonGlass={neonGlass} />
            <IncomeEngineCard salaryInput={salaryInput} setSalaryInput={setSalaryInput} handleSaveIncome={handleSaveIncome} isSavingIncome={isSavingIncome} t={t} neonGlass={neonGlass} inputStyle={inputStyle} applePhysics={applePhysics} />
            <SafeSpendCard budgetInput={budgetInput} setBudgetInput={setBudgetInput} handleSaveBudget={handleSaveBudget} isSavingBudget={isSavingBudget} adjustBudget={adjustBudget} t={t} neonGlass={neonGlass} inputStyle={inputStyle} applePhysics={applePhysics} stepperBtn={stepperBtn} />
            <DebtLedgerSection emiList={emiList} t={t} applePhysics={applePhysics} onAddLoan={() => { resetLoanForm(); setShowLoanModal(true); }} onDeleteEMI={handleDeleteEMI} onEditEMI={async (emi) => {
              const { convertToRupees } = await import('@/utils/currencyFormatter');
              setEditingLoanId(emi.id);
              setLoanName(emi.name || emi.emi_name || '');
              setLoanAmount(convertToRupees(emi.loanDetails?.principal || 0).toString());
              setInterestRate(emi.loanDetails?.annualInterestRate?.toString() || '');
              setTenureMonths(emi.loanDetails?.totalMonths?.toString() || '');
              setStartDate(emi.loanDetails?.startDate || format(new Date(), 'yyyy-MM-dd'));
              setBankName(emi.loanDetails?.bank_app_name || '');
              setEmiDate(emi.loanDetails?.deduction_date?.toString() || '5');
              setInterestType(emi.loanDetails?.interestCalculationType || 'REDUCING');
              setShowLoanModal(true);
            }} />
          </>
        )}

        {activeTab === 'future' && ( <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto text-[#ff0f7b]" />}><div className="animate-in fade-in slide-in-from-bottom-10 duration-700 w-full"><FutureWealthPredictor monthlySavings={netSaved} /></div></Suspense> )}
        {activeTab === 'dreams' && ( <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto text-[#ff0f7b]" />}><div className="animate-in fade-in slide-in-from-bottom-10 duration-700"><GoalProgress currentSavings={netSaved} /></div></Suspense> )}

        <div className="mt-16 mb-12 px-6 text-center">
          <div className="max-w-2xl mx-auto bg-white/5 py-8 px-10 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-md">
            <h4 className="text-[11px] text-[#ff0f7b] font-black uppercase tracking-[0.3em] mb-6 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#ff0f7b]/30" /> Safety & Privacy <span className="h-px w-10 bg-[#ff0f7b]/30" />
            </h4>

            <div className="space-y-6 text-[10px] leading-relaxed font-bold uppercase tracking-widest text-left">
              <div className="privacy-en pb-2" style={{ transition: 'opacity 0.5s ease', opacity: visibleStep >= 1 ? 1 : 0, visibility: visibleStep >= 1 ? 'visible' : 'hidden' }}>
                <p className="text-white/80 italic mb-1.5">This data is for your information and tracking only. We do not directly access your bank accounts or transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="w-[95vw] sm:max-w-xl bg-[#0a0014] border border-[#ff0f7b]/40 rounded-[40px] p-0 overflow-hidden shadow-3xl transform-gpu">
          <DialogDescription className="sr-only">Form to secure a new loan or update existing debt profile.</DialogDescription>
          <div className="h-2 w-full bg-gradient-to-r from-purple-600 to-[#ff0f7b]" />
          <form onSubmit={handleAddLoan} className="p-10 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <DialogHeader className="p-0 text-white">
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic text-white">
                {editingLoanId ? "Update Debt Profile" : "Secure New Loan"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest ml-1">Loan Title</Label>
              <Input value={loanName} onChange={e => setLoanName(e.target.value)} required className={inputStyle} placeholder="e.g. Dream Car" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Principal (₹)</Label><Input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} required className={inputStyle} /></div>
              <div className="space-y-3"><Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Rate (%)</Label><Input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} required className={inputStyle} /></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Months</Label><Input type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} required className={inputStyle} /></div>
              <div className="space-y-3"><Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Inception</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputStyle} /></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Bank Name/App Name</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} className={inputStyle} placeholder="e.g. HDFC Bank or KreditBee" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Monthly EMI Day</Label>
                <Input type="number" min="1" max="31" value={emiDate} onChange={e => setEmiDate(e.target.value)} className={inputStyle} placeholder="1-31" />
              </div>
            </div>
            <div className="space-y-5 p-8 bg-white/5 rounded-[32px] border border-white/5 shadow-inner text-white">
              <Label className="text-[#b3b3b3] font-black text-[9px] uppercase tracking-widest">Interest Mathematics</Label>
              <RadioGroup value={interestType} onValueChange={setInterestType} className="flex gap-6">
                <div className="flex items-center space-x-3 bg-[#0a0014] px-6 py-4 rounded-2xl border border-white/10 flex-1 hover:border-[#ff0f7b]/40 transition-all cursor-pointer shadow-lg">
                  <RadioGroupItem value="REDUCING" id="red" className="text-[#ff0f7b]" /><Label htmlFor="red" className="text-white font-black uppercase text-xs">Reducing</Label>
                </div>
                <div className="flex items-center space-x-3 bg-[#0a0014] px-6 py-4 rounded-2xl border border-white/10 flex-1 hover:border-[#ff0f7b]/40 transition-all cursor-pointer shadow-lg">
                  <RadioGroupItem value="FLAT" id="flt" className="text-[#ff0f7b]" /><Label htmlFor="flt" className="text-white font-black uppercase text-xs">Flat</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-6 pt-6">
              <Button type="button" variant="outline" onClick={() => { setShowLoanModal(false); resetLoanForm(); }} className="rounded-2xl border-white/10 h-16 flex-1 text-[#b3b3b3] font-black uppercase text-[10px] tracking-widest hover:bg-white/5">Abort</Button>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-[#ff0f7b] text-white rounded-2xl h-16 flex-[2] font-black text-lg shadow-2xl active:scale-[0.965] uppercase tracking-widest italic">Commit Sync</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Isolated Forensic Lab */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ForensicDashboard />
        </Suspense>
      )}
    </div>
  );
};

export default Dashboard;
