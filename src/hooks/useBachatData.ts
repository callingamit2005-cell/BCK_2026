import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { fetchUnifiedLedger, getLedgerWindow } from '@/features/transactions/ledger';
import { getAggregateStats } from '@/integrations/sqlite';

/**
 * useBachatData - Unified Local + Cloud Data Engine
 * Fetches balance, monthly expenses, and last 10 transactions.
 * PRIORITIZES local SQLite on Android for instant SMS visibility.
 * OPTIMIZED: Uses SQLite Aggregate Engine to avoid O(N) memory pressure.
 */
export const useBachatData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    totalBalance: number;
    monthlyExpenses: number;
    transactions: any[];
  }>({
    totalBalance: 0,
    monthlyExpenses: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      const isAndroid = Capacitor.getPlatform() === 'android';
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // 🛡️ [UNIFIED_AGGREGATE_STRATEGY]
      if (isAndroid) {
        // 🚀 [SQLITE_AGGREGATE_ENGINE]
        // Fetch only the aggregate totals from SQLite (O(log N))
        // instead of loading the full transaction array (O(N)).
        const stats = await getAggregateStats(user.id, monthYear);
        
        // Load only the top 10 recent transactions for the list
        const window = getLedgerWindow(user.created_at, now);
        const recentUnified = await fetchUnifiedLedger(user.id, window, 10);

        setData({
          totalBalance: 0 - (stats.total_spent || 0),
          monthlyExpenses: stats.monthly_spent || 0,
          transactions: recentUnified.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            category: tx.category,
            name: tx.payee,
            created_at: tx.date,
            type: tx.type
          })),
        });
      } else {
        // Web Fallback: Use existing RPC logic
        const { data: statsData, error: statsError } = await supabase.rpc('get_bachat_data_stats', {
          p_user_id: user.id,
          p_month: currentMonth,
          p_year: currentYear
        });

        if (statsError) throw statsError;

        const totalSpent = Number(statsData?.[0]?.total_spent || 0);
        const monthlySpent = Number(statsData?.[0]?.monthly_spent || 0);

        const { data: recentTransactions, error: transError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transError) throw transError;

        setData({
          totalBalance: 0 - totalSpent,
          monthlyExpenses: monthlySpent,
          transactions: recentTransactions || [],
        });
      }
    } catch (error) {
      console.error('Error fetching BachatData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 🛡️ [SYNC_TRIGGERED_REFRESH]
    // Listen for sync events to refresh dashboard cards instantly after SMS ingestion
    const handleSyncUpdate = () => {
      console.log('🔄 [useBachatData] Sync update detected, refreshing totals.');
      fetchData();
    };

    window.addEventListener('sync_queue_updated', handleSyncUpdate);

    // PERIODIC POLLING
    const interval = setInterval(fetchData, 30000);

    return () => {
      window.removeEventListener('sync_queue_updated', handleSyncUpdate);
      clearInterval(interval);
    };
  }, [user?.id]);

  return { ...data, loading };
};
