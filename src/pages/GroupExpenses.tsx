/**
 * 🔒 CRITICAL MODULE — LOCKED
 *
 * This file controls:
 * - Group creation
 * - Dropdown population
 * - Supabase RLS data flow
 *
 * ⚠️ DO NOT MODIFY WITHOUT FULL SYSTEM UNDERSTANDING
 *
 * Breaking this will cause:
 * - Groups not visible
 * - Dropdown failure
 * - Data inconsistency
 *
 * PRODUCTION-LOCKED FINANCIAL ENGINE
 *
 * WARNING:
 * This system uses member_id-based identity architecture.
 *
 * Ghost members intentionally have:
 * user_id = null
 *
 * DO NOT migrate back to user_id logic.
 *
 * Any modification requires:
 * - forensic validation
 * - settlement verification
 * - regression testing
 */

/**
 * GroupExpenses.tsx - BachatKaro Enterprise Edition
 * UI: Ultra-Clean High Contrast Mode with Signature Purple/Pink Gradients.
 * 🚀 ROCKET FIX: Zero-Delay Instant Auto-Save. Bypasses React state lags.
 * 🛡️ LOGIC LOCK: Native + Web Compatible, DB Constraints Safe.
 * 🔒 LOOP KILLER: lastProcessedText memory lock implemented.
 * 🗑️ BULK DELETE: Added Non-Blocking Dialog for 0ms INP delay.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useI18nNamespaces } from "@/hooks/useI18nNamespaces";
import { cn } from "@/lib/utils";

/* ✅ UI COMPONENTS */
import BillRoulette from "@/components/groups/BillRoulette";
import TripAdvisor from "@/components/groups/TripAdvisor";
import SettlementSummary from "@/features/split-expense/SettlementSummary";
import ExportMenu from "@/components/dashboard/ExportMenu";
import GroupHeaderSection from "@/components/group-expenses/GroupHeaderSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Trash2, ArrowRight, Clock, Users, Map, Mic, MicOff, Share2, 
  LayoutGrid, ReceiptIndianRupee, AlertTriangle, Loader2, WifiOff, Sparkles, Pencil, CheckCircle2 
} from "lucide-react";

/* ✅ UTILS & LOGIC */
import { Capacitor } from "@capacitor/core";
import { calculateSplit } from "@/features/split-expense/utils/splitCalculator";
import { computeBalances, simplifyDebts } from "@/features/split-expense/utils/simplifyDebts";
import type { SplitType } from "@/features/split-expense/types";
import { isGroupAdmin } from "@/security/roles";
import AppHeader from "@/components/layout/AppHeader";
import { formatRupees, convertToPaisa, formatCurrency } from "@/utils/currencyFormatter";
import { deleteGroupExpense, clearGroupLedger, updateGroupExpenseTitle } from "@/services/groupLedgerService";
import { fetchLocalOrCloud, saveAndSync, seedLocalCacheRow } from "@/integrations/sqliteService";
import { getDB, initSQLite } from "@/integrations/sqlite";
import { getLocalActiveGroup, hydrateLocalActiveGroupFromCloud, scheduleActiveGroupSync, setLocalActiveGroup } from "@/services/activeGroupState";
import { syncEngine } from "@/services/sqliteSyncEngine";

/* ✅ VOICE HOOKS */
import { useDashboardAIVoice } from "@/voice/integrations/useDashboardAIVoice";
import { useSmartParser } from "@/voice/core/useSmartParser";

const readJsonString = (value: unknown, key: string) => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : null;
};

const createLocalUuid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16 >> Number(c) / 4)).toString(16),
  );
};

const isNetworkUnavailable = (isOffline: boolean) =>
  typeof navigator !== "undefined" && (!navigator.onLine || isOffline);

// 🛡️ [RUNTIME_STABILIZATION] Memoized Row for Ledger Performance
const MemoizedExpenseRow = React.memo(({ exp, isAdmin, currentUserId, members, t, formatCurrency, onEdit, onDelete }: any) => {
  if (import.meta.env.DEV) {
    console.log(`[FORENSIC_GROUP_LEDGER] ID: ${exp.id}, Amount: ${exp.amount}`);
  }
  console.log("[LEDGER_RERENDER_REASON] Item ID:", exp.id);
  const payerName = members.find((m: any) => m.id === exp.paid_by_member_id)?.name || exp.paid_by;

  return (
    <div key={exp.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:border-purple-200 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <ReceiptIndianRupee className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{exp.title}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t("paid_by")} {payerName} • {new Date(exp.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-black text-slate-900 text-lg font-mono">{formatCurrency(Number(exp.amount))}</span>
        {(isAdmin || exp.user_id === currentUserId) && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(exp)} className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(exp.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>
    </div>
  );
});

const GroupExpenses = () => {
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useI18nNamespaces(["group-expenses", "split", "common", "dashboard"]);

  // 🔒 Memory locks to prevent duplicate voice processing
  const lastProcessedText = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);

  // 🔒 [INITIALIZATION_SEQUENCE]
  // 🛡️ CRITICAL: All data-fetching hooks MUST initialize BEFORE consumer effects.
  // Violating this order causes Temporal Dead Zone (TDZ) ReferenceErrors.
  
  // 1. Group Identity & Persistence Configuration
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const STORAGE_KEY = `bachatkaro_last_group_${user?.id}`;
  const GROUPS_QUERY_KEY = user?.id ? ["groups", user.id] : ["groups"];
  const isAndroid = Capacitor.getPlatform() === "android";
  const [isSQLiteReady, setIsSQLiteReady] = useState(() => !isAndroid || !!getDB());

  useEffect(() => {
    if (!isAndroid) return;

    let mounted = true;
    const db = getDB();
    if (db) {
      syncEngine.start();
      if (!isSQLiteReady) setIsSQLiteReady(true);
      return;
    }

    (async () => {
      try {
        const initializedDb = await initSQLite();
        if (initializedDb) syncEngine.start();
      } catch (err) {
        console.warn("[SQLITE_INIT_GROUP_EXPENSES_FAIL]", err);
      } finally {
        if (mounted) setIsSQLiteReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAndroid, isSQLiteReady]);

  const fetchGroupsSafe = async ({ queryKey }: any) => {
    const [_key, userId] = queryKey;
    if (isAndroid) console.log(`🔍 [DIAGNOSTIC] fetchGroupsSafe Start - UserID: ${userId}`);
    
    // ✅ Regression fix: groups dropdown must show ALL groups the user belongs to (not just owned groups).
    const db = getDB();
    if (db && userId) {
      try {
        if (isAndroid) console.log(`🔍 [DIAGNOSTIC] Querying SQLite for groups...`);
        const res = await db.query(
          `
            SELECT g.*
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = ? AND g.is_deleted = 0 AND gm.is_deleted = 0
            ORDER BY g.created_at DESC
            LIMIT 500
          `,
          [userId],
        );
        const rows = res.values || [];
        if (rows.length > 0) {
          if (isAndroid) console.log(`📊 [DIAGNOSTIC] SQLite groups SUCCESS - Found ${rows.length} groups`);
          return rows;
        }
        if (isAndroid) console.log("💡 [DIAGNOSTIC] SQLite groups EMPTY - Falling back to Cloud");
      } catch (e) {
        if (isAndroid) console.warn("⚠️ [DIAGNOSTIC] SQLite groups FAILED - Error:", e);
      }
    }

    if (isAndroid) console.log(`🌐 [DIAGNOSTIC] Fetching Cloud groups for UserID: ${userId}`);
    // Cloud Fetch - Get membership + group data
    const { data, error } = await supabase
      .from("group_members")
      .select("*, groups(*)")
      .eq("user_id", userId);
    
    if (error) {
      if (isAndroid) console.error("❌ [DIAGNOSTIC] Cloud groups FAILED - Error:", error);
      throw error;
    }

    const cloudGroups = (data || []).map((x: any) => x.groups).filter(Boolean);
    if (isAndroid) console.log(`✅ [DIAGNOSTIC] Cloud groups SUCCESS - Found ${cloudGroups.length} groups`);

    // 🚀 [BOOTSTRAP_SEEDING] Hydrate SQLite in background for offline-first continuity
    if (db && data && data.length > 0 && userId) {
      (async () => {
        console.log(`🌱 [GROUP_SEED_START] Seeding ${data.length} memberships and groups`);
        try {
          for (const item of data) {
            const group = item.groups;
            if (group) {
              await seedLocalCacheRow("groups", { ...group, sync_status: "completed", is_deleted: 0 });
            }

            const memberData: any = { ...item, sync_status: 'completed' };
            delete memberData.groups; 
            await seedLocalCacheRow("group_members", { ...memberData, is_deleted: 0 });
          }
          console.log(`✅ [GROUP_SEED_COMPLETE] Local cache hydrated`);
        } catch (seedErr) {
          console.error("❌ [GROUP_SEED_FAIL]", seedErr);
        }
      })();
    }

    return cloudGroups;
  };

  // 2. Primary Group Query
  useEffect(() => {
    if (isAndroid) {
      console.log(`🔍 [DIAGNOSTIC] Group Query State:`, { 
        isAuthReady, 
        hasUser: !!user?.id, 
        isSQLiteReady,
        selectedGroupId: !!selectedGroupId
      });
    }
  }, [isAuthReady, user?.id, isSQLiteReady, selectedGroupId, isAndroid]);

  const { data: groups = [], refetch: refetchGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    enabled: isAuthReady && !!user?.id && isSQLiteReady,
    queryFn: fetchGroupsSafe,
  });

  // 🛡️ [OFFLINE_SYNC_LISTENER]
  // Ensures UI stays in sync with local SQLite mutations even when disconnected.
  useEffect(() => {
    const handleSyncUpdate = () => {
      console.log("🔄 [OFFLINE_SYNC_EVENT] Invalidating ledger queries...");
      queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    };

    window.addEventListener('sync_queue_updated', handleSyncUpdate);
    return () => window.removeEventListener('sync_queue_updated', handleSyncUpdate);
  }, [queryClient, selectedGroupId, GROUPS_QUERY_KEY]);

  // 🛡️ REALTIME LISTENER: Invalidates cache on remote, backend-triggered changes.
  useEffect(() => {
    // 1. Do not subscribe if no group is selected.
    if (!selectedGroupId) return;

    // 2. Create a channel specific to the selected group.
    const channel = supabase
      .channel(`group-expenses-listener:${selectedGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_expenses',
          filter: `group_id=eq.${selectedGroupId}`,
        },
        (payload) => {
          console.log('✅ [REALTIME_INSERT] New group expense detected, invalidating cache.', payload.new);
          // 3. Invalidate queries to trigger a refetch and update the UI.
          queryClient.invalidateQueries({ queryKey: ['group-expenses', selectedGroupId] });
          queryClient.invalidateQueries({ queryKey: ['expense-splits', selectedGroupId] });
        }
      )
      .subscribe((status, err) => {
        // Optional: Log subscription status for diagnostics.
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [REALTIME] Subscribed to group: ${selectedGroupId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [REALTIME_ERROR] Subscription failed for group: ${selectedGroupId}`, err);
        }
      });

    // 4. Cleanup function to remove the channel when the component unmounts or the group changes.
    return () => {
      console.log(`🔌 [REALTIME_UNSUB] Unsubscribing from group: ${selectedGroupId}`);
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId, queryClient]);

  // 🛡️ SAFE FALLBACK: Mandatory normalization to prevent .length / .some crashes
  const safeGroups = groups ?? [];

  // 3. Group Hydration & Persistence Flow
  // ℹ️ Sequence-sensitive: Must run after groups query is declared.
  useEffect(() => {
    if (!user?.id || isLoadingGroups || safeGroups.length === 0) return;

    if (!selectedGroupId) {
      const persistedId = localStorage.getItem(STORAGE_KEY);
      const isValid = safeGroups.some(g => g.id === persistedId);
      
      if (persistedId && isValid) {
        console.log("🛡️ [HYDRATION] Restoring persisted group selection:", persistedId);
        setSelectedGroupId(persistedId);
      } else {
        console.log("🛡️ [HYDRATION] Defaulting to newest group:", safeGroups[0].id);
        setSelectedGroupId(safeGroups[0].id);
      }
    } else {
        // DEV-ONLY: Detect deleted-group hydration attempts
        const isStillValid = safeGroups.some(g => g.id === selectedGroupId);
        if (!isStillValid && !isLoadingGroups) {
            console.warn("🚨 [HYDRATION_GUARD] Current selectedGroupId is no longer in groups list. Clearing state.");
            setSelectedGroupId("");
        }
    }
  }, [safeGroups, isLoadingGroups, user?.id, selectedGroupId]);

  // PHASE 1: Hybrid Active Group Model (Audit-safe)
  // - Local primary: SQLite app_settings (Android) + localStorage (web)
  // - Cloud secondary: user_preferences.active_group_id (restore continuity)
  // This effect is non-blocking and never blocks UI.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    (async () => {
      try {
        const state = await hydrateLocalActiveGroupFromCloud(user.id);
        if (cancelled) return;
        if (state.groupId && state.groupId !== selectedGroupId) {
          setSelectedGroupId(state.groupId);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Save manual selection to localStorage
  useEffect(() => {
    if (selectedGroupId && user?.id) {
      localStorage.setItem(STORAGE_KEY, selectedGroupId);
    }
  }, [selectedGroupId, user?.id, STORAGE_KEY]);

  // PHASE 1: Commit active group switch instantly locally + background cloud persist.
  useEffect(() => {
    if (!user?.id) return;
    if (!selectedGroupId) return;
    void setLocalActiveGroup(user.id, selectedGroupId).catch(() => undefined);
    scheduleActiveGroupSync(user.id);
  }, [selectedGroupId, user?.id]);

  // 4. Group-Dependent Queries (Members, Expenses, Splits)
  // ℹ️ These depend on selectedGroupId being correctly hydrated.
  const { data: members = [], refetch: refetchMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["group-members", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId && isSQLiteReady,
    queryFn: async () => {
      // 🛡️ OFFLINE-FIRST: Route through universal SDK
      // Pass true to includeDeleted to allow rendering of historical (archived) actors.
      // 🚀 BUG_FIX: Set forceCloud=true for members to ensure join-discovery on Android, 
      // but ONLY when online to prevent offline hydration failure.
      return await fetchLocalOrCloud("group_members", selectedGroupId, "", "name ASC", "group_id", true, isAndroid && navigator.onLine);
    },
  });

  const activeMembers = useMemo(() => members.filter((m: any) => !m.is_deleted), [members]);
  const isAdmin = useMemo(() => isGroupAdmin(activeMembers, user?.id), [activeMembers, user]);

  const { data: expenses = [], refetch: refetchExpenses, error: expensesError, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["group-expenses", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId,
    queryFn: async () => {
      // 🛡️ OFFLINE-FIRST: Route through universal SDK
      return await fetchLocalOrCloud("group_expenses", selectedGroupId, "", "created_at DESC", "group_id");
    },
  });

  const { data: splits = [], refetch: refetchSplits, isLoading: isLoadingSplits } = useQuery({
    queryKey: ["expense-splits", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId,
    queryFn: async () => {
      // 🛡️ OFFLINE-FIRST: Route through universal SDK
      return await fetchLocalOrCloud("expense_splits", selectedGroupId, "", "created_at ASC", "group_id");
    },
  });

  // 🛡️ [PHASE_0C] HYDRATION BARRIER SYSTEM
  // Coordination of asynchronous datasets to prevent premature math execution.
  const isHydrating = isLoadingMembers || isLoadingExpenses || isLoadingSplits;

  useEffect(() => {
    if (import.meta.env.DEV && isHydrating) {
      console.log("[HYDRATION_BARRIER_ACTIVE]", {
        members: !isLoadingMembers,
        expenses: !isLoadingExpenses,
        splits: !isLoadingSplits
      });
    }
  }, [isLoadingMembers, isLoadingExpenses, isLoadingSplits, isHydrating]);

  const safeExpenses = expenses ?? [];
  const safeSplits = splits ?? [];

  // 💎 30-Day Premium Logic
  const { isVoicePremiumActive, premiumDaysLeft } = useMemo(() => {
    if (!user || !user.created_at) return { isVoicePremiumActive: false, premiumDaysLeft: 0 }; 
    const createdDate = new Date(user.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const daysLeft = Math.max(0, 30 - diffDays); 
    return {
      isVoicePremiumActive: diffDays <= 30,
      premiumDaysLeft: daysLeft
    };
  }, [user]);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidByMemberId, setExpensePaidByMemberId] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  
  const [editDialogExp, setEditDialogExp] = useState<any>(null);
  const [editTempTitle, setEditTempTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [tripAdvisorOpen, setTripAdvisorOpen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [isParsing, setIsParsing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (safeExpenses || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [safeExpenses, currentPage]);

  const totalPages = Math.ceil((safeExpenses || []).length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [safeExpenses, currentPage, totalPages]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (isAndroid) {
        void syncEngine.processQueue().finally(() => {
          queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
          if (selectedGroupId) {
            queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
          }
        });
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [GROUPS_QUERY_KEY, isAndroid, queryClient, selectedGroupId]);

  const [showClearLedgerConfirm, setShowClearLedgerConfirm] = useState(false);
  const processExpenseRef = useRef<any>(null);

  // 🛡️ [ARCHITECTURAL_GUARD] Identity Logic Safety
  // This function enforces strict UUID validation to prevent state corruption.
  const safeSetPayerId = useCallback((val: string, source: string) => {
    if (val && !val.match(/^[0-9a-fA-F-]{36}$/)) {
      console.error(`🚨 [StateCorruption] Blocked ${source} from setting non-UUID:`, val);
      return;
    }
    console.log(`SET_PAYER_CALL (${source}):`, val);
    setExpensePaidByMemberId(val);
  }, []);

  const handlePayerChange = (val: string) => safeSetPayerId(val, 'ManualSelect');

  // 🛡️ [HYDRATION_SEQUENCE] Payer Auto-selection
  // ℹ️ Must run after members query is declared and group is hydrated.
  useEffect(() => {
    if (!user?.id || members.length === 0 || !selectedGroupId) return;
    
    // Only auto-select if no payer is currently selected (initial load or group switch)
    if (!expensePaidByMemberId) {
      const currentUserMember = members.find(m => m.user_id === user.id);
      if (currentUserMember) {
        console.log("🛡️ [HYDRATION] Auto-selecting current user as payer:", currentUserMember.name);
        safeSetPayerId(currentUserMember.id, 'AutoHydration');
      } else {
          // DEV-ONLY: Warn if user is not a member of the selected group
          console.warn("⚠️ [HYDRATION_WARNING] Logged-in user is not a member of the selected group. Manual selection required.");
      }
    }
  }, [user?.id, members, selectedGroupId, expensePaidByMemberId, safeSetPayerId]);

  const handleSettleDebt = async (fromName: string, toName: string, amount: number, idempotencyKey?: string) => {
    if (!user?.id || !selectedGroupId) return;

    // 🛡️ [PHASE_2_PAYMENT_HARDENING]
    // Manual settlements (no key) require Admin role. 
    // Verified payments (with key) are safe for any member to record as they are backed by the PaymentOrchestrator.
    if (!isAdmin && !idempotencyKey) {
      console.warn("[SETTLEMENT_BLOCKED] Manual settlement requires Admin role.");
      toast({ 
        title: t("permission_denied", "Permission Denied"), 
        description: t("only_admins_settle", "Only group admins can manually mark debts as settled."), 
        variant: "destructive" 
      });
      return;
    }

    const fromMember = members.find(m => m.name === fromName);
    const toMember = members.find(m => m.name === toName);

    if (!fromMember || !toMember) {
      toast({ title: "Settlement Error", description: "Members not found", variant: "destructive" });
      return;
    }

    setIsAutoSaving(true);
    try {
      console.log("[SETTLEMENT_DUPLICATE_BLOCK] Attempting ledger update with key:", idempotencyKey);

      // 🛡️ [MONETARY_INTEGRITY] Normalize settlement to Paisa (Integer)
      const amountPaisa = convertToPaisa(amount);

      const rpcPayload = {
        p_group_id: selectedGroupId,
        p_user_id: user.id,
        p_title: `Settlement: ${fromName} -> ${toName}`,
        p_amount: amountPaisa,
        p_paid_by_member_id: fromMember.id,
        p_split_type: 'unequal',
        p_splits: [{
          member_id: toMember.id,
          user_id: toMember.user_id || null,
          share_amount: amountPaisa
        }],
        p_idempotency_key: idempotencyKey || null
      };

      const isAndroid = Capacitor.getPlatform() === 'android';
      const expenseId = self.crypto.randomUUID();
      const finalIdempotencyKey = idempotencyKey || `idemp_${expenseId}`;

      const finalRpcPayload = { 
        ...rpcPayload, 
        p_id: expenseId,
        p_idempotency_key: finalIdempotencyKey 
      };

      if (isAndroid) {
        const db = getDB();
        if (db) {
          console.log("📱 [SETTLEMENT_SQLITE_OPTIMISTIC] Injecting settlement into local ledger");
          await db.run(`
            INSERT INTO group_expenses (id, group_id, title, category, amount, paid_by, paid_by_member_id, user_id, split_type, idempotency_key, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            expenseId, selectedGroupId, rpcPayload.p_title, "Others", 
            amountPaisa, fromMember.id, fromMember.id, user.id, 'unequal', finalIdempotencyKey, 'pending'
          ]);

          for (const s of rpcPayload.p_splits) {
            const splitId = `spl_${Math.random().toString(36).substring(2, 9)}`;
            await db.run(`
              INSERT INTO expense_splits (id, expense_id, group_id, member_id, user_id, share_amount, sync_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [splitId, expenseId, selectedGroupId, s.member_id, s.user_id, s.share_amount, 'pending']);
          }
        }
      }

      await saveAndSync("insert_group_expense_with_split", finalRpcPayload, "RPC");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] }),
        refetchExpenses(),
        refetchSplits()
      ]);
      toast({ title: t("settlement_success", "Settlement Recorded! ✅"), className: "bg-emerald-600 text-white" });
    } catch (e: any) {
      toast({ title: "Settlement Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAutoSaving(false);
    }
  };

  const gradientClass = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF] text-white shadow-lg border-none";
  const cardStyle = "bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden";
  const inputClass = "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#EC4899] focus:ring-[#EC4899]/20";

  const speechLang = useMemo(() => {
    const langMap: Record<string, string> = {
      'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'mr': 'mr-IN', 
      'bn': 'bn-IN', 'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 
      'pa': 'pa-IN', 'sa': 'sa-IN', 'bho': 'bho-IN', 'mai': 'mai-IN', 
      'awa': 'awa-IN', 'hinglish': 'en-IN', 'en': 'en-IN'
    };
    return langMap[language] || 'en-IN';
  }, [language]);

  const { parseWithAI } = useSmartParser();
  const voice = useDashboardAIVoice({ language: speechLang, silenceTimeout: 1500 });
  
  const { totalExpense, perPerson } = useMemo(() => {
    const total = safeExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = members.length > 0 ? members.length : 1;
    return { totalExpense: total, perPerson: total / count };
  }, [safeExpenses, members]);

  const { debts, memberBalances } = useMemo(() => {
    let balances: any[] = [];
    let debtsList: any[] = [];
    
    // 🛡️ [PHASE_0C] HYDRATION BARRIER
    // Prevent premature financial computation while datasets are in flight.
    if (isHydrating) {
        if (import.meta.env.DEV) console.log("[HYDRATION_STALL] Skipping balance engine while data hydrates...");
        return { debts: [], memberBalances: [] };
    }

    // 🕵️ [PIPELINE_TRACE] Deep validation of input data lengths for forensic analysis
    if (import.meta.env.DEV) {
        console.log("🕵️ [PIPELINE_TRACE] Group Ledger Input Counts:", {
            expenses: safeExpenses.length,
            splits: safeSplits.length,
            members: members.length,
            isLoadingExpenses,
            isAuthReady,
            selectedGroupId: !!selectedGroupId
        });
    }
    
    // 🛡️ [RUNTIME_STABILIZATION] Detailed Recompute Logging
    console.log("[BALANCE_RECOMPUTE_REASON]", { 
      expensesChanged: safeExpenses.length, 
      splitsChanged: safeSplits.length, 
      membersChanged: members.length,
      timestamp: Date.now()
    });

    if (safeExpenses.length > 0 && safeSplits.length > 0 && members.length > 0) {
      const splitMap = safeSplits.reduce((acc: any, s: any) => {
        if (!acc[s.expense_id]) acc[s.expense_id] = [];
        acc[s.expense_id].push({ member_id: s.member_id, shareAmount: Number(s.share_amount) });
        return acc;
      }, {});
      
      const normalized = safeExpenses.map((exp: any) => ({ 
        paidByMemberId: exp.paid_by_member_id, 
        splits: splitMap[exp.id] || [] 
      })).filter((exp: any) => !!exp.paidByMemberId && exp.splits.length > 0);
      
      // FIX: Strictly follow member.id identity. No legacy user_id dependency.
      const normalizedMembers = members.map((m: any) => ({ id: m.id, name: m.name }));
      
      console.log("🧪 [BALANCE_ENGINE_INPUT]", { 
        normalizedExpenses: normalized, 
        normalizedMembers 
      });

      balances = computeBalances(normalized, normalizedMembers);
      
      const rawDebts = simplifyDebts(balances);
      
      // FIX: Map member.id directly to names for UI. No more user_id collisions.
      debtsList = rawDebts.map(d => {
        const fromMember = members.find(m => m.id === d.from);
        const toMember = members.find(m => m.id === d.to);
        
        // 🛡️ [AMOUNT_TRACE] 
        console.log("[AMOUNT_AFTER_NORMALIZATION] debt.amount:", d.amount, "from:", fromMember?.name, "to:", toMember?.name);
        
        return {
          from: d.from,
          to: d.to,
          fromName: fromMember?.name || "User",
          toName: toMember?.name || "User",
          amount: d.amount,
          upi_id: toMember?.upi_id || null
        };
      });

      console.log("🧪 [BALANCE_ENGINE_OUTPUT]", { balances, debtsList });
    } else {
      console.warn("⚠️ [BALANCE_ENGINE_SKIP] Missing required data for computation", {
        hasExpenses: expenses.length > 0,
        hasSplits: splits.length > 0,
        hasMembers: members.length > 0
      });
    }

    // 🛡️ [PHASE_2_LEDGER_EXPANSION] 
    // [FULL_LEDGER_MEMBER_PIPELINE]
    const safeBalances = Array.isArray(balances) ? balances : [];
    
    // [FULL_LEDGER_MAP_SOURCE] - Re-calculating stats for the Informational Ledger
    const statsMap: Record<string, { paid: number; owes: number }> = {};
    if (Array.isArray(members)) {
      members.forEach((m: any) => { 
        if (m?.id) statsMap[m.id] = { paid: 0, owes: 0 }; 
      });
    }

    if (Array.isArray(safeExpenses) && Array.isArray(safeSplits)) {
      safeExpenses.forEach((exp: any) => {
        const payerId = exp.paid_by_member_id;
        const splits = safeSplits.filter((s: any) => s.expense_id === exp.id);
        let total = 0;
        splits.forEach((s: any) => {
          const amt = Number(s.share_amount) || 0;
          total += amt;
          if (s.member_id && statsMap[s.member_id]) statsMap[s.member_id].owes += amt;
        });
        if (payerId && statsMap[payerId]) statsMap[payerId].paid += total;
      });
    }

    const mBalances = (Array.isArray(members) ? members : []).map((member: any) => {
      const bObj = safeBalances.find((b: any) => b.id === member?.id);
      const mStats = (member?.id && statsMap[member.id]) ? statsMap[member.id] : { paid: 0, owes: 0 };
      
      return { 
        id: member?.id || 'unknown',
        full_name: member?.name || 'Unknown', 
        balance: bObj ? bObj.balance : 0,
        total_paid: mStats.paid,
        total_owes: mStats.owes,
        user_id: member?.user_id || null,
        upi_id: member?.upi_id || null
      };
    });

    console.log("🧪 [FULL_LEDGER_RENDER_SAFE]", { memberCount: mBalances.length });
    console.log("🧪 [FINAL_DEBTS_LIST_RENDER]", debtsList);
    console.log("🧪 [FINAL_BALANCE_RENDER] (All Members)", mBalances);

    return { debts: debtsList, memberBalances: mBalances };
  }, [safeExpenses, safeSplits, members]);

  const isUUID = (str: string) => /^[0-9a-fA-F-]{36}$/.test(str);

  // 🚀 ZERO-DELAY DIRECT DATABASE HIT
  const processExpense = useCallback(async (amount: number, payerId: string, title: string, splitMethod: SplitType, customSplits: any, silent = false) => {
    if (isAutoSaving) return false;
    
    // 🔒 PHASE 1: HARD AUTH & STATE GUARD
    let { data: { session } } = await supabase.auth.getSession();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    // Prevent anonymous inserts during hydration race
    if (authError || !authUser || !session?.access_token) {
      console.warn("⚠️ [AUTH_SYNC] Session stale or missing. Forcing refresh...");
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data.session;
      // authUser is updated via session.user if needed, but let's keep it simple for now
    }

    if (!session || !session.access_token || !authUser || authUser.role !== 'authenticated' || !user?.id || !selectedGroupId || !payerId) {
      console.error("🚨 [AUTH_RACE_FAILURE] Blocked insert due to missing required state or session:", {
        stateUserId: user?.id,
        authUserId: authUser?.id,
        role: authUser?.role,
        hasToken: !!session?.access_token,
        selectedGroupId,
        payerId
      });
      toast({ 
        title: "Session Error", 
        description: "Your authentication session is not ready or has expired. Please sign in again.", 
        variant: "destructive" 
      });
      return false;
    }

    setIsAutoSaving(true);
    
    try {
      // 🛡️ CRITICAL UUID FORENSIC GUARD
      const invalidFields = [];
      if (!isUUID(selectedGroupId)) invalidFields.push(`group_id (${selectedGroupId})`);
      
      // PHASE 3: PAYLOAD VALIDATION
      if (!isUUID(payerId)) {
        console.error("[INVALID_PAYER_UUID] Non-UUID detected for payerId:", payerId);
        invalidFields.push(`payerId (${payerId})`);
      }
      
      if (user?.id && !isUUID(user.id)) invalidFields.push(`user_id (${user.id})`);

      if (invalidFields.length > 0) {
        console.error("🚨 [FORENSIC_FAILURE] Invalid UUIDs detected:", invalidFields);
        toast({ 
          title: "Data Integrity Error", 
          description: `Invalid identifiers: ${invalidFields.join(", ")}. Please refresh or re-select.`, 
          variant: "destructive" 
        });
        setIsAutoSaving(false);
        return false;
      }

      // 🛡️ [MONETARY_INTEGRITY] Normalize all inputs to Paisa (Integer) at the boundary.
      const amountPaisa = convertToPaisa(amount);
      const customSplitsPaisa: Record<string, number> = {};
      if (splitMethod === 'unequal') {
        Object.entries(customSplits).forEach(([mid, val]) => {
          customSplitsPaisa[mid] = convertToPaisa(val);
        });
      }

      const splitResults = calculateSplit({ 
        amountPaisa: amountPaisa, 
        splitType: splitMethod, 
        members: activeMembers.map((m: any) => ({ memberId: m.id, name: m.name })), 
        customValues: splitMethod === 'unequal' ? customSplitsPaisa : undefined 
      });

      console.log("📡 [SPLIT_RESULTS_DEBUG]", splitResults);

      const rpcPayload = {
        p_group_id: selectedGroupId,
        p_user_id: user.id,
        p_title: title || "Voice Entry",
        p_amount: amountPaisa,
        p_paid_by_member_id: payerId,
        p_split_type: splitMethod,
        p_splits: splitResults.map(sr => {
          // Logic Lock: sr.memberId IS member.id because we mapped it above.
          const member = activeMembers.find((m: any) => m.id === sr.memberId);
          return {
            user_id: member?.user_id ?? null,
            member_id: sr.memberId, // Direct propagation to ensure ghost identity
            share_amount: sr.shareAmount
          };
        }),
        p_idempotency_key: null
      };

      console.log("📡 [FINAL_P_SPLITS_DEBUG]", rpcPayload.p_splits);
      console.log("📡 [RPC_PAYLOAD_DEBUG]", rpcPayload);

      // 🛡️ OFFLINE-FIRST RE-ENGINEERING: 
      // Instead of direct RPC, we route through saveAndSync and manually update local state for 0ms INP.
      const isAndroid = Capacitor.getPlatform() === 'android';
      const expenseId = self.crypto.randomUUID();
      const idempotencyKey = `idemp_${expenseId}`;

      // 1. Update RPC Payload with deterministic keys
      const finalRpcPayload = {
        ...rpcPayload,
        p_id: expenseId,
        p_idempotency_key: idempotencyKey
      };

      if (isAndroid) {
        const db = getDB();
        if (db) {
          console.log("📱 [SQLITE_LOCAL_OPTIMISTIC_UPDATE] Injecting expense into local ledger");
          
          // 1.1 Insert Expense Record
          await db.run(`
            INSERT INTO group_expenses (id, group_id, title, category, amount, paid_by, paid_by_member_id, user_id, split_type, idempotency_key, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            expenseId, selectedGroupId, finalRpcPayload.p_title, "Others", 
            amountPaisa, payerId, payerId, user.id, splitMethod, idempotencyKey, 'pending'
          ]);

          // 1.2 Insert Split Records
          for (const s of finalRpcPayload.p_splits) {
            const splitId = `spl_${Math.random().toString(36).substring(2, 9)}`;
            await db.run(`
              INSERT INTO expense_splits (id, expense_id, group_id, member_id, user_id, share_amount, sync_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [splitId, expenseId, selectedGroupId, s.member_id, s.user_id, s.share_amount, 'pending']);
          }
        }
      }

      // 2. Queue for Sync (Handles both Cloud and Offline-Queue)
      await saveAndSync("insert_group_expense_with_split", finalRpcPayload, "RPC");

      setExpenseTitle(""); setExpenseAmount(""); 
      safeSetPayerId("", "Reset");
      setSplitType("equal"); setCustomAmounts({});
      
      console.log("🚀 [OFFLINE_READY_SUCCESS] Triggering UI invalidation...");
      
      // 🛡️ RE-SYNC FLOW: Invalidate + Force Refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }), 
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] }),
        refetchExpenses(),
        refetchSplits()
      ]);
      
      if (!silent) toast({ title: t("bill_saved", "Bill Saved! 🚀"), className: "bg-emerald-600 text-white" });
      return true;
    } catch (e: any) { 
      toast({ title: "Error", description: e.message, variant: "destructive" }); 
      return false;
    } finally { 
      setIsAutoSaving(false); 
    }
  }, [selectedGroupId, activeMembers, user, queryClient, t, isAutoSaving, toast]);

  useEffect(() => {
    processExpenseRef.current = processExpense;
  }, [processExpense]);

  const addExpense = useCallback((silent = false) => {
    const amt = Number(expenseAmount);
    console.log("DEBUG_ADD_EXPENSE", { amt, expensePaidByMemberId, expenseTitle, splitType });
    
    if (!user?.id || !selectedGroupId) {
      toast({ title: "System Not Ready", description: "Waiting for group or auth data...", variant: "destructive" });
      return;
    }

    if (!amt || !expensePaidByMemberId) {
        toast({ title: "Missing Info", description: "Please enter amount and select payer.", variant: "destructive" });
        return;
    }
    if (splitType === "unequal") {
        const sum = Object.values(customAmounts).reduce((acc, val) => acc + Number(val || 0), 0);
        if (sum !== amt) {
            toast({ title: "Mismatch!", description: `Sum must equal ${amt}`, variant: "destructive" });
            return;
        }
    }
    void processExpenseRef.current(amt, expensePaidByMemberId, expenseTitle, splitType, customAmounts, silent);
  }, [expenseAmount, expensePaidByMemberId, expenseTitle, splitType, customAmounts, user?.id, selectedGroupId, toast]);

  const handleVoiceStart = async () => {
    try {
      // Reset memory lock to allow processing of new voice input
      lastProcessedText.current = "";
      if (voice.listening) {
        voice.stop();
        setTimeout(() => voice.start(), 50);
        return;
      }
      voice.start();
    } catch {
      toast({ title: "Mic Error", variant: "destructive" });
    }
  };

  const membersRef = useRef(members);
  const parseWithAIRef = useRef(parseWithAI);
  const expensesRef = useRef(expenses);
  
  useEffect(() => { membersRef.current = members; }, [members]);
  useEffect(() => { parseWithAIRef.current = parseWithAI; }, [parseWithAI]);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    // 🛡️ [OFFLINE_DELETE_GUARD]
    // Prevent data inconsistency by blocking deletes in offline mode.
    if (!navigator.onLine || isOffline) {
      toast({ 
        title: t("offline_mode", "Offline Mode"), 
        description: t("connect_to_delete", "Connect to internet to delete expenses safely."),
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(t("delete_entry_confirm"))) return;

    const previousExpenses = queryClient.getQueryData(["group-expenses", selectedGroupId]);
    const previousSplits = queryClient.getQueryData(["expense-splits", selectedGroupId]);

    // Optimistically update cache
    queryClient.setQueryData(["group-expenses", selectedGroupId], (old: any) => 
      Array.isArray(old) ? old.filter((e: any) => e.id !== id) : []
    );
    queryClient.setQueryData(["expense-splits", selectedGroupId], (old: any) => 
      Array.isArray(old) ? old.filter((s: any) => s.expense_id !== id) : []
    );

    try {
      console.log(`🗑️ [LEDGER_DELETE_START] ID: ${id}`);
      await deleteGroupExpense(id, selectedGroupId!);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] })
      ]);
      toast({ title: t("deleted_entry", "Deleted! 🗑️"), className: "bg-rose-600 text-white" });
    } catch (err: any) {
      console.error("❌ [LEDGER_DELETE_FAIL]", err);
      queryClient.setQueryData(["group-expenses", selectedGroupId], previousExpenses);
      queryClient.setQueryData(["expense-splits", selectedGroupId], previousSplits);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedGroupId, queryClient, t, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchGroups(), refetchMembers(), refetchExpenses(), refetchSplits()]);
      toast({ title: "Updated! 🔄", description: "All data is now fresh." });
    } catch (error) {
      toast({ title: "Refresh Failed", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 🚀 FIXED: Non-blocking Optimistic bulk delete (No window.confirm)
  const handleBulkDelete = async () => {
    if (!selectedGroupId) return;

    // 🛡️ [OFFLINE_DELETE_GUARD]
    if (!navigator.onLine || isOffline) {
      setShowClearLedgerConfirm(false);
      toast({ 
        title: t("offline_mode", "Offline Mode"), 
        description: t("connect_to_delete", "Connect to internet to delete expenses safely."),
        variant: "destructive"
      });
      return;
    }
    
    // Dialog turant band karein (No freezing)
    setShowClearLedgerConfirm(false);

    // Store previous data for rollback
    const previousExpenses = queryClient.getQueryData(["group-expenses", selectedGroupId]);
    const previousSplits = queryClient.getQueryData(["expense-splits", selectedGroupId]);

    // Optimistically update cache to empty
    queryClient.setQueryData(["group-expenses", selectedGroupId], []);
    queryClient.setQueryData(["expense-splits", selectedGroupId], []);

    setIsBulkDeleting(true);
    try {
      console.log(`🗑️ [LEDGER_CLEAR_START] Group: ${selectedGroupId}`);
      await clearGroupLedger(selectedGroupId);
      
      // Invalidate to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] })
      ]);
      
      toast({ title: "Ledger Cleared! 🗑️", className: "bg-rose-600 text-white font-black" });
    } catch (error: any) {
      console.error("❌ [LEDGER_CLEAR_FAIL]", error);
      // Rollback on error
      queryClient.setQueryData(["group-expenses", selectedGroupId], previousExpenses);
      queryClient.setQueryData(["expense-splits", selectedGroupId], previousSplits);
      toast({ title: "Delete Failed", description: "Could not clear ledger", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // ⚡ SUPERCHARGED ROCKET PARSING
  useEffect(() => {
    const rawTranscript = voice.transcript || "";
    const transcript = rawTranscript.trim();
    
    // 🛡️ HARD LOOP BREAK: Block if already processing, empty, too short, or saving
    if (isProcessingRef.current || !transcript || transcript.length < 3 || isAutoSaving) return;
    
    // 🔒 Deduplication: Block redundant checks while listening, allow final AI pass when mic stops
    if (transcript === lastProcessedText.current && voice.listening) return;
    lastProcessedText.current = transcript;

    const timeoutId = setTimeout(async () => {
      // 🛡️ Concurrency & Stale Guard
      if (isProcessingRef.current || (transcript !== lastProcessedText.current && voice.listening)) return;

      isProcessingRef.current = true;
      setIsParsing(true);
      try {
        const lowerTranscript = transcript.toLowerCase();

        const isDeleteCommand = /^(delete|remove|hatao|cancel)\s+/i.test(lowerTranscript);
        const isEditCommand = /^(edit|update|change|modify)\s+/i.test(lowerTranscript);

        if (isDeleteCommand || isEditCommand) {
          if (!isVoicePremiumActive) {
            if (voice.listening) voice.stop();
            setShowPremiumModal(true);
            return;
          }

          const commandWord = lowerTranscript.split(/\s+/)[0]; 
          const targetName = lowerTranscript.replace(commandWord, "").trim();
          const targetExp = expensesRef.current.find((e: any) => e.title.toLowerCase().includes(targetName));

          if (targetExp) {
            if (voice.listening) voice.stop();
            if (isDeleteCommand) {
              await handleDeleteExpense(targetExp.id);
            } else if (isEditCommand) {
              setEditDialogExp(targetExp);
              setEditTempTitle(targetExp.title);
              toast({ title: t("opening_edit", "Opening Edit... ✏️"), className: "bg-purple-600 text-white" });
            }
          } else {
            toast({ title: t("not_found", "Not Found ❌"), description: `Could not find a bill named "${targetName}"` });
            if (voice.listening) voice.stop();
          }
          return; 
        }

        const amountMatch = transcript.match(/\b\d+(?:\.\d+)?\b/);
        const sortedMembers = [...membersRef.current].sort((a, b) => b.name.length - a.name.length);
        const foundMember = sortedMembers.find(m => lowerTranscript.includes(m.name.toLowerCase()));

        if (amountMatch && foundMember && voice.listening) {
          // 🚀 Rocket Match: Fast-track direct matches while mic is ON
          const matchedAmount = amountMatch[0];
          const matchedPayerId = foundMember.id;
          
          let cleanTitle = transcript.replace(matchedAmount, "").trim();
          const nameRegex = new RegExp(foundMember.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
          cleanTitle = cleanTitle.replace(nameRegex, "").trim();
          cleanTitle = cleanTitle.replace(/^(for|by|to|and|paid|rs|rupees?|₹)\s+/i, "").trim();
          cleanTitle = cleanTitle.replace(/\s+/g, " ").trim();

          const matchedTitle = cleanTitle.length > 1 ? cleanTitle : "Voice Entry";

          setExpenseAmount(matchedAmount);
          safeSetPayerId(matchedPayerId, "VoiceRocket");
          setExpenseTitle(matchedTitle);
          setSplitType("equal"); 

          voice.stop();
          await processExpenseRef.current(Number(matchedAmount), matchedPayerId, matchedTitle, "equal", {}, false);
        } 
        else if (!voice.listening) {
          // 🤖 AI Fallback: Heavy processing ONLY when mic is OFF
          const result = await parseWithAIRef.current(transcript);
          const data = result.success ? result.data : result.fallback;
          
          let aiMatchedId = "";
          if (data.paidBy) {
            const aiFound = membersRef.current.find((m: any) => m.name.toLowerCase().includes(data.paidBy!.toLowerCase()));
            if (aiFound) aiMatchedId = aiFound.id;
          }

          if (data.amount) setExpenseAmount(data.amount.toString());
          if (aiMatchedId) {
            safeSetPayerId(aiMatchedId, "AIFallback");
          }
          const newTitle = data.title?.trim() || "Voice Entry";
          setExpenseTitle(newTitle);

          if (data.split === "unequal") {
            setSplitType("unequal");
            toast({ title: "Unequal Split", description: "Please enter amounts manually." });
          } else {
            setSplitType("equal");
          }

          if (data.amount && aiMatchedId && data.split !== "unequal") {
            await processExpenseRef.current(Number(data.amount), aiMatchedId, newTitle, "equal", {}, false);
          }
        }
      } catch (err) {
        console.error("Voice parsing error:", err);
      } finally {
        setIsParsing(false);
        isProcessingRef.current = false;
      }
    }, 600); 

    return () => clearTimeout(timeoutId);
  }, [voice.transcript, voice.listening, isAutoSaving, isVoicePremiumActive, toast, t, safeSetPayerId, handleDeleteExpense, voice]);

  const handleUpdateExpenseTitle = async () => {
    if (!editDialogExp || !editTempTitle.trim()) return;
    
    const previousExpenses = queryClient.getQueryData(["group-expenses", selectedGroupId]);
    const newTitle = editTempTitle.trim();

    // Optimistic Update
    queryClient.setQueryData(["group-expenses", selectedGroupId], (old: any) => 
      Array.isArray(old) ? old.map((e: any) => e.id === editDialogExp.id ? { ...e, title: newTitle } : e) : []
    );

    setIsUpdating(true);
    try {
      console.log(`✏️ [LEDGER_EDIT_START] ID: ${editDialogExp.id}`);
      await updateGroupExpenseTitle(editDialogExp.id, newTitle);
      
      await queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] });
      setEditDialogExp(null);
      toast({ title: t("updated", "Name Updated! ✏️"), className: "bg-emerald-600 text-white" });
    } catch(e: any) {
      console.error("❌ [LEDGER_EDIT_FAIL]", e);
      queryClient.setQueryData(["group-expenses", selectedGroupId], previousExpenses);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMember = async (e: React.MouseEvent) => {
    e.stopPropagation();  
    const cleanName = memberName.trim();
    if (!cleanName || !selectedGroupId || isAddingMember || !user) return;
    const duplicateMember = members.some((m: any) => String(m.name || "").trim().toLowerCase() === cleanName.toLowerCase());
    if (duplicateMember) {
      toast({ title: t("member_already_exists", "Member Already Exists"), variant: "destructive" });
      return;
    }

    setIsAddingMember(true);
    try {
      const memberId = createLocalUuid();
      const now = new Date().toISOString();
      const isQueuedOffline = isAndroid && isNetworkUnavailable(isOffline);

      if (isQueuedOffline) {
        if (!getDB()) throw new Error("Local database is not ready");
        const queuedMember = {
          id: memberId,
          group_id: selectedGroupId,
          user_id: null,
          name: cleanName,
          role: "member",
          upi_id: null,
          sync_status: "pending",
          is_deleted: 0,
          created_at: now,
          updated_at: now,
        };

        await seedLocalCacheRow("group_members", queuedMember, "pending");
        await saveAndSync("add_group_member_ghost", {
          p_group_id: selectedGroupId,
          p_name: cleanName,
          p_member_id: memberId,
        }, "RPC");

        queryClient.setQueryData(["group-members", selectedGroupId], (old: unknown) => {
          const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
          return [...list.filter((m) => m.id !== memberId), queuedMember]
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        });

        setMemberName("");
        await queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
        toast({ title: t("queued", "Queued"), description: t("sync_when_online", "Member will sync when back online.") });
        return;
      }

      const { data, error } = await supabase.rpc("add_group_member_ghost", {
        p_group_id: selectedGroupId,
        p_name: cleanName,
        p_member_id: memberId,
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.reason || "Could not add member");
      const serverMemberId = readJsonString(data, "member_id");
      if (!serverMemberId) throw new Error("Could not resolve member id");

      const { data: cloudMember, error: memberFetchError } = await supabase
        .from("group_members")
        .select("*")
        .eq("id", serverMemberId)
        .maybeSingle();
      if (memberFetchError) throw memberFetchError;

      const cloudMemberRecord = (cloudMember || {}) as Record<string, unknown>;
      const createdMember = {
        id: serverMemberId,
        group_id: selectedGroupId,
        user_id: null,
        name: cleanName,
        role: "member",
        upi_id: null,
        created_at: now,
        ...cloudMemberRecord,
        sync_status: "completed",
        is_deleted: 0,
        updated_at: now,
      };

      await seedLocalCacheRow("group_members", createdMember);
      queryClient.setQueryData(["group-members", selectedGroupId], (old: unknown) => {
        const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
        const withoutDuplicate = list.filter((m) => (
          m.id !== serverMemberId && String(m.name || "").trim().toLowerCase() !== cleanName.toLowerCase()
        ));
        return [...withoutDuplicate, createdMember].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      });

      setMemberName(""); 
      await queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"], exact: false });
      toast({ title: t("added", "Member Added! ✅"), className: "bg-emerald-600 text-white" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setIsAddingMember(false); }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const groupName = newGroupName.trim();
    if (!groupName || !user) return;
    const isDuplicate = groups.some((g: any) => g.name.toLowerCase() === groupName.toLowerCase());
    if (isDuplicate) { toast({ title: t("group_already_exists", "Group Already Exists"), variant: "destructive" }); return; }
    setIsAutoSaving(true);
    try {
      const groupId = createLocalUuid();
      const adminMemberId = createLocalUuid();
      const now = new Date().toISOString();
      const adminName = user.user_metadata?.full_name || user.email || "You";
      const isQueuedOffline = isAndroid && isNetworkUnavailable(isOffline);

      if (isQueuedOffline) {
        if (!getDB()) throw new Error("Local database is not ready");
        const groupRow = {
          id: groupId,
          name: groupName,
          user_id: user.id,
          member_count: 1,
          sync_status: "pending",
          is_deleted: 0,
          created_at: now,
          updated_at: now,
        };
        const adminRow = {
          id: adminMemberId,
          group_id: groupId,
          user_id: user.id,
          name: adminName,
          role: "admin",
          upi_id: null,
          sync_status: "pending",
          is_deleted: 0,
          created_at: now,
          updated_at: now,
        };

        await seedLocalCacheRow("groups", groupRow, "pending");
        await seedLocalCacheRow("group_members", adminRow, "pending");
        await saveAndSync("create_group_with_admin", {
          p_name: groupName,
          p_group_id: groupId,
          p_member_id: adminMemberId,
        }, "RPC");

        queryClient.setQueryData(GROUPS_QUERY_KEY, (old: unknown) => {
          const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
          return [groupRow, ...list.filter((g) => g.id !== groupId)];
        });
        queryClient.setQueryData(["group-members", groupId], [adminRow]);

        setNewGroupName("");
        setShowCreateModal(false);
        setSelectedGroupId(groupId);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }),
        ]);
        toast({ title: t("queued", "Queued"), description: t("sync_when_online", "Group will sync when back online.") });
        return;
      }

      const { data: result, error } = await supabase.rpc("create_group_with_admin", {
        p_name: groupName,
        p_group_id: groupId,
        p_member_id: adminMemberId,
      });
      if (error) throw error;
      console.log("🚀 [CreateGroup] RPC Result:", result);
      if (!result?.success || !result?.group_id) throw new Error(result?.reason || "Could not create group");

      const [{ data: createdGroup }, { data: adminMember }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", result.group_id).maybeSingle(),
        supabase.from("group_members").select("*").eq("group_id", result.group_id).eq("user_id", user.id).maybeSingle(),
      ]);
      const resultMemberId = readJsonString(result, "member_id");
      const adminMemberRecord = (adminMember || {}) as Record<string, unknown>;

      const groupRow = {
        id: result.group_id,
        name: groupName,
        user_id: user.id,
        member_count: 1,
        sync_status: "completed",
        is_deleted: 0,
        created_at: now,
        updated_at: now,
        ...(createdGroup || {}),
      };

      await seedLocalCacheRow("groups", groupRow);
      if (adminMember?.id || resultMemberId) {
        const adminRow = {
          id: adminMember?.id || resultMemberId,
          group_id: result.group_id,
          user_id: user.id,
          name: adminMember?.name || user.user_metadata?.full_name || user.email || "You",
          role: adminMember?.role || "admin",
          upi_id: adminMemberRecord.upi_id || null,
          created_at: adminMember?.created_at || now,
          ...adminMember,
          sync_status: "completed",
          is_deleted: 0,
          updated_at: adminMemberRecord.updated_at || now,
        };
        await seedLocalCacheRow("group_members", adminRow);
        queryClient.setQueryData(["group-members", result.group_id], [adminRow]);
      }

      queryClient.setQueryData(GROUPS_QUERY_KEY, (old: unknown) => {
        const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
        return [groupRow, ...list.filter((g) => g.id !== result.group_id)];
      });
      
      setNewGroupName(""); 
      setShowCreateModal(false); 
      
      console.log("🚀 [CreateGroup] Refetching groups...");
      await refetchGroups();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["group-members", result.group_id] }),
      ]);

      await queryClient.invalidateQueries({
       queryKey: ["user-memberships", user.id],
       exact: true
      });

      console.log("🚀 [CreateGroup] Setting Selected ID:", result.group_id);      setSelectedGroupId(result.group_id); 
      toast({ title: t("group_created", "Group Launched! 🚀"), className: "bg-emerald-600 text-white" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); } finally { setIsAutoSaving(false); }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !isAdmin) return;
    const groupId = selectedGroupId;
    console.log("🚀 [DeleteGroup] Starting deletion for:", groupId);
    try {
      // 🛡️ [ANDROID_FIX] Soft-delete from SQLite FIRST so Android UI reflects immediately.
      // Android reads from SQLite as source of truth — without this, the group stays visible
      // even after successful Supabase deletion because the local row is never updated.
      if (isAndroid) {
        const db = getDB();
        if (db) {
          await db.run(`UPDATE groups SET is_deleted = 1, sync_status = 'completed' WHERE id = ?`, [groupId]);
          await db.run(`UPDATE group_members SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
          await db.run(`UPDATE group_expenses SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
          await db.run(`UPDATE expense_splits SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
        }
      }

      // 🛡️ Relying on ON DELETE CASCADE for group_members, group_expenses, and expense_splits.
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;

      console.log("✅ [DeleteGroup] Success for:", groupId);
      
      // 🔄 UI & CACHE SYNC
      localStorage.removeItem(STORAGE_KEY);
      setSelectedGroupId(""); 
      setShowDeleteConfirm(false); 
      
      await queryClient.removeQueries({ queryKey: GROUPS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      await refetchGroups();

      toast({ title: t("group_deleted") });
    } catch (e: any) { 
      console.error("❌ [DeleteGroup] Failed:", e);
      toast({ title: "Failed", description: e.message, variant: "destructive" }); 
    }
  };

  const handleInviteShare = async () => {
    try {
      const group = groups.find((g: any) => g.id === selectedGroupId);
      if (!group) return;

      // 🛡️ [PHASE_7] Generate Secure Share Token
      const { data: token, error } = await supabase.rpc('generate_share_link', { 
        p_group_id: selectedGroupId 
      });

      if (error) throw error;

      const link = `${window.location.origin}/join?token=${token}`;
      const message = `${t("join_group_message", "Join my group")} "${group?.name}" ${t("on_bachatkaro", "on BachatKaro to split bills")}: ${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err: any) {
      console.error("❌ [InviteShare] Failed:", err);
      toast({ 
        title: "Invite Failed", 
        description: err.message || "Could not generate link.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-slate-50 pb-32 md:pb-12 font-sans text-slate-900 overflow-x-hidden border-t-[6px] border-[#EC4899]">
        <AppHeader />
        
        {isOffline && (
          <div className="bg-rose-500 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" /> {t("offline", "Offline Mode Active")}
          </div>
        )}

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {!isAuthReady || isLoadingGroups ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
              <p className="text-slate-500 font-bold animate-pulse">{t("loading", "Loading...")}</p>
            </div>
          ) : (
            <>
          {/* HEADER SECTION */}
          <GroupHeaderSection
            t={t}
            isVoicePremiumActive={isVoicePremiumActive}
            isAdmin={isAdmin}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleDeleteGroup={handleDeleteGroup}
            showCreateModal={showCreateModal}
            setShowCreateModal={setShowCreateModal}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            handleCreateGroup={handleCreateGroup}
            isAutoSaving={isAutoSaving}
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            groups={groups}
            gradientClass={gradientClass}
            inputClass={inputClass}
          />

          {!selectedGroupId ? (
            <Card className="bg-white border-dashed border-2 border-slate-200 rounded-[36px] p-12 text-center mt-8 shadow-sm">     
              <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5">
                <LayoutGrid className="h-10 w-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">{t("split_smarter", "Split Smarter")}</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">{t("choose_group_msg", "Choose a group from the top menu or create a new one to start recording shared bills.")}</p>
            </Card>
          ) : isHydrating ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
              <p className="text-slate-500 font-bold animate-pulse">{t("loading_ledger", "Restoring Ledger...")}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* TOP STATS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={cn("p-5 flex flex-col justify-center items-center text-center", cardStyle)}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("group_total")}</p>
                  <p className="text-2xl font-black text-slate-800 font-mono">{formatCurrency(totalExpense)}</p>
                </Card>
                <Card className={cn("p-5 flex flex-col justify-center items-center text-center", cardStyle)}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("fixed_share")}</p>
                  <p className="text-2xl font-black text-purple-600 font-mono">{formatCurrency(perPerson)}</p>
                </Card>
                <div className="col-span-2 flex items-center justify-end gap-2 px-1">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2 bg-white p-2 rounded-[20px] border border-slate-200 shadow-sm">
                    <BillRoulette members={activeMembers} />
                    <Button onClick={() => setTripAdvisorOpen(true)} variant="outline" size="icon" className="h-12 w-12 rounded-xl">                      <Map className="h-5 w-5 text-slate-600" />
                    </Button>
                  </div>
                </div>
              </div>

              <TripAdvisor open={tripAdvisorOpen} onOpenChange={setTripAdvisorOpen} groupId={selectedGroupId} />
              {memberBalances.length > 0 && (
                <SettlementSummary 
                  members={memberBalances} 
                  debts={debts} 
                  onSettle={handleSettleDebt} 
                  isAdmin={isAdmin} 
                  isBalanced={true} 
                  groupId={selectedGroupId}
                  currentUserId={user?.id}
                />
              )}

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT: Members & Debts */}
                <div className="space-y-6">
                  {/* Members Card */}
                  <Card className={cardStyle}>
                    <CardHeader className="bg-slate-50 py-4 border-b border-slate-100">
                      <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800">
                        <Users className="h-5 w-5 text-purple-600" /> {t("members")} ({activeMembers.length})
                      </CardTitle>
                    </CardHeader>                    <CardContent className="pt-5 space-y-4">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Input placeholder="Name" value={memberName} onChange={e => setMemberName(e.target.value)} className={cn("h-11 rounded-xl", inputClass)} />
                          <Button type="button" onClick={handleAddMember} disabled={!memberName.trim() || isAddingMember} className={cn("h-11 px-5 rounded-xl font-bold", gradientClass)}>
                            {isAddingMember ? <Loader2 className="animate-spin h-4 w-4" /> : t("add")}
                          </Button>
                        </div>
                      )}
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {members.map((m: any) => (
                          <div key={m.id} className={cn("flex justify-between items-center p-3 rounded-xl border shadow-sm transition-colors", m.is_deleted ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-100 hover:border-purple-200")}>
                            <span className="text-sm font-bold text-slate-700">
                              {m.name} {m.role === 'admin' && '👑'} {m.is_deleted && <span className="ml-2 text-xs text-slate-400 font-normal italic">(Departed)</span>}
                            </span>
                            {isAdmin && m.role !== 'admin' && !m.is_deleted && (
                              <Trash2
                                className="h-4 w-4 text-slate-300 hover:text-red-500 cursor-pointer"
                                onClick={async () => {
                                  if (!window.confirm(`Are you sure you want to remove ${m.name}?`)) return;

                                  console.log("🚨 REMOVE_MEMBER_START", {
                                    memberId: m.id,
                                    groupId: selectedGroupId
                                  });

                                  try {
                                    const { data, error } = await supabase.rpc('archive_group_member_atomic', { p_member_id: m.id });

                                    console.log("🚨 REMOVE_MEMBER_RESPONSE", { data, error });

                                    if (error) {
                                      console.error("❌ REMOVE_MEMBER_ERROR", error);
                                      toast({ title: "Failed to remove member", description: error.message, variant: "destructive" });
                                      return;
                                    }

                                    const result = data as any;
                                    if (result && result.success === false) {
                                       console.error("❌ REMOVE_MEMBER_BUSINESS_LOGIC_ERROR", result);
                                       toast({ title: "Cannot remove member", description: result.reason || "Validation failed.", variant: "destructive" });
                                       return;
                                    }

                                    // 🛡️ [ANDROID_FIX] Reflect removal in SQLite immediately
                                    if (isAndroid) {
                                      const db = getDB();
                                      if (db) {
                                        // 🚀 BUG_FIX: Perform soft-delete instead of permanent DELETE
                                        // This ensures the member row stays in the local database but with is_deleted=1,
                                        // allowing the UI to render the "(Departed)" label consistently with Web.
                                        await db.run(`UPDATE group_members SET is_deleted = 1, sync_status = 'completed' WHERE id = ?`, [m.id]);
                                      }
                                    }

                                    toast({ title: "Success", description: result?.message || "Member safely removed." });
                                    await refetchMembers();
                                  } catch (err: any) {
                                    console.error("❌ REMOVE_EXCEPTION", err);
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {isAdmin && (
                        <Button onClick={handleInviteShare} className="w-full flex items-center justify-center gap-2 h-12 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl font-bold transition-all mt-2">
                          <Share2 className="h-4 w-4" /> {t("invite_whatsapp")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Debts Card */}
                  <Card className={cardStyle}>
                    <CardHeader className="bg-slate-900 py-4">
                      <CardTitle className="text-xs font-black uppercase text-slate-300 flex items-center gap-2 tracking-widest">
                        <ReceiptIndianRupee className="h-4 w-4" /> {t("who_owes_whom")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      {debts.length > 0 ? debts.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="font-bold text-emerald-800 text-xs sm:text-sm">{d.fromName}</span>
                          <ArrowRight className="h-3 w-3 text-emerald-500 mx-1" />
                          <span className="font-bold text-emerald-800 text-xs sm:text-sm">{d.toName}</span>
                          <span className="font-black text-emerald-700 ml-auto font-mono">{formatCurrency(d.amount)}</span>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-xs font-bold text-slate-400">{t("all_settled")}</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT: Entry & Feed */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Bill Entry Panel */}
                  <Card className={cardStyle}>
                    <CardHeader className="bg-purple-50/50 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-black text-purple-700">{t("new_bill_entry")}</CardTitle>
                          {isVoicePremiumActive && premiumDaysLeft <= 5 && premiumDaysLeft > 0 && (
                            <span className="text-[9px] bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                              ⏳ {premiumDaysLeft} Days Left
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {t("voice_hint")} 
                          {isVoicePremiumActive && <span className="text-purple-600 font-bold ml-1">{t("voice_hint_premium")}</span>}
                        </p>
                      </div>

                      <div className="flex gap-2 items-center">
                        {isAutoSaving && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full border border-emerald-200 hidden sm:flex">
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{t("saving_instantly")}</span>
                          </div>
                        )}
                        <Button onClick={handleVoiceStart} className={cn("relative h-12 w-12 rounded-full shadow-md transition-all duration-300", voice.listening ? "bg-rose-500 hover:bg-rose-600 scale-110" : gradientClass)}>
                          {voice.listening && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20"></span>}
                          {voice.listening ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-6 space-y-5">
                      {(voice.transcript || isParsing) && (
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
                          {isParsing ? <Loader2 className="h-5 w-5 text-purple-500 animate-spin mt-0.5" /> : <div className="w-2 h-2 mt-1 rounded-full bg-rose-500 animate-ping" />}
                          <p className="text-sm italic font-bold text-purple-900">{isParsing ? t("analyzing_command") : `"${voice.transcript}"`}</p>
                        </div>
                      )}
                      
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600 ml-1">{t("bill_name")}</Label><Input value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder={t("bill_name_placeholder")} className={cn("h-12 rounded-xl", inputClass)} /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600 ml-1">{t("amount")}</Label><Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder={t("amount_placeholder")} className={cn("h-12 rounded-xl font-black text-xl", inputClass)} /></div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600 ml-1">{t("who_paid")}</Label>
                          <Select value={expensePaidByMemberId} onValueChange={handlePayerChange}>
                            <SelectTrigger className={cn("h-12 rounded-xl font-bold", inputClass)}><SelectValue placeholder={t("select_member")} /></SelectTrigger>
                            <SelectContent className="rounded-xl bg-white border-slate-200">
                              {activeMembers.map((m: any) => (<SelectItem key={m.id} value={m.id} className="font-bold text-slate-800 focus:bg-slate-100">{m.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600 ml-1">{t("split_method")}</Label>
                          <Select value={splitType} onValueChange={(v: SplitType) => setSplitType(v)}>
                            <SelectTrigger className={cn("h-12 rounded-xl font-bold", inputClass)}><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl bg-white border-slate-200">
                              <SelectItem value="equal" className="font-bold text-slate-800 focus:bg-slate-100">{t("split_equally")}</SelectItem>
                              <SelectItem value="unequal" className="font-bold text-slate-800 focus:bg-slate-100">{t("split_unequally")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {splitType === "unequal" && (
                        <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t("individual_shares")}</Label>
                            {(() => {
                              const sum = Object.values(customAmounts).reduce((acc, val) => acc + Number(val || 0), 0);
                              const isMatch = sum === Number(expenseAmount || 0);
                              return (
                                <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm border font-mono", isMatch ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200')}>
                                  Total: {formatCurrency(convertToPaisa(sum))} / {formatCurrency(convertToPaisa(expenseAmount || 0))}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeMembers.map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-700 pl-2">{m.name}</span>
                                <div className="relative w-28">
                                  <ReceiptIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <Input type="number" placeholder="0" value={customAmounts[m.id] || ""} onChange={(e) => setCustomAmounts(prev => ({ ...prev, [m.id]: e.target.value }))} className="h-10 pl-8 rounded-lg font-black text-slate-800 border-slate-200" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button type="button" onClick={(e) => { e.stopPropagation(); addExpense(); }} disabled={isAutoSaving || !expenseAmount || !expensePaidByMemberId} className={cn("w-full h-12 mt-2 font-bold text-base rounded-xl", gradientClass)}>
                        {isAutoSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <span className="flex items-center gap-2"><Sparkles className="h-4 w-4"/> {t("record_expense")}</span>}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Activity Feed */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mt-4 mb-2">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {t("activity_ledger")}
                      </h3>
                      {expenses.length > 0 && (
                        <div className="flex items-center gap-2">
                          
                          {/* 🚀 FIXED: Non-blocking Bulk Delete Dialog */}
                          <Dialog open={showClearLedgerConfirm} onOpenChange={setShowClearLedgerConfirm}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={isBulkDeleting}
                                className="h-9 px-3 text-rose-500 hover:bg-rose-50 rounded-lg font-black text-[10px] uppercase tracking-widest border border-rose-100"
                              >
                                {isBulkDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                {t("clear_ledger")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="p-6 max-w-sm w-[90%] mx-auto rounded-3xl bg-white">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                                  <AlertTriangle className="h-6 w-6" /> {t("clear_ledger_confirm_title")}
                                </DialogTitle>
                                <DialogDescription>{t("clear_ledger_confirm_desc")}</DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowClearLedgerConfirm(false)} className="rounded-xl flex-1 font-bold">{t("common.cancel")}</Button>
                                <Button onClick={handleBulkDelete} className="bg-rose-600 text-white rounded-xl flex-1 font-bold shadow-lg hover:bg-rose-700">{t("yes_clear")}</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                             <ExportMenu
                               data={expenses.map((exp: any) => {
                                 const payerName = members.find((m: any) => m.id === exp.paid_by_member_id)?.name || exp.paid_by;
                                 return {
                                   date: exp.created_at,
                                   category: "Group Expense",
                                   amount: exp.amount,
                                   type: 'expense',
                                   payment_mode: `Paid by ${payerName}`,
                                   note: `Bill: ${exp.title} (Split: ${exp.split_type})`
                                 };
                               })}
                               reportTitle={`${groups.find((g: any) => g.id === selectedGroupId)?.name || 'Group'} Expenses`}
                             />
                          </div>                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {paginatedExpenses.length > 0 ? paginatedExpenses.map((exp: any) => (
                        <MemoizedExpenseRow
                          key={exp.id}
                          exp={exp}
                          isAdmin={isAdmin}
                          currentUserId={user?.id}
                          members={members}
                          t={t}
                          formatCurrency={formatCurrency}
                          onEdit={(e: any) => { setEditDialogExp(e); setEditTempTitle(e.title); }}
                          onDelete={handleDeleteExpense}
                        />
                      )) : (                        <div className="text-center py-10 bg-white rounded-3xl border-dashed border-2 border-slate-200">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><Clock className="h-5 w-5 text-slate-300" /></div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t("ledger_empty")}</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 px-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="rounded-xl font-bold h-9 px-4 border-slate-200 text-slate-600"
                        >
                          Previous
                        </Button>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Page {currentPage} of {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-xl font-bold h-9 px-4 border-slate-200 text-slate-600"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>

        {/* Edit Modal */}
        <Dialog open={!!editDialogExp} onOpenChange={(open) => !open && setEditDialogExp(null)}>
          <DialogContent className="p-6 max-w-sm w-[90%] mx-auto bg-white rounded-3xl">
            <DialogHeader><DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2"><Pencil className="h-5 w-5 text-purple-500" /> {t("edit_bill_name")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input value={editTempTitle} onChange={e => setEditTempTitle(e.target.value)} placeholder={t("edit_bill_placeholder")} className={cn("h-12 rounded-xl font-bold", inputClass)} />
              <Button onClick={handleUpdateExpenseTitle} disabled={isUpdating || !editTempTitle.trim()} className={cn("w-full h-12 rounded-xl font-bold", gradientClass)}>
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : t("save_changes")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Premium Paywall Modal */}
        <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
          <DialogContent className="bg-white rounded-[2rem] p-0 max-w-sm w-[90%] mx-auto overflow-hidden border-0 shadow-2xl">
            <div className="bg-gradient-to-br from-slate-900 to-purple-900 p-8 text-center relative overflow-hidden">
              <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-4 animate-pulse relative z-10" />
              <DialogTitle className="text-2xl font-black text-white mb-2 relative z-10">{t("unlock_magic_voice")}</DialogTitle>
              <DialogDescription className="text-purple-200 text-sm font-medium relative z-10">
                {t("premium_trial_ended")}
              </DialogDescription>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Edit bills with voice</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Delete instantly via mic</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Priority AI processing</li>
              </ul>
              <Button 
                onClick={() => { setShowPremiumModal(false); navigate("/?checkout=true"); }} 
                className="w-full h-14 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-black text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-95"
              >
                {t("upgrade_now_price")}
              </Button>
              <button onClick={() => setShowPremiumModal(false)} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest mt-2">
                {t("maybe_later")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default GroupExpenses;
