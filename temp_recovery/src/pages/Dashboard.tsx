/**
 * Dashboard Component
 * 
 * Main dashboard page for the BachatKaro expense management application.
 * Provides a comprehensive financial management interface with multiple tabs:
 * - Daily Tracker: View and manage daily expenses
 * - Planning: Set up salary, budget, and manage EMIs
 * - Future Wealth: Financial projections and wealth predictions
 * - My Dreams: Goal tracking and savings targets
 * 
 * Features:
 * - Real-time data synchronization with Supabase
 * - Offline support with network status detection
 * - Voice input for quick data entry
 * - Interactive charts and progress tracking
 * - Mobile-responsive design
 * 
 * @component
 */

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Trash2, Users, LayoutDashboard, 
  Calendar, Calculator, TrendingUp, Target, ArrowRight, Sparkles, PieChart, 
  Share2, WifiOff, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isToday, isThisWeek, isThisMonth, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Layout Components
import AppHeader from '@/components/layout/AppHeader';
import DashboardSubheader from '@/components/layout/DashboardSubheader';

// Component imports
import ExpenseTotalsGrid from '@/components/dashboard/ExpenseTotalsGrid';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import CategoryChart from '@/components/dashboard/CategoryChart';
import DateFilter, { type DateFilterValue } from '@/components/dashboard/DateFilter';
import SmartFinancialMentor from '@/components/dashboard/SmartFinancialMentor';
import FinancialHealthScore from '@/components/dashboard/FinancialHealthScore';
import FutureWealthPredictor from '@/components/dashboard/FutureWealthPredictor';
import GoalProgress from '@/components/dashboard/GoalProgress';
import VoiceInput from '@/components/ui/VoiceInput';
import { EMILoanDetailsBlock } from '@/components/EMILoanDetailsBlock';
import { EMIEntry } from '@/types/emi';

// i18n and currency formatter
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/currencyFormatter';

// Import loan calculator functions
import { getLoanSummary, getMonthsPaid } from '@/utils/loanCalculator';

/**
 * EMI (Equated Monthly Installment) interface – kept for backward compatibility
 * @interface EMI
 */
interface EMI {
  id: string;
  name: string;
  amount: number;
  emi_day: number;
  loan_details?: any; // JSONB column from Supabase, will be mapped to loanDetails
}

// ========== Helper to detect provider type ==========
const bankKeywords = ['hdfc', 'sbi', 'icici', 'axis', 'kotak', 'yes bank', 'pnb', 'bank of baroda', 'canara', 'union'];
const detectProviderType = (name: string): 'BANK' | 'APP' => {
  const lower = name.toLowerCase();
  return bankKeywords.some(keyword => lower.includes(keyword)) ? 'BANK' : 'APP';
};

/**
 * Dashboard Component
 * Main financial dashboard with multiple tabs for different features
 * 
 * @returns {JSX.Element} Rendered dashboard component
 */
const Dashboard = () => {
  // Authentication and routing hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage(); // 👈 translation function

  // Tab navigation state (only for dashboard internal tabs)
  const [activeTab, setActiveTab] = useState<'daily' | 'planning' | 'future' | 'dreams'>('daily');
  
  // Network connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Form input states
  const [salaryInput, setSalaryInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  
  // Filter state for expenses
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ preset: 'this_month' });

  // ========== Modal state for detailed EMI ==========
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDay, setLoanDay] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState<'BANK' | 'APP'>('BANK');
  const [loanType, setLoanType] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<'REDUCING'|'FLAT'>('REDUCING');
  const [tenureYears, setTenureYears] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState('');

  // ========== Edit EMI state ==========
  const [editingEmi, setEditingEmi] = useState<EMIEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  /**
   * Network Status Listener
   * Monitors online/offline status and provides user feedback
   * Invalidates queries when coming back online to refresh data
   */
  useEffect(() => {
    const handleOnline = () => { 
      setIsOnline(true); 
      toast({ 
        title: t('common.onlineTitle'), 
        description: t('common.onlineDesc'),
        className: "bg-green-600 text-white" 
      }); 
      queryClient.invalidateQueries(); 
    };

    const handleOffline = () => { 
      setIsOnline(false); 
      toast({ 
        title: t('common.offlineTitle'), 
        description: t('common.offlineDesc'),
        variant: "destructive" 
      }); 
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, [queryClient, toast, t]);

  // ==================== DATA FETCHING ====================

  /**
   * Fetch expenses from Supabase
   * Returns formatted expense objects with proper typing
   */
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!isOnline) return [];
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('expense_date', { ascending: false });
      
      return (data ?? []).map((e) => ({ 
        id: e.id, 
        amount: Number(e.amount), 
        category: e.category, 
        payment_mode: e.payment_mode, 
        date: e.expense_date,
        note: e.note 
      }));
    },
    enabled: !!user,
  });

  /**
   * Fetch latest salary data
   */
  const { data: salaryData, refetch: refetchSalary } = useQuery({
    queryKey: ['salary', user?.id],
    queryFn: async () => { 
      const { data } = await supabase
        .from('salaries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
      return data; 
    },
    enabled: !!user,
    staleTime: 0,
  });

  /**
   * Fetch latest budget data
   */
  const { data: budgetData, refetch: refetchBudget } = useQuery({
    queryKey: ['budget', user?.id],
    queryFn: async () => { 
      const { data } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
      return data; 
    },
    enabled: !!user,
    staleTime: 0,
  });

  /**
   * Fetch all EMIs for the user – now includes loan_details JSONB column
   */
  const { data: emiList = [], refetch: refetchEmi } = useQuery({
    queryKey: ['emis', user?.id],
    queryFn: async () => { 
      const { data } = await supabase
        .from('emis')
        .select('*')
        .eq('user_id', user?.id); 
      // Map loan_details to loanDetails, ensuring backward compatibility
      return (data ?? []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
        loanDetails: e.loan_details ? {
          principal: e.loan_details.loanAmount,
          annualInterestRate: e.loan_details.interestRateAnnual,
          totalMonths: e.loan_details.tenureMonths,
          startDate: e.loan_details.startDate,
          loanType: e.loan_details.loanType,
          providerName: e.loan_details.providerName,
          providerType: e.loan_details.providerType,
        } : undefined
      })) as EMIEntry[];
    },
    enabled: !!user,
  });

  /**
   * Sync salary data to input field when fetched
   */
  useEffect(() => { 
    if (salaryData?.monthly_salary) setSalaryInput(salaryData.monthly_salary.toString()); 
  }, [salaryData]);

  /**
   * Sync budget data to input field when fetched
   */
  useEffect(() => { 
    if (budgetData?.monthly_budget) setBudgetInput(budgetData.monthly_budget.toString()); 
  }, [budgetData]);

  // ==================== FINANCIAL CALCULATIONS ====================

  /** Parsed salary amount */
  const salary = Number(salaryData?.monthly_salary) || 0;
  
  /** Parsed budget amount */
  const budget = Number(budgetData?.monthly_budget) || 0;
  
  /** Total expenses for current month */
  const monthlyExpense = expenses.reduce((sum, e) => { 
    if (isThisMonth(new Date(e.date))) return sum + e.amount; 
    return sum; 
  }, 0);
  
  /** 
   * Total monthly EMI amount – computed correctly:
   * For entries with loanDetails, use calculated monthly EMI.
   * For simple EMIs, use stored amount (which is already monthly).
   */
  const totalMonthlyEmi = useMemo(() => {
    return emiList.reduce((sum: number, entry: EMIEntry) => {
      if (entry.loanDetails) {
        // Compute monthly EMI using the same logic as in EMILoanDetailsBlock
        const monthsPaid = getMonthsPaid(entry.loanDetails.startDate);
        const summary = getLoanSummary({
          principal: entry.loanDetails.principal,
          annualRate: entry.loanDetails.annualInterestRate,
          tenureMonths: entry.loanDetails.totalMonths,
          monthsPaid,
          interestCalculationType: entry.loanDetails.interestCalculationType || 'REDUCING',
        });
        return sum + (summary.emi || 0);
      }
      // Simple EMI: amount is already the monthly amount
      return sum + entry.amount;
    }, 0);
  }, [emiList]);
  
  /** Total spending (expenses + EMIs) – now uses correct totalMonthlyEmi */
  const totalSpent = monthlyExpense + totalMonthlyEmi; 
  
  /** Savings calculation (salary - total spent) */
  const savings = salary - totalSpent;
  
  /** Expenses to consider for budget tracking (excludes EMIs) */
  const expensesForBudget = monthlyExpense; 
  
  /** Budget utilization percentage */
  const budgetProgress = budget > 0 ? Math.min((expensesForBudget / budget) * 100, 100) : 0;
  
  /** Dynamic color for budget progress bar */
  const budgetColor = budgetProgress >= 100 ? "bg-red-600" : budgetProgress > 80 ? "bg-orange-500" : "bg-green-500";

  // ==================== ACTION HANDLERS ====================

  /**
   * Handles smart voice input with auto-save functionality
   */
  const handleSmartNumberAutoSave = async (transcript: string, type: 'salary' | 'budget') => {
    const nums = transcript.match(/\d+/);
    if (!nums || !user) return;

    const amount = parseFloat(nums[0]);
    const table = type === 'salary' ? 'salaries' : 'budgets';
    const column = type === 'salary' ? 'monthly_salary' : 'monthly_budget';

    try {
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from(table)
          .update({ [column]: amount })
          .eq('id', existing.id);
      } else {
        await supabase
          .from(table)
          .insert({ user_id: user.id, [column]: amount });
      }

      if (type === 'salary') { 
        setSalaryInput(amount.toString()); 
        refetchSalary(); 
      } else { 
        setBudgetInput(amount.toString()); 
        refetchBudget(); 
      }

      toast({ 
        title: `${type === 'salary' ? t('common.salary') : t('common.budget')} ${t('common.autoSaved')}`, 
        description: t('common.updatedTo', { amount: formatCurrency(amount) }),
        className: "bg-green-600 text-white"
      });
    } catch (error) {
      toast({ 
        title: t('common.autoSaveFailed'), 
        variant: "destructive" 
      });
    }
  };

  /**
   * Handles WhatsApp group invitation sharing
   */
  const handleShareInvite = () => {
    const downloadLink = "PASTE_YOUR_DIRECT_APK_LINK_HERE"; 
    const finalLink = downloadLink === "PASTE_YOUR_DIRECT_APK_LINK_HERE" ? window.location.origin : downloadLink;
    
    const message = t('groups.whatsappMessage', { link: finalLink });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * Saves salary data to database
   */
  const handleSaveSalary = async () => {
    if (!salaryInput || !user || !isOnline) return;
    
    const amount = parseFloat(salaryInput);
    if (isNaN(amount)) { 
      toast({ title: t('common.invalid'), variant: "destructive" }); 
      return; 
    }

    try {
      const { data: existing } = await supabase
        .from('salaries')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('salaries')
          .update({ monthly_salary: amount })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('salaries')
          .insert({ user_id: user.id, monthly_salary: amount });
      }

      await refetchSalary();
      toast({ 
        title: t('dashboard.salaryUpdated'), 
        className: "bg-purple-600 text-white" 
      });
    } catch (error) { 
      toast({ 
        title: t('common.error'), 
        variant: "destructive" 
      }); 
    }
  };

  /**
   * Saves budget data to database
   */
  const handleSaveBudget = async () => {
    if (!budgetInput || !user || !isOnline) return;
    
    const amount = parseFloat(budgetInput);
    if (isNaN(amount)) { 
      toast({ title: t('common.invalid'), variant: "destructive" }); 
      return; 
    }

    try {
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('budgets')
          .update({ monthly_budget: amount })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('budgets')
          .insert({ user_id: user.id, monthly_budget: amount });
      }

      await refetchBudget();
      toast({ 
        title: t('dashboard.budgetUpdated'), 
        className: "bg-purple-600 text-white" 
      });
    } catch (error) { 
      toast({ 
        title: t('common.error'), 
        variant: "destructive" 
      }); 
    }
  };

  /**
   * Adds detailed EMI with loan information
   */
  const handleAddEmiWithDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOnline) return;

    const amountNum = Number(loanAmount);
    if (!loanName || !amountNum) return;

    // Calculate total tenure in months
    const tenureYearsNum = Number(tenureYears) || 0;
    const tenureMonthsNum = Number(tenureMonths) || 0;
    const totalTenure = tenureYearsNum * 12 + tenureMonthsNum;

    // Prepare loan_details object (matches the JSONB structure we will store)
    const loanDetails = {
      loanAmount: amountNum,
      loanType,
      providerName,
      providerType,
      interestRateAnnual: Number(interestRate),
      interestType,
      tenureMonths: totalTenure,
      startDate: startDate || undefined,
    };

    try {
      await supabase
        .from('emis')
        .insert({
          user_id: user.id,
          name: loanName,
          amount: amountNum,
          emi_day: loanDay ? Number(loanDay) : null,
          loan_details: loanDetails, // new JSONB column
        });

      toast({
        title: t('dashboard.emiWithDetailsAdded'),
        className: "bg-purple-600 text-white"
      });

      // Reset modal fields
      setLoanName('');
      setLoanAmount('');
      setLoanDay('');
      setProviderName('');
      setProviderType('BANK');
      setLoanType('');
      setInterestRate('');
      setInterestType('REDUCING');
      setTenureYears('');
      setTenureMonths('');
      setStartDate('');
      setShowLoanModal(false);

      refetchEmi();
    } catch (error) {
      toast({
        title: t('common.error'),
        variant: "destructive"
      });
    }
  };

  /**
   * Deletes an EMI from database
   */
  const handleDeleteEmi = async (id: string) => {
    try { 
      await supabase
        .from('emis')
        .delete()
        .eq('id', id); 

      toast({ 
        title: t('common.deleted'), 
        className: "bg-purple-600 text-white" 
      }); 
      
      await refetchEmi(); 
    } catch (error) { 
      toast({ 
        title: t('common.error'), 
        variant: "destructive" 
      }); 
    }
  };

  /**
   * Opens edit modal with selected EMI data
   */
  const handleEditClick = (emi: EMIEntry) => {
    setEditingEmi(emi);
    setShowEditModal(true);
  };

  /**
   * Updates an existing EMI
   */
  const handleUpdateEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmi || !user || !isOnline) return;

    try {
      await supabase
        .from('emis')
        .update({
          name: editingEmi.name,
          amount: editingEmi.amount,
          emi_day: editingEmi.emi_day || null,
        })
        .eq('id', editingEmi.id);

      toast({ 
        title: t('common.updated'), 
        className: "bg-purple-600 text-white" 
      });
      setShowEditModal(false);
      setEditingEmi(null);
      refetchEmi();
    } catch (error) {
      toast({ 
        title: t('common.error'), 
        variant: "destructive" 
      });
    }
  };

  /**
   * Filters expenses based on selected date filter
   */
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    
    return expenses.filter((e) => {
      const d = new Date(e.date);
      
      switch (dateFilter.preset) {
        case 'today': 
          return isToday(d);
        
        case 'this_week': 
          return isThisWeek(d);
        
        case 'last_week': { 
          const start = startOfWeek(subWeeks(now, 1)); 
          const end = endOfWeek(subWeeks(now, 1)); 
          return isWithinInterval(d, { start, end }); 
        }
        
        case 'this_month': 
          return isThisMonth(d);
        
        default: 
          return true;
      }
    });
  }, [expenses, dateFilter]);

  // ==================== UI STYLES ====================
  
  const gradientClass = "bg-gradient-to-r from-purple-800 to-pink-600";
  const cardClass = "bg-white rounded-2xl shadow-md border-none";
  const headingText = "text-[#333333]";
  const subText = "text-[#666666]";

  /**
   * Main render
   */
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f3f4f6] pb-24 md:pb-10 font-sans dark:bg-gray-900 dark:text-gray-100">
      
      {/* Shared App Header */}
      <AppHeader />

      {/* Dashboard Subheader (only on this page) */}
      <DashboardSubheader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ========== TAB 1: DAILY TRACKER ========== */}
        {activeTab === 'daily' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab description */}
            <p className="text-sm text-gray-500 italic dark:text-gray-400">
              {t('tabs.daily.description')}
            </p>
            <SmartFinancialMentor 
              salary={salary} 
              totalExpenses={totalSpent} 
              budgetLimit={budget} 
              expensesList={expenses} 
            />
            
            {/* 👇 QuickAddExpense removed – using existing Add Expense button */}

            <Button 
              onClick={() => navigate('/add-expense')} 
              className={`w-full ${gradientClass} hover:opacity-90 text-white py-6 rounded-full shadow-lg text-lg font-bold transform transition active:scale-[0.98]`}
            >
              <Plus className="mr-2 h-6 w-6" /> {t('dashboard.addExpense')}
            </Button>
            <ExpenseTotalsGrid 
              todayTotal={filteredExpenses.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.amount, 0)}
              weeklyTotal={filteredExpenses.filter(e => isThisWeek(new Date(e.date))).reduce((s, e) => s + e.amount, 0)}
              monthlyTotal={expenses.reduce((s, e) => s + e.amount, 0)}
              loading={false}
            />
            <div className={`${cardClass} p-5 dark:bg-gray-800 dark:border-gray-700`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${headingText} flex items-center gap-2 dark:text-gray-100`}>
                  <TrendingUp className="h-5 w-5 text-purple-600"/>
                  {t('dashboard.spendingTrends')}
                </h3>
                <DateFilter value={dateFilter} onChange={setDateFilter} filteredData={filteredExpenses} />
              </div>
              <CategoryChart expenses={filteredExpenses} loading={false} budget={budget} />
            </div>
            <FinancialHealthScore salary={salary} totalExpenses={totalSpent} />
            <RecentExpenses expenses={filteredExpenses} loading={false} />
          </div>
        )}

        {/* ========== TAB 2: PLANNING ========== */}
        {activeTab === 'planning' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab description */}
            <p className="text-sm text-gray-500 italic dark:text-gray-400">
              {t('tabs.planning.description')}
            </p>
            
            {/* Monthly Snapshot Cards */}
            <Card className={`${cardClass} overflow-hidden relative dark:bg-gray-800`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-10 -mt-10 dark:bg-purple-900/20"></div>
              <CardHeader>
                <CardTitle className={`${headingText} flex items-center gap-2 text-lg dark:text-gray-100`}>
                  <PieChart className="h-6 w-6 text-purple-600"/>
                  {t('monthlySnapshot.title', { month: '' })}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  {t('monthlySnapshot.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center relative z-10">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider dark:text-gray-400">{t('monthlySnapshot.income')}</p>
                  <p className="text-lg font-black text-purple-900 dark:text-purple-300">{formatCurrency(salary)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider dark:text-gray-400">{t('monthlySnapshot.budget')}</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">{formatCurrency(budget)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider dark:text-gray-400">{t('monthlySnapshot.spent')}</p>
                  <p className="text-lg font-black text-red-600 dark:text-red-300">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl border border-green-100 dark:bg-green-900/20 dark:border-green-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider dark:text-gray-400">{t('monthlySnapshot.saved')}</p>
                  <p className="text-lg font-black text-green-600 dark:text-green-300">{formatCurrency(savings)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Salary Setup */}
            <Card className={`${cardClass} dark:bg-gray-800`}>
              <CardHeader>
                <CardTitle className={`text-base ${headingText} dark:text-gray-100`}>{t('dashboard.salarySetup')}</CardTitle>
                <CardDescription className={`${subText} dark:text-gray-400`}>{t('dashboard.salarySetupDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <div className="relative w-full">
                  <Input 
                    type="number" 
                    placeholder={t('dashboard.enterAmount')} 
                    value={salaryInput} 
                    onChange={e => setSalaryInput(e.target.value)} 
                    className="rounded-xl border-gray-300 focus:ring-purple-500 h-11 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <VoiceInput onResult={(val) => handleSmartNumberAutoSave(val, 'salary')} />
                </div>
                <Button 
                  onClick={handleSaveSalary} 
                  className={`${gradientClass} rounded-full h-11 px-6`}
                >
                  {t('common.save')}
                </Button>
              </CardContent>
            </Card>

            {/* Budget Setup */}
            <Card className={`${cardClass} dark:bg-gray-800`}>
              <CardHeader>
                <CardTitle className={`text-base ${headingText} dark:text-gray-100`}>{t('dashboard.budgetSetup')}</CardTitle>
                <CardDescription className={`${subText} dark:text-gray-400`}>{t('dashboard.budgetSetupDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <div className="relative w-full">
                    <Input 
                      type="number" 
                      placeholder={t('dashboard.setLimit')} 
                      value={budgetInput} 
                      onChange={e => setBudgetInput(e.target.value)} 
                      className="rounded-xl border-gray-300 focus:ring-purple-500 h-11 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <VoiceInput onResult={(val) => handleSmartNumberAutoSave(val, 'budget')} />
                  </div>
                  <Button 
                    onClick={handleSaveBudget} 
                    className={`${gradientClass} rounded-full h-11 px-6`}
                  >
                    {t('common.set')}
                  </Button>
                </div>
                {budget > 0 && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="flex justify-between text-sm font-bold">
                      <span className={budgetProgress >= 100 ? "text-red-600" : "text-gray-700 dark:text-gray-300"}>
                        {budgetProgress >= 100 ? t('dashboard.overBudget') : t('dashboard.spentSoFar')}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">{formatCurrency(expensesForBudget)} / {formatCurrency(budget)}</span>
                    </div>
                    <Progress value={budgetProgress} className="h-3 bg-gray-200 dark:bg-gray-600" />
                    <p className="text-xs text-gray-500 text-right dark:text-gray-400">{budgetProgress.toFixed(1)}% {t('dashboard.used')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ========== EMI & Fixed Bills Setup (ENHANCED) ========== */}
            <Card className={`${cardClass} dark:bg-gray-800`}>
              <CardHeader>
                <CardTitle className={`text-base ${headingText} dark:text-gray-100`}>{t('emiBills.title')}</CardTitle>
                <CardDescription className={`${subText} dark:text-gray-400`}>
                  {t('dashboard.totalCommitments')}: {formatCurrency(totalMonthlyEmi)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Button to open detailed loan modal – now with gradient CTA style */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowLoanModal(true)}
                    className={`${gradientClass} text-white rounded-full px-6 py-2 text-sm font-bold shadow-lg hover:opacity-90 transition-opacity`}
                  >
                    + {t('dashboard.addEmiWithDetails')}
                  </Button>
                </div>

                {/* EMI List (now with edit and delete options) */}
                <div className="space-y-3 pt-2">
                  {emiList.map((emi: EMIEntry) => (
                    <div 
                      key={emi.id} 
                      className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                    >
                      {/* Basic info row */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold text-sm ${headingText} dark:text-gray-100`}>{emi.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('dashboard.dayOfMonth', { day: emi.emi_day || '—' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${headingText} dark:text-gray-100`}>{formatCurrency(emi.amount)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(emi)}
                            className="text-gray-500 hover:text-blue-600 rounded-full h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteEmi(emi.id)} 
                            className="hover:bg-red-100 text-red-500 rounded-full h-8 w-8 p-0 dark:hover:bg-red-900/20 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Loan details block (only if present) */}
                      {emi.loanDetails && <EMILoanDetailsBlock entry={emi} />}
                    </div>
                  ))}

                  {/* Empty State */}
                  {emiList.length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('dashboard.noEmis')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========== TAB 3: FUTURE WEALTH ========== */}
        {activeTab === 'future' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-sm text-gray-500 italic dark:text-gray-400">
              {t('tabs.future.description')}
            </p>
            <FutureWealthPredictor monthlySavings={savings} />
          </div>
        )}

        {/* ========== TAB 4: DREAMS ========== */}
        {activeTab === 'dreams' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-sm text-gray-500 italic dark:text-gray-400">
              {t('tabs.dreams.description')}
            </p>
            <GoalProgress currentSavings={savings} />
            <div className="text-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl dark:bg-gray-800 dark:border-gray-700">
              <Sparkles className="h-8 w-8 text-purple-300 mx-auto mb-2 dark:text-purple-600" />
              <p className="text-gray-500 text-sm font-medium dark:text-gray-400">{t('dreams.comingSoon')}</p>
            </div>
          </div>
        )}

        {/* Groups content removed – now handled by routing */}

      </main>

      {/* ========== Modal for Detailed EMI Input ========== */}
      <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.addEmiWithDetails')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmiWithDetails} className="space-y-4">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder={t('emi.name')} 
                value={loanName} 
                onChange={e => setLoanName(e.target.value)} 
                required 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <Input 
                type="number" 
                placeholder={t('emi.amount')}
                value={loanAmount} 
                onChange={e => setLoanAmount(e.target.value)} 
                required 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <Input 
                type="number" 
                placeholder={t('emi.dayOptional')} 
                value={loanDay} 
                onChange={e => setLoanDay(e.target.value)} 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Loan details */}
            <Input 
              placeholder={t('emi.providerNamePlaceholder')} 
              value={providerName} 
              onChange={e => {
                setProviderName(e.target.value);
                // Optional auto-detect provider type
                setProviderType(detectProviderType(e.target.value));
              }} 
              required 
              className="dark:bg-gray-700 dark:border-gray-600"
            />
            
            <div className="flex items-center gap-4">
              <Label className="text-sm">{t('emi.providerType')}:</Label>
              <RadioGroup 
                value={providerType} 
                onValueChange={(v: 'BANK'|'APP') => setProviderType(v)} 
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BANK" id="bank" />
                  <Label htmlFor="bank">{t('emi.bank')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="APP" id="app" />
                  <Label htmlFor="app">{t('emi.app')}</Label>
                </div>
              </RadioGroup>
            </div>

            <Input 
              placeholder={t('emi.loanTypePlaceholder')} 
              value={loanType} 
              onChange={e => setLoanType(e.target.value)} 
              required 
              className="dark:bg-gray-700 dark:border-gray-600"
            />
            
            <Input 
              type="number" 
              step="0.1" 
              placeholder={t('emi.interestRatePlaceholder')} 
              value={interestRate} 
              onChange={e => setInterestRate(e.target.value)} 
              required 
              className="dark:bg-gray-700 dark:border-gray-600"
            />
            
            {/* Interest Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('emi.interestType')}</Label>
              <RadioGroup
                value={interestType}
                onValueChange={(v: 'REDUCING'|'FLAT') => setInterestType(v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="REDUCING" id="reducing" />
                  <Label htmlFor="reducing" className="text-sm">{t('emi.reducingRecommended')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FLAT" id="flat" />
                  <Label htmlFor="flat" className="text-sm">{t('emi.flat')}</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('emi.interestTypeHint')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="number" 
                placeholder={t('emi.tenureYears')} 
                value={tenureYears} 
                onChange={e => setTenureYears(e.target.value)} 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <Input 
                type="number" 
                placeholder={t('emi.tenureMonths')} 
                value={tenureMonths} 
                onChange={e => setTenureMonths(e.target.value)} 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <Input 
              type="date" 
              placeholder={t('emi.startDateOptional')} 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="dark:bg-gray-700 dark:border-gray-600"
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowLoanModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                {t('common.add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== Edit EMI Modal ========== */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('emi.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEmi} className="space-y-4">
            <Input
              placeholder={t('emi.editName')}
              value={editingEmi?.name || ''}
              onChange={e => setEditingEmi(prev => prev ? { ...prev, name: e.target.value } : null)}
              required
            />
            <Input
              type="number"
              placeholder={t('emi.editAmount')}
              value={editingEmi?.amount || ''}
              onChange={e => setEditingEmi(prev => prev ? { ...prev, amount: Number(e.target.value) } : null)}
              required
            />
            <Input
              type="number"
              placeholder={t('emi.editDay')}
              value={editingEmi?.emi_day || ''}
              onChange={e => setEditingEmi(prev => prev ? { ...prev, emi_day: Number(e.target.value) || null } : null)}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                {t('common.update')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Action Buttons */}
      {/* VoiceExpenseAdder removed – now integrated in AddExpense page */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center h-16 dark:bg-gray-800 dark:border-gray-700">
        <button 
          onClick={() => setActiveTab('daily')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'daily' ? 'text-purple-600 scale-105 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <LayoutDashboard className={`h-6 w-6 ${activeTab === 'daily' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">{t('tabs.daily')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('planning')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'planning' ? 'text-purple-600 scale-105 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Calculator className="h-6 w-6" />
          <span className="text-[10px] font-bold">{t('tabs.planning')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('future')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'future' ? 'text-purple-600 scale-105 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <TrendingUp className="h-6 w-6" />
          <span className="text-[10px] font-bold">{t('tabs.future')}</span>
        </button>
        <button 
          onClick={() => navigate('/group-expenses')} 
          className={`flex flex-col items-center gap-1 transition-all text-gray-400 dark:text-gray-500`}
        >
          <Users className="h-6 w-6" />
          <span className="text-[10px] font-bold">{t('tabs.groups')}</span>
        </button>
      </div>

    </div>
  );
};

export default Dashboard;