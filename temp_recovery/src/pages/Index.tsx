import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Icons
import { 
  Plus, 
  Trash2
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Layout Components
import AppHeader from "@/components/layout/AppHeader";

// Custom Components
import { EMILoanDetailsBlock } from "@/components/EMILoanDetailsBlock";

// Types
import { EMIEntry } from "@/types/emi";

// Utilities & Config
import { formatCurrency } from "@/utils/loanCalculator";
import { t } from "@/i18n";

// Flag to hide the simple EMI form (kept for backward compatibility, not rendered)
const SHOW_SIMPLE_EMI_FORM = false;

// ========== Helper: detect provider type ==========
const bankKeywords = ['hdfc', 'sbi', 'icici', 'axis', 'kotak', 'yes bank', 'pnb', 'bank of baroda', 'canara', 'union'];
const detectProviderType = (name: string): 'BANK' | 'APP' => {
  const lower = name.toLowerCase();
  return bankKeywords.some(keyword => lower.includes(keyword)) ? 'BANK' : 'APP';
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- States for Dashboard Data (existing) ---
  const [salary, setSalary] = useState("");
  const [currentSalary, setCurrentSalary] = useState("0");
  
  const [budget, setBudget] = useState("");
  const [currentBudget, setCurrentBudget] = useState("0");

  // Simple EMI states (kept for compatibility, but not used in UI)
  const [emiName, setEmiName] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [emiDay, setEmiDay] = useState("");
  const [totalEMI, setTotalEMI] = useState(0); // remains local sum for simple EMIs

  // Detailed EMI states
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDay, setLoanDay] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState<'BANK' | 'APP'>('BANK');
  const [loanType, setLoanType] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureYears, setTenureYears] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  const [interestType, setInterestType] = useState<'REDUCING' | 'FLAT'>('REDUCING');

  // Fetch detailed EMIs from Supabase
  const { data: emiEntries = [], refetch: refetchEmis } = useQuery({
    queryKey: ['emis', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('emis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Map loan_details to loanDetails
      return (data ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        amount: Number(e.amount),
        day: e.emi_day,
        loanDetails: e.loan_details ? {
          principal: e.loan_details.loanAmount,
          annualInterestRate: e.loan_details.interestRateAnnual,
          totalMonths: e.loan_details.tenureMonths,
          startDate: e.loan_details.startDate,
          loanType: e.loan_details.loanType,
          providerName: e.loan_details.providerName,
          providerType: e.loan_details.providerType,
          interestCalculationType: e.loan_details.interestCalculationType || 'REDUCING',
        } : undefined
      })) as EMIEntry[];
    },
    enabled: !!user,
  });

  // --- Memoized values ---
  const formattedCurrentSalary = useMemo(() => formatCurrency(Number(currentSalary)), [currentSalary]);
  const formattedCurrentBudget = useMemo(() => formatCurrency(Number(currentBudget)), [currentBudget]);

  // --- Handlers (memoized with useCallback) ---
  const handleSaveSalary = useCallback(() => {
    if (!salary) return;
    setCurrentSalary(salary);
    setSalary("");
    toast({ title: t('dashboard.salaryUpdated') });
  }, [salary, toast]);

  const handleAddEMI = useCallback(() => {
    if (!emiName || !emiAmount) return;
    setTotalEMI(prev => prev + Number(emiAmount));
    setEmiName("");
    setEmiAmount("");
    setEmiDay("");
    toast({ title: t('dashboard.addEmi') });
  }, [emiName, emiAmount, toast]);

  const handleAddEmiWithDetails = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = Number(loanAmount);
    if (!loanName || !amountNum) return;

    const tenureYearsNum = Number(tenureYears) || 0;
    const tenureMonthsNum = Number(tenureMonths) || 0;
    const totalTenure = tenureYearsNum * 12 + tenureMonthsNum;

    const loanDetails = {
      loanAmount: amountNum,
      loanType,
      providerName,
      providerType,
      interestRateAnnual: Number(interestRate),
      tenureMonths: totalTenure,
      startDate: startDate || undefined,
      interestCalculationType: interestType,
    };

    try {
      await supabase
        .from('emis')
        .insert({
          user_id: user.id,
          name: loanName,
          amount: amountNum,
          emi_day: loanDay ? Number(loanDay) : null,
          loan_details: loanDetails,
        });

      toast({
        title: t('dashboard.addEmiWithDetails'),
        className: "bg-purple-600 text-white"
      });

      // Reset modal
      setLoanName('');
      setLoanAmount('');
      setLoanDay('');
      setProviderName('');
      setProviderType('BANK');
      setLoanType('');
      setInterestRate('');
      setTenureYears('');
      setTenureMonths('');
      setStartDate('');
      setInterestType('REDUCING');
      setShowLoanModal(false);

      refetchEmis();
    } catch (error) {
      toast({
        title: t('common.error'),
        variant: "destructive"
      });
    }
  }, [user, loanName, loanAmount, loanDay, providerName, providerType, loanType, interestRate, tenureYears, tenureMonths, startDate, interestType, toast, refetchEmis]);

  const handleDeleteEmi = useCallback(async (id: string, amount: number) => {
    try {
      await supabase
        .from('emis')
        .delete()
        .eq('id', id);

      toast({ title: t('common.delete'), className: "bg-purple-600 text-white" });
      refetchEmis();
    } catch (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    }
  }, [toast, refetchEmis]);

  const handleSaveBudget = useCallback(() => {
    if (!budget) return;
    setCurrentBudget(budget);
    setBudget("");
    toast({ title: t('dashboard.budgetUpdated') });
  }, [budget, toast]);

  const adjustBudget = useCallback((amount: number) => {
    setCurrentBudget(prev => (Number(prev) + amount).toString());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Shared App Header */}
      <AppHeader />

      {/* ================= CONTENT ================= */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Top Action Button */}
        <div>
          <Button 
            onClick={() => navigate('/add-expense')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md rounded-full px-6 transition-all w-full sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" /> {t('dashboard.addExpense')}
          </Button>
        </div>

        {/* 1. Monthly Salary Card */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 py-4 px-4 sm:px-6 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800">{t('dashboard.monthlySalary')}</CardTitle>
            <CardDescription className="text-xs text-gray-500">{t('section.overview')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-4 sm:px-6 space-y-4">
            <div className="text-sm text-gray-500 font-medium">
              {t('dashboard.currentSalary')}: <span className="text-gray-900 font-bold text-lg ml-1">{formattedCurrentSalary}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                type="number" 
                placeholder={t('dashboard.enterSalary')}
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg h-11 w-full"
              />
              <Button onClick={handleSaveSalary} className="bg-purple-600 hover:bg-purple-700 text-white h-11 w-full sm:w-auto px-6">
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. EMI Tracker Card */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 py-4 px-4 sm:px-6 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800">{t('dashboard.emiTracker')}</CardTitle>
            <CardDescription className="text-xs text-gray-500">{t('section.recurringCommitments')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
            {/* Simple EMI form – hidden as per UX update */}
            {SHOW_SIMPLE_EMI_FORM && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <Input 
                    placeholder={t('dashboard.emiNamePlaceholder')}
                    value={emiName}
                    onChange={(e) => setEmiName(e.target.value)}
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg h-10"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input 
                    type="number"
                    placeholder={t('dashboard.emiAmountPlaceholder')}
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg h-10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input 
                    type="number"
                    placeholder={t('dashboard.emiDayPlaceholder')}
                    value={emiDay}
                    onChange={(e) => setEmiDay(e.target.value)}
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg h-10"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Button onClick={handleAddEMI} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10">
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            )}

            {/* Single entry point for detailed EMI */}
            <div className="flex justify-center sm:justify-end mt-2">
              <Button
                variant="outline"
                onClick={() => setShowLoanModal(true)}
                className="text-sm border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
              >
                + {t('dashboard.addEmiWithDetails')}
              </Button>
            </div>

            {/* Total Monthly EMI (from simple EMIs) – kept for backward compatibility */}
            {SHOW_SIMPLE_EMI_FORM && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-500 font-medium">{t('dashboard.totalMonthlyEmi')}</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalEMI)}</span>
              </div>
            )}

            {/* List of detailed EMIs */}
            {emiEntries.length > 0 && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.yourEmis')}</h3>
                {emiEntries.map((emi) => (
                  <div 
                    key={emi.id} 
                    className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
                  >
                    {/* Basic info row */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{emi.name}</p>
                        <p className="text-xs text-gray-500">
                          {t('dashboard.dayOfMonth', { day: emi.day || '—' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{formatCurrency(emi.amount)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteEmi(emi.id, emi.amount)} 
                          className="hover:bg-red-100 text-red-500 rounded-full h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Loan details block (only if present) */}
                    {emi.loanDetails && <EMILoanDetailsBlock entry={emi} />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Monthly Budget Card */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 py-4 px-4 sm:px-6 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-800">{t('dashboard.monthlyBudget')}</CardTitle>
            <CardDescription className="text-xs text-gray-500">{t('section.insights')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-4 sm:px-6 space-y-4">
            <div className="text-sm text-gray-500 font-medium">
              {t('dashboard.currentBudget')}: <span className="text-gray-900 font-bold text-lg ml-1">{formattedCurrentBudget}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                type="number" 
                placeholder={t('dashboard.enterBudget')}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg h-11 w-full"
              />
              <Button onClick={handleSaveBudget} className="bg-purple-600 hover:bg-purple-700 text-white h-11 w-full sm:w-auto px-6">
                {t('common.save')}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => adjustBudget(200)}
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 font-medium h-9 w-full sm:w-auto"
              >
                +200
              </Button>
              <Button 
                variant="outline" 
                onClick={() => adjustBudget(-200)}
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 font-medium h-9 w-full sm:w-auto"
              >
                -200
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ========== Modal for Detailed EMI Input ========== */}
        <Dialog open={showLoanModal} onOpenChange={setShowLoanModal}>
          <DialogContent className="sm:max-w-md w-[95%] mx-auto rounded-lg">
            <DialogHeader>
              <DialogTitle>{t('dashboard.addEmiWithDetails')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEmiWithDetails} className="space-y-4">
              {/* Basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input 
                  placeholder={t('dashboard.emiNamePlaceholder')}
                  value={loanName} 
                  onChange={e => setLoanName(e.target.value)} 
                  required 
                />
                <Input 
                  type="number" 
                  placeholder={t('dashboard.emiAmountPlaceholder')}
                  value={loanAmount} 
                  onChange={e => setLoanAmount(e.target.value)} 
                  required 
                />
                <Input 
                  type="number" 
                  placeholder={t('dashboard.emiDayPlaceholder')}
                  value={loanDay} 
                  onChange={e => setLoanDay(e.target.value)} 
                />
              </div>

              {/* Loan details */}
              <Input 
                placeholder={t('emi.providerName')}
                value={providerName} 
                onChange={e => {
                  setProviderName(e.target.value);
                  setProviderType(detectProviderType(e.target.value));
                }} 
                required 
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                placeholder={t('emi.loanType')}
                value={loanType} 
                onChange={e => setLoanType(e.target.value)} 
                required 
              />

              <Input 
                type="number" 
                step="0.1" 
                placeholder={t('emi.interestRate')}
                value={interestRate} 
                onChange={e => setInterestRate(e.target.value)} 
                required 
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input 
                  type="number" 
                  placeholder={t('emi.tenureYears')}
                  value={tenureYears} 
                  onChange={e => setTenureYears(e.target.value)} 
                />
                <Input 
                  type="number" 
                  placeholder={t('emi.tenureMonths')}
                  value={tenureMonths} 
                  onChange={e => setTenureMonths(e.target.value)} 
                />
              </div>

              <Input 
                type="date" 
                placeholder={t('emi.startDate')}
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />

              {/* Interest Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('emi.interestType')}</Label>
                <RadioGroup
                  value={interestType}
                  onValueChange={(v: 'REDUCING'|'FLAT') => setInterestType(v)}
                  className="flex flex-col sm:flex-row gap-4"
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

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowLoanModal(false)} className="w-full sm:w-auto">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                  {t('common.add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Index;