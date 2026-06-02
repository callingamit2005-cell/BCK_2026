import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { fetchUnifiedLedger, toUnifiedNativeEntry, toUnifiedSalaryEntry, mergeUnifiedLedgerEntries, isValidSmsTransaction, type LedgerWindow, type UnifiedLedgerEntry } from '@/features/transactions/ledger';
import { getNativeTransactions, addSmsListener } from '@/integrations/smsBridge';
import { DashboardTransaction, toDashboardTransaction, getSalaryAmount, SalaryRecord } from '@/utils/dashboardHelpers';
import { isToday, isThisWeek, startOfDay, endOfDay } from 'date-fns';
import { isCurrentMonth, isValidDate, isLastMonth, safeDate } from '@/utils/dateFilters';
import { type DateFilterValue } from '@/components/dashboard/DateFilter';
import { fetchLocalOrCloud } from '@/integrations/sqliteService';

// ✅ FIX: IST-safe date boundary helpers
const toLocalStart = (date: Date): Date => startOfDay(date);
const toLocalEnd = (date: Date): Date => endOfDay(date);  // 23:59:59.999 local time

export const useDashboardData = (
  user: any, 
  canReadSms: boolean, 
  ledgerWindow: LedgerWindow, 
  currentMonthYear: string, 
  dateFilter: DateFilterValue, 
  isSQLiteReady: boolean = true,
  manualInjections: any[] = [] // 🛡️ [STRESS_TEST_INJECTION_PORT]
) => {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const [isLoadingNativeTransactions, setIsLoadingNativeTransactions] = useState(false);
  const isAndroid = Capacitor.getPlatform() === 'android';
  const feederInProgressRef = useRef(false);

  const { data: salaryData } = useQuery({
    queryKey: ['salaries', user?.id, currentMonthYear],
    queryFn: async () => {
      if (!user?.id) return null;
      const data = await fetchLocalOrCloud('salaries', user.id, `AND month_year = '${currentMonthYear}' AND is_latest = 1`);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });

  const { data: budgetData } = useQuery({
    queryKey: ['budgets', user?.id, currentMonthYear],
    queryFn: async () => {
      if (!user?.id) return null;
      const data = await fetchLocalOrCloud('budgets', user.id, `AND month_year = '${currentMonthYear}' AND is_latest = 1`);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user,
  });

  const { data: ledgerTransactions = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['ledger-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      if (isAndroid && !isSQLiteReady) {
        return [];
      }

      const results = await fetchUnifiedLedger(user.id, ledgerWindow);
      return results;
    },
    enabled: !!user?.id && (isAndroid ? isSQLiteReady : true),
    staleTime: 30000,
  });

  // 🛡️ [LOOP_PROTECTION_LOCK]
  const isInvalidatingRef = useRef(false);
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleRefresh = (event?: Event) => {
      // 🛡️ [STORM_GUARD] Prevent circular invalidation during batch feeding or silent scans
      if (isInvalidatingRef.current || (window as any).BK_IS_SCANNING) {
        return;
      }
      
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
      }
      
      invalidationTimeoutRef.current = setTimeout(async () => {
        try {
          isInvalidatingRef.current = true;
          // 🚀 [ATOMIC_REFRESH] Invalidate only what is necessary
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['ledger-transactions', user?.id] }),
            queryClient.invalidateQueries({ queryKey: ['salaries', user?.id] }),
            queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] })
          ]);
        } finally {
          // Allow future invalidations after React Query has finished triggering refetches
          setTimeout(() => {
            isInvalidatingRef.current = false;
          }, 1000);
        }
      }, 500); // 500ms stable debounce window
    };

    window.addEventListener('sync_queue_updated', handleRefresh);
    window.addEventListener('newTransaction', handleRefresh);
    window.addEventListener('newLocalTransaction', handleRefresh);

    return () => {
      if (invalidationTimeoutRef.current) clearTimeout(invalidationTimeoutRef.current);
      window.removeEventListener('sync_queue_updated', handleRefresh);
      window.removeEventListener('newTransaction', handleRefresh);
      window.removeEventListener('newLocalTransaction', handleRefresh);
    };
  }, [queryClient, user?.id]);

  const hasRunFeederRef = useRef(false);
  const loadNativeTransactions = useCallback(async () => {
    if (!user?.id || feederInProgressRef.current || hasRunFeederRef.current) return;

    try {
      hasRunFeederRef.current = true;
      feederInProgressRef.current = true;
      setIsLoadingNativeTransactions(true);
      const PAGE_SIZE = 50;
      const MAX_TOTAL = 500;
      let currentOffset = 0;
      let hasMore = true;

      const { saveLocalTransaction } = await import('@/integrations/sqlite');

      while (hasMore && currentOffset < MAX_TOTAL) {
        const res = await getNativeTransactions(user.id, user.created_at, PAGE_SIZE, currentOffset);
        const transactions = res.transactions ?? [];

        if (transactions.length === 0) {
          hasMore = false;
          break;
        }

        // 🛡️ [CANONICAL_FEEDER_PIPELINE]
        const { autoMapTransactionToGroup } = await import('@/features/auto-group/AutoGroupMapper');
        for (const tx of transactions) {
          if (isValidSmsTransaction(tx)) {
            const unified = toUnifiedNativeEntry(tx);
            // 🛡️ [SILENT_FEEDER] Use silent: true during batch ingestion
            const payload = {
              id: unified.id,
              user_id: user.id,
              amount: unified.amount,
              type: unified.type,
              category: unified.category,
              payment_mode: unified.paymentMode,
              description: unified.payee,
              date: unified.date,
              sms_hash: unified.smsHash,
              entry_source: 'sms', // Explicitly tagged
              sync_status: 'completed' // Native records are considered local truth
            };
            await saveLocalTransaction(payload, true);
            
            // 🚀 [STORM_FIX] Pass silent: true to mapping to prevent event flood
            if (payload.type === 'expense') {
              void autoMapTransactionToGroup(payload, true);
            }
          }
        }

        currentOffset += PAGE_SIZE;
        if (transactions.length < PAGE_SIZE) {
          hasMore = false;
        }

        await new Promise(resolve => setTimeout(() => resolve(undefined), 0));
      }

      // 🚀 [LOOP_FIX] Single dispatch signal after batch is complete
      window.dispatchEvent(new Event('newLocalTransaction'));

    } catch (err) {
      console.error('Bridge feeder error:', err);
    } finally {
      setIsLoadingNativeTransactions(false);
      feederInProgressRef.current = false;
    }
  }, [user?.id, user?.created_at, queryClient]);

  // 🛡️ [OFFLINE-FIRST REALTIME UI]
  useEffect(() => {
    let smsListener: { remove: () => void } | null = null;
    let isMounted = true;

    const handleNewLocal = (event: any) => {
      // 🛡️ [REDUNDANCY_FIX] Removed immediate invalidation.
      // handleRefresh already listens for 'newLocalTransaction' and handles debounced invalidation.
    };

    const handleNewSms = async (data: any) => {
      if (isMounted && data?.transaction) {
        try {
          const { saveLocalTransaction } = await import('@/integrations/sqlite');
          const tx = data.transaction;
          
          if (isValidSmsTransaction(tx)) {
            const unified = toUnifiedNativeEntry(tx);
            
            // 🚀 [STORM_FIX] Use silent: true to suppress event flood from saveLocalTransaction.
            // Dispatch a manual DOM event which is caught and debounced by handleRefresh.
            await saveLocalTransaction({
              id: unified.id,
              user_id: user.id,
              amount: unified.amount,
              type: unified.type,
              category: unified.category,
              payment_mode: unified.paymentMode,
              description: unified.payee,
              date: unified.date,
              sms_hash: unified.smsHash,
              entry_source: 'sms',
              sync_status: 'completed'
            }, true); // SILENT

            window.dispatchEvent(new Event('newLocalTransaction'));
          }
        } catch (err) {
          console.error('Realtime SMS ingestion failed:', err);
          // Fallback to full scan if single ingestion fails
          await loadNativeTransactions();
        }
      }
    };

    const setupListeners = async () => {
      if (!user?.id) return;

      window.addEventListener('newLocalTransaction', handleNewLocal);

      if (Capacitor.getPlatform() === 'android') {
        smsListener = await addSmsListener('newTransaction', handleNewSms);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      window.removeEventListener('newLocalTransaction', handleNewLocal);
      if (smsListener) {
        smsListener.remove();
      }
    };
  }, [queryClient, user?.id, loadNativeTransactions]);

  const { data: emiList = [] } = useQuery({
    queryKey: ['emis', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await fetchLocalOrCloud('emis', user.id, 'AND is_latest = 1');
      return (data ?? []).map((e: any) => {
        let rawLoanDetails = e.loan_details;
        if (typeof rawLoanDetails === 'string') {
          try {
            rawLoanDetails = JSON.parse(rawLoanDetails);
            if (typeof rawLoanDetails === 'string') {
              rawLoanDetails = JSON.parse(rawLoanDetails);
            }
          } catch (err) {
            console.warn("[HYDRATION_PARSE_FAIL] Corrupted loan_details string:", rawLoanDetails);
            rawLoanDetails = undefined;
          }
        }

        return {
          ...e,
          loanDetails: rawLoanDetails ? {
            principal: Number(rawLoanDetails.principal || 0),
            annualInterestRate: Number(rawLoanDetails.interestRateAnnual || rawLoanDetails.annualInterestRate || 0),
            totalMonths: Number(rawLoanDetails.tenureMonths || rawLoanDetails.totalMonths || 0),
            startDate: rawLoanDetails.startDate || rawLoanDetails.start_date,
            loanType: rawLoanDetails.loanType || rawLoanDetails.loanName || 'Personal Loan',
            interestCalculationType: rawLoanDetails.interestType || rawLoanDetails.interestCalculationType || 'REDUCING',
            bank_app_name: rawLoanDetails.bankName || rawLoanDetails.bank_app_name || 'Unknown Entity',
            deduction_date: rawLoanDetails.emiDate || rawLoanDetails.deduction_date || e.emi_day || '5'
          } : {
            principal: Number(e.amount || 0),
            annualInterestRate: 0,
            totalMonths: 1,
            startDate: e.created_at,
            loanType: e.name || 'Personal Loan',
            interestCalculationType: 'REDUCING',
            bank_app_name: 'Unknown Entity',
            deduction_date: e.emi_day || '5'
          }
        };
      });
    },
    enabled: !!user,
  });

  const { data: subscriptionList = [] } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchLocalOrCloud('subscriptions', user.id);
      } catch (err) {
        console.warn("Subscriptions table not found or inaccessible:", err);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const salaryTransaction = useMemo(() => {
    const salaryAmount = getSalaryAmount(salaryData as SalaryRecord | undefined);
    if (!salaryAmount) return null;

    return toDashboardTransaction(
      toUnifiedSalaryEntry(
        salaryAmount,
        (salaryData as SalaryRecord | undefined)?.created_at ?? `${currentMonthYear}-01T00:00:00.000Z`,
      ),
    );
  }, [currentMonthYear, salaryData]);

  // 🛡️ [STRESS_DATA_MEMO]
  // Injected data is merged ONLY at the derived memo layer.
  // Never persists to database.
  const allUnifiedTransactions = useMemo(() => {
    const entriesToMerge: UnifiedLedgerEntry[] = [...ledgerTransactions];
    
    if (salaryTransaction) {
      const salaryAmount = getSalaryAmount(salaryData as SalaryRecord | undefined);
      const salaryDate = (salaryData as SalaryRecord | undefined)?.created_at ?? `${currentMonthYear}-01T00:00:00.000Z`;
      entriesToMerge.push(toUnifiedSalaryEntry(salaryAmount, salaryDate));
    }

    const merged = mergeUnifiedLedgerEntries(entriesToMerge).map(toDashboardTransaction);
    
    // 🛡️ [SECURITY_GATE] Strictly Dev-Only Injection
    if (import.meta.env.DEV && manualInjections.length > 0) {
      console.log(`🧪 [FORENSIC_STRESS] Merging ${manualInjections.length} mock records into unified state.`);
      return [...merged, ...manualInjections].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    
    return merged;
  }, [ledgerTransactions, salaryTransaction, salaryData, currentMonthYear, isAndroid, manualInjections]);

  const currentMonthExpenses = useMemo(() => {
    const transactions = allUnifiedTransactions || [];
    return transactions.filter(tx => {
      if (!tx?.date || !isValidDate(tx.date)) return false;
      return tx.type !== 'income' && isCurrentMonth(tx.date);
    });
  }, [allUnifiedTransactions]);

  const lastMonthExpenses = useMemo(() => {
    const transactions = allUnifiedTransactions || [];
    return transactions.filter(tx => {
      if (!tx?.date || !isValidDate(tx.date)) return false;
      return tx.type !== 'income' && isLastMonth(tx.date, now);
    });
  }, [allUnifiedTransactions, now]);

  const filteredViewData = useMemo(() => {
    const transactions = allUnifiedTransactions || [];
    
    const filtered = transactions.filter((e) => {
      if (!e?.date || !isValidDate(e.date)) return false;
      const d = safeDate(e.date);
      if (!d) return false;

      if (dateFilter.preset === 'today') return isToday(d);
      if (dateFilter.preset === 'this_week') return isThisWeek(d, { weekStartsOn: 1 });
      if (dateFilter.preset === 'this_month') return isCurrentMonth(e.date);
      if (dateFilter.preset === 'last_month') return isLastMonth(e.date, now);

      if (dateFilter.preset === 'custom') {
        if (dateFilter.customFrom) {
          const rangeStart = toLocalStart(dateFilter.customFrom);
          if (d < rangeStart) return false;
        }
        if (dateFilter.customTo) {
          const rangeEnd = toLocalEnd(dateFilter.customTo);
          if (d > rangeEnd) return false;
        }
        return true;
      }

      return isCurrentMonth(e.date);
    });

    return filtered;
  }, [allUnifiedTransactions, dateFilter, now]);

  return {
    salaryData,
    budgetData,
    ledgerTransactions,
    emiList,
    subscriptionList,
    isLoadingNativeTransactions,
    loadingExpenses,
    loadNativeTransactions,
    allUnifiedTransactions: allUnifiedTransactions,
    currentMonthExpenses,
    lastMonthExpenses,
    filteredViewData
  };
};