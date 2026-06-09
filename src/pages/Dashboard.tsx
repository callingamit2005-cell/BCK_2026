import { useMemo, useState, useEffect, useCallback, lazy, Suspense, memo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus, Sparkles, BrainCircuit, Loader2, Check
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
import { FintechSummaryStrip } from '@/components/dashboard/FintechSummaryStrip';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import PermissionEducation from '@/components/onboarding/PermissionEducation';

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
import { getRichStructuredAIAdvice, getRuleBasedStructuredAdvice } from '@/utils/smartAdvisor';
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
import EMIBillsCard from '@/components/EMIBillsCard';

// Forensic Lab (Isolated)
const ForensicDashboard = lazy(() => import('@/test/forensic/ForensicDashboard'));

import { forensicEngine } from '@/test/forensic/validationSuite';

const Dashboard = () => {
  if (process.env.NODE_ENV === 'development') {
    forensicEngine.trackRender('Dashboard');
  }
  const { user, userProfile, refreshPreferences } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  useI18nNamespaces(["dashboard", "common", "savings", "split"]);

  const now = useMemo(() => {
    return new Date();
  }, []);
  const currentMonthYear = format(now, 'yyyy-MM');
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

  // 🛡️ [VOLATILE_STRESS_STATE]
  const [localStressData, setLocalStressData] = useState<any[]>([]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const handleForceTab = (e: any) => setActiveTab(e.detail);
      const handleStressData = (e: any) => {
        // 🛡️ [SAFETY_GATE] Hard Limit: 10,000 records
        const data = e.detail || [];
        const limitedData = data.slice(0, 10000);
        console.log(`🧪 [FORENSIC_STRESS] Received ${limitedData.length} mock records.`);
        setLocalStressData(limitedData);
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

  const {
    salaryData,
    budgetData,
    emiList,
    subscriptionList,
    isLoadingNativeTransactions,
    loadingExpenses,
    loadNativeTransactions,
    allUnifiedTransactions,
    currentMonthExpenses,
    lastMonthExpenses,
    filteredViewData
  } = useDashboardData(user, canReadSms, ledgerWindow, currentMonthYear, dateFilter, isSQLiteReady, localStressData);

  const handleSQLiteReady = useCallback(() => setIsSQLiteReady(true), []);
  useDashboardSync(user, canReadSms, ledgerWindow, isReady, loadNativeTransactions, handleSQLiteReady);

  useEffect(() => {
    if (isReady && canReadSms) {
      loadNativeTransactions();
    }
  }, [isReady, canReadSms, loadNativeTransactions]);

  useEffect(() => {
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
  const salaryVal = useMemo(() => getSalaryAmount(salaryData as SalaryRecord | undefined), [salaryData]);
  const budgetVal = useMemo(() => Number(budgetData?.monthly_budget) || 0, [budgetData]);
  
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

  const totalInflow = useMemo(() => salaryVal + monthlyExtraIncome, [salaryVal, monthlyExtraIncome]);
  const totalOutflow = useMemo(() => monthlyExpenseSum + monthlyEMI, [monthlyExpenseSum, monthlyEMI]);
  const netSaved = useMemo(() => totalInflow - totalOutflow, [totalInflow, totalOutflow]);

  // 🛡️ [SUBSCRIPTION_MAPPING]
  const subscriptionBills = useMemo(() => {
    return (subscriptionList || []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      amount: convertToRupees(sub.amount),
      dueDate: sub.updated_at || new Date().toISOString(),
      status: 'unpaid' as const,
    }));
  }, [subscriptionList]);

  // 🛡️ [ANALYTICS_STABILIZATION] Filter-Responsive Totals
  const filteredSpent = useMemo(() => 
    filteredViewData.filter(t => t.type !== 'income' && t.direction !== 'credit').reduce((sum, e) => sum + Number(e?.amount || 0), 0), 
  [filteredViewData]);
  
  const filteredIncome = useMemo(() => 
    filteredViewData.filter(t => t.type === 'income').reduce((sum, e) => sum + Number(e?.amount || 0), 0), 
  [filteredViewData]);

  // 🛡️ [AI_STABILIZATION] Financial Fingerprint & In-flight Lock
  // Ensures AI only refreshes when material financial state changes, not on every render.
  const financialFingerprint = useMemo(() => {
    if (!allUnifiedTransactions || allUnifiedTransactions.length === 0) return 'empty';
    const sum = allUnifiedTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return `in:${totalInflow}_out:${totalOutflow}_bd:${budgetVal}_mo:${currentMonthYear}_len:${allUnifiedTransactions.length}_sum:${sum}_lang:${language}`;
  }, [totalInflow, totalOutflow, budgetVal, currentMonthYear, allUnifiedTransactions, language]);

  const lastProcessedFingerprintRef = useRef<string | null>(null);
  const isAIRequestInFlightRef = useRef(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);

  // 🛡️ [DETERMINISTIC_FALLBACK_MEMO]
  // Pre-calculate rule-based advice locally to provide instant UX while AI is fetching.
  const localRuleAdvice = useMemo(() => {
    if (!isReady || !allUnifiedTransactions) return null;
    return getRuleBasedStructuredAdvice(allUnifiedTransactions, language);
  }, [allUnifiedTransactions, language, isReady]);

  useEffect(() => {
    if (!isReady || isAIRequestInFlightRef.current || lastProcessedFingerprintRef.current === financialFingerprint) {       
      return;
    }

    const fetchRichAdvice = async () => {
      try {
        isAIRequestInFlightRef.current = true;
        const richAdvice = await getRichStructuredAIAdvice(allUnifiedTransactions || [], language);
        setAiAdvice(richAdvice);
        lastProcessedFingerprintRef.current = financialFingerprint;
      } catch (err) {
        console.error("[AI_ADVICE_ERROR]", err);
      } finally {
        isAIRequestInFlightRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      void fetchRichAdvice();
    }, 500);

    return () => clearTimeout(timer);
  }, [financialFingerprint, allUnifiedTransactions, language, isReady]);

  // 🛡️ [AI_PRIORITY_MERGE]
  const activeAdvice = aiAdvice || localRuleAdvice;

  const aiPrediction = useMemo(() => predictMonthlySpend(currentMonthExpenses), [currentMonthExpenses]);
  const aiAlerts = useMemo(() => getOverspendingAlerts((allUnifiedTransactions || []).filter(t => t.type === 'expense'), budgetVal), [allUnifiedTransactions, budgetVal]);

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
      toast({ title: t('dashboard.salaryUpdated', "Salary saved successfully"), className: "bg-card text-foreground border border-border shadow-sm" });
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['salaries'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })
      ]);
    } catch (err) {
      console.error("Income save error:", err);
      toast({ 
        title: t('common.error', "System temporarily unavailable"), 
        description: t('dashboard.salarySaveError', "Error saving income record."), 
        variant: "destructive" 
      });
    } finally {
      setIsSavingIncome(false);
    }
  }, [user, salaryInput, currentMonthYear, queryClient, toast, t]);

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

      toast({ title: t('dashboard.budgetUpdated', "Budget Locked!"), className: "bg-card text-foreground border border-border shadow-sm" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] })
      ]);
    } catch (err: any) {
      console.error("Budget save error:", err);
      toast({ title: t('common.error', "System temporarily unavailable"), description: t('common.saveFailed', "Set Failed."), variant: "destructive" });
    }
    finally { setIsSavingBudget(false); }
  }, [user, budgetInput, currentMonthYear, queryClient, toast, t]);

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
    const finalLoanAmount = incomingData?.principal || loanAmount; 

    const payload = {
      id: editingLoanId || crypto.randomUUID(),
      user_id: user.id,
      name: finalLoanName,
      amount: Number(finalLoanAmount),
      emi_day: Number(emiDate),
      loan_details: {
        principal: Number(finalLoanAmount),
        interestRateAnnual: Number(interestRate),
        tenureMonths: Number(tenureMonths),
        startDate: startDate,
        interestType: interestType,
        bankName: bankName,
        emiDate: Number(emiDate)
      },
      updated_at: new Date().toISOString()
    };

    // 🛡️ [HARD_SAFETY_VALIDATION]
    if (!payload.name || typeof payload.amount !== 'number' || isNaN(payload.amount) || !payload.user_id) {
      console.error("❌ [PAYLOAD_VALIDATION_FAIL]", payload);
      toast({ 
        title: t('common.invalid', "Data Validation Error"), 
        description: t('emi.validationError', "Missing required fields for loan record. Please check Loan Title and Amounts."), 
        variant: "destructive" 
      });
      return;
    }

    if (payload.emi_day < 1 || payload.emi_day > 31) {
      toast({ title: t('common.invalid', "Invalid EMI Day"), description: t('emi.dayError', "EMI Day must be between 1 and 31."), variant: "destructive" });
      return;
    }

    try {
      await saveAndSync('emis', payload, 'UPSERT');
      
      setShowLoanModal(false);
      resetLoanForm();
      queryClient.invalidateQueries({ queryKey: ['emis'] });
      toast({ title: t('dashboard.emiAdded', "Loan Recorded Locally! 🚀"), description: t('common.syncing', "Syncing to cloud..."), className: "bg-card text-foreground border border-border shadow-sm" });
    } catch (err: any) {
      console.error("Loan sync error:", err);
      toast({ title: t('common.error', "Operation Failed"), description: t('emi.saveError', "Could not save loan details."), variant: "destructive" });
    }
  }, [user, loanAmount, loanName, interestRate, tenureMonths, startDate, interestType, bankName, emiDate, editingLoanId, queryClient, toast, resetLoanForm, t]);

  const handleDeleteEMI = useCallback(async (id: string) => {
    if (!window.confirm(t('common.confirm', "Nuke this loan record?"))) return;
    try {
      await deleteAndSync('emis', id);
      queryClient.invalidateQueries({ queryKey: ['emis'] });
      toast({ title: t('common.deleted', "Loan Deleted Locally"), className: "bg-card text-foreground border border-border shadow-sm" });
    } catch (err) { toast({ title: t('common.error', "Delete Failed"), variant: "destructive" }); }
  }, [queryClient, toast, t]);

  const handleDeleteSubscription = useCallback(async (id: string) => {
    if (!window.confirm(t('common.confirm', "Nuke this subscription?"))) return;
    try {
      await deleteAndSync('subscriptions', id);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: t('common.deleted', "Subscription Deleted Locally"), className: "bg-card text-foreground border border-border shadow-sm" });
    } catch (err) { toast({ title: t('common.error', "Delete Failed"), variant: "destructive" }); }
  }, [queryClient, toast, t]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast({
        title: t('common.offline', "Connect to internet to delete expenses safely."),
        className: "bg-card text-foreground border border-border shadow-sm",
      });
      return;
    }
    if (!window.confirm(t('common.confirm', "Nuke this record?"))) return;

    const expense = allUnifiedTransactions.find(t => t.id === id);
    const isNative = expense?.origin === 'native-transaction' || !!expense?.smsHash;

    try {
      if (isNative) {
        await deleteAndSync('transactions', id);
        if (Capacitor.getPlatform() === 'android') {
          const { deleteNativeTransaction } = await import('@/integrations/smsBridge');
          await deleteNativeTransaction(id);
        }
      } else {
        await deleteAndSync('transactions', id);
        await supabase.from('expenses').delete().eq('id', id);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user.id] })
      ]);
      
      toast({ title: t('common.deleted', "Record Nuked Locally"), className: "bg-card text-foreground border border-border shadow-sm" });
    } catch (err) {
      console.error("[FORENSIC_DELETE_FAIL]", err);
      toast({ title: t('common.error', "Delete Failed"), description: t('common.deleteError', "Record could not be removed."), variant: "destructive" });
    }
  }, [user, allUnifiedTransactions, queryClient, toast, t]);

  const handleClearAll = useCallback(async () => {
    if (!user) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast({
        title: t('common.offline', "Connect to internet to delete expenses safely."),
        className: "bg-card text-foreground border border-border shadow-sm",
      });
      return;
    }
    const confirmClear = window.confirm(t('common.confirmWipe', "⚠️ This will WIPE ALL your financial records (SMS, Manual, Income, Planning) from this device and cloud. Proceed?"));
    if (!confirmClear) return;
    
    try {
      const now = new Date().toISOString();
      const tablesToClear = ['transactions', 'expenses', 'salaries', 'budgets', 'emis'];
      
      const clearPromises = tablesToClear.map(async (tableName) => {
        if (tableName === 'transactions') {
          await supabase.from(tableName).update({ is_deleted: true, updated_at: now }).eq('user_id', user.id);
        } else {
          await supabase.from(tableName).delete().eq('user_id', user.id);
        }

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
      
      toast({ title: t('common.deleted', "All records cleared"), className: "bg-card text-foreground border border-border shadow-sm" });
    } catch (err) {
      console.error("[FORENSIC_CLEAR_ALL_FAIL]", err);
      toast({ title: t('common.error', "Clear Failed"), description: t('common.wipeError', "System error during data wipe."), variant: "destructive" });
    }
  }, [user, queryClient, toast, t]);

  // ==================== UI STYLING CONSTANTS ====================
  const applePhysics = "transition-all duration-500 ease-in-out transform-gpu active:scale-[0.98]";
  const premiumCard = "bg-card border border-border/40 shadow-sm rounded-xl overflow-hidden transform-gpu will-change-transform transition-all duration-300 hover:shadow-md";
  const inputStyle = "h-14 rounded-xl bg-muted/50 border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 text-foreground font-mono font-bold transition-all placeholder:text-muted-foreground/40";
  const stepperBtn = "h-10 px-4 bg-muted border border-border/60 text-foreground rounded-lg font-bold transition-all hover:bg-primary hover:text-primary-foreground active:scale-95";

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <div className="w-8 h-8 border-2 border-black/10 border-t-foreground rounded-full animate-spin" />
        <p className="font-medium text-xs text-muted-foreground">{t('common.loading', 'Loading your finances…')}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background overflow-y-auto selection:bg-black/10 relative antialiased scroll-smooth custom-scrollbar">
      {/* 🛡️ [RECOVERY_B] Privacy & Permission Sequence */}
      <PermissionEducation 
        open={!userProfile?.privacy_completed} 
        onOpenChange={() => {}} 
        onComplete={() => refreshPreferences()} 
      />

      {/* Restore Indicator */}
      {isRestoring && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 w-full z-[100] bg-card border-b border-border text-foreground text-xs font-semibold py-2 px-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin opacity-50" />
          <span>{t('settlement.reconstructing', 'Syncing your data from cloud…')}</span>
        </div>
      )}

      <main className="flex flex-col gap-6 sm:gap-10 w-full max-w-xl lg:max-w-6xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-32 sm:pb-24 safe-bottom relative z-10">
        
        {/* Contextual Dashboard Mode Switcher */}
        <div className="sticky top-0 z-[50] bg-background/95 backdrop-blur-sm -mx-4 px-4 py-1">
          <DashboardSubheader activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* 🚀 [PHASE_3] FINTECH SUMMARY STRIP */}
        <FintechSummaryStrip totalCredit={filteredIncome} totalDebit={filteredSpent} />

        {activeTab === 'daily' && (
          <>
            <div className="sticky top-0 sm:top-4 z-[40] -mx-6 px-6 bg-background/95 border-b border-border py-3 flex gap-3 overflow-x-auto hide-scrollbar">
              <DateFilter value={dateFilter} onChange={setDateFilter} filteredData={filteredViewData || []} />
            </div>

            <Suspense fallback={<div className="h-32 w-full bg-muted animate-pulse rounded-xl" />}>
              <div className={applePhysics}><SmartUniversalInput /></div>
            </Suspense>
            
            <Suspense fallback={<div className="h-44 w-full bg-muted animate-pulse rounded-xl" />}>
              <BudgetPulse spent={filteredSpent} budget={budgetVal} />
            </Suspense>

            <Suspense fallback={<div className="h-28 w-full bg-muted animate-pulse rounded-xl" />}>
              <MonthlyComparison currentMonthTotal={filteredSpent} lastMonthTotal={lastMonthTotal} />
            </Suspense>

            <div className="bg-card p-4 sm:p-8 relative rounded-xl shadow-sm w-full">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-background border border-border/60 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground">{t('common.aiActive', 'AI')}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center w-full">
                <h3 className="text-muted-foreground text-xs font-semibold mb-4 sm:mb-6">{t('dashboard.aiEngine', 'AI Financial Advisor')}</h3>
                <div className="min-h-[80px] flex items-center justify-center mb-4 sm:mb-6 w-full">
                  <Suspense fallback={<div className="h-20 w-full bg-background animate-pulse rounded-xl" />}>
                    <SmartFinancialMentor
                      advice={activeAdvice ? { action: activeAdvice.action, reason: activeAdvice.reason, steps: activeAdvice.steps, confidence: activeAdvice.confidence } : null}
                    />
                  </Suspense>
                </div>
                <p className="text-fintech-graphite-muted opacity-40 text-xs font-black uppercase tracking-wider flex items-center gap-2 mt-2 sm:mt-4">
                  <BrainCircuit className="h-3 w-3" /> {t('common.hardwareAccelerated', 'Powered by AI analysis')}
                </p>
              </div>
            </div>

            <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-xl" />}>
              <CategoryChart expenses={filteredViewData} loading={loadingExpenses} budget={budgetVal} />
            </Suspense>

            <Suspense fallback={<div className="h-[500px] w-full bg-muted animate-pulse rounded-xl" />}>
              <MarketIntelligence 
                transactions={filteredViewData} 
                currentMonthExpenses={filteredViewData} 
                advice={activeAdvice ? { 
                  growth: activeAdvice.growth, 
                  confidence: activeAdvice.confidence,
                  investmentOptions: activeAdvice.investmentOptions,
                  platforms: activeAdvice.platforms,
                  personalizedPlan: activeAdvice.personalizedPlan
                } : null}
              />
            </Suspense>

            <AIInsightsCard 
              aiAdvice={activeAdvice ? { insights: activeAdvice.insights, projection: activeAdvice.projection, confidence: activeAdvice.confidence } : null} 
              aiAlerts={aiAlerts} 
              aiPrediction={aiPrediction} 
              t={t} 
              premiumSurface={premiumCard} 
            />

            <FinancialHealthScore 
              salary={filteredIncome} 
              totalExpenses={filteredSpent} 
              advice={activeAdvice ? { healthScore: activeAdvice.healthScore, healthReason: activeAdvice.healthReason, confidence: activeAdvice.confidence } : null}
            />
            
            <RecentExpenses 
              expenses={filteredViewData} 
              loading={loadingExpenses || isLoadingNativeTransactions} 
              onDelete={handleDeleteTransaction} 
              onClearAll={handleClearAll}
              onScan={loadNativeTransactions}
              userId={user?.id}
              dateFilter={dateFilter}
            />
          </>
        )}

        {activeTab === 'planning' && (
          <>
            <MonthlySnapshotCard totalInflow={totalInflow} budgetVal={budgetVal} totalOutflow={totalOutflow} netSaved={netSaved} t={t} premiumSurface={premiumCard} />
            <IncomeEngineCard salaryInput={salaryInput} setSalaryInput={setSalaryInput} handleSaveIncome={handleSaveIncome} isSavingIncome={isSavingIncome} t={t} premiumSurface={premiumCard} inputStyle={inputStyle} applePhysics={applePhysics} />
            <SafeSpendCard budgetInput={budgetInput} setBudgetInput={setBudgetInput} handleSaveBudget={handleSaveBudget} isSavingBudget={isSavingBudget} adjustBudget={adjustBudget} t={t} premiumSurface={premiumCard} inputStyle={inputStyle} applePhysics={applePhysics} stepperBtn={stepperBtn} />
            <EMIBillsCard bills={subscriptionBills} onDelete={handleDeleteSubscription} />
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

        {activeTab === 'future' && ( <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" />}><div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full"><FutureWealthPredictor monthlySavings={netSaved} /></div></Suspense> )}
        {activeTab === 'dreams' && ( <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" />}><div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><GoalProgress currentSavings={netSaved} /></div></Suspense> )}

        <div className="mt-16 mb-12 px-6 text-center">
          <div className="max-w-2xl mx-auto bg-card py-8 px-10 rounded-xl shadow-sm">
            <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-6 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-black/10" /> {t('dashboard.safetyPrivacy', 'Safety & Privacy')} <span className="h-px w-8 bg-black/10" />
            </h4>

            <div className="space-y-6 text-xs leading-relaxed font-bold uppercase tracking-wider text-left opacity-30">
              <div className="privacy-en pb-2" style={{ transition: 'opacity 0.5s ease', opacity: visibleStep >= 1 ? 1 : 0, visibility: visibleStep >= 1 ? 'visible' : 'hidden' }}>
                <p className="text-foreground italic mb-1.5">{t('dashboard.dataPrivacyTip', 'This data is for your information and tracking only. We do not directly access your bank accounts or transactions.')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="w-[95vw] sm:max-w-xl bg-background border border-border rounded-2xl shadow-xl">
          <DialogDescription className="sr-only">Loan setup form</DialogDescription>
          <div className="h-1 w-full bg-muted/50" />
          <form onSubmit={handleAddLoan} className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <DialogHeader className="p-0">
              <DialogTitle className="text-2xl font-bold tracking-tight uppercase text-foreground">
                {editingLoanId ? t('emi.editTitle', "Edit Loan") : t('dashboard.addEmiWithDetails', "Add Loan Details")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider ml-1">{t('emi.loanTitleLabel', 'Loan Title')}</Label>
              <Input value={loanName} onChange={e => setLoanName(e.target.value)} required className={inputStyle} placeholder={t('dashboard.emiNamePlaceholder', "e.g. Dream Car")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.principalAmount', 'Principal')} (₹)</Label><Input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} required className={inputStyle} /></div>
              <div className="space-y-2"><Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.interestRatePlaceholder', 'Rate')} (%)</Label><Input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} required className={inputStyle} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.months', 'Months')}</Label><Input type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} required className={inputStyle} /></div>
              <div className="space-y-2"><Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.inceptionDateLabel', 'Inception')}</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputStyle} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.bank', 'Bank/App Name')}</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} className={inputStyle} placeholder={t('emi.providerNamePlaceholder', "e.g. HDFC Bank")} />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.monthlyEmiDayLabel', 'EMI Day')}</Label>
                <Input type="number" min="1" max="31" value={emiDate} onChange={e => setEmiDate(e.target.value)} className={inputStyle} placeholder={t('dashboard.emiDayPlaceholder', "1-31")} />
              </div>
            </div>
            <div className="space-y-4 p-6 bg-muted/50 rounded-2xl border border-border">
              <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{t('emi.interestLogicLabel', 'Interest Mathematics')}</Label>
              <RadioGroup value={interestType} onValueChange={setInterestType} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-card px-4 py-3 rounded-xl border border-border flex-1 hover:border-black/10 transition-all cursor-pointer">
                  <RadioGroupItem value="REDUCING" id="red" className="text-foreground" /><Label htmlFor="red" className="text-foreground font-bold uppercase text-xs">{t('emi.reducingRecommended', 'Reducing')}</Label>
                </div>
                <div className="flex items-center space-x-2 bg-card px-4 py-3 rounded-xl border border-border flex-1 hover:border-black/10 transition-all cursor-pointer">
                  <RadioGroupItem value="FLAT" id="flt" className="text-foreground" /><Label htmlFor="flt" className="text-foreground font-bold uppercase text-xs">{t('emi.flat', 'Flat')}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => { setShowLoanModal(false); resetLoanForm(); }} className="rounded-xl h-14 flex-1 text-muted-foreground font-semibold text-sm hover:bg-black/5">{t('common.cancel', 'Cancel')}</Button>
              <Button type="submit" className="bg-primary text-primary-foreground rounded-xl h-14 flex-[2] font-bold text-sm hover:bg-primary/90 active:scale-[0.98]">{editingLoanId ? t('common.confirm', 'Update Loan') : t('common.confirm', 'Save Loan')}</Button>
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
