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
 * UI: Premium Fintech Design System v2.0
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
import MemberSection from "@/components/group-expenses/MemberSection";
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
  Trash2, ArrowRight, Clock, Users, Map, Mic, MicOff,
  LayoutGrid, ReceiptIndianRupee, AlertTriangle, Loader2, WifiOff, Sparkles, Pencil, CheckCircle2,
  ArrowRightLeft, Store, Car, Fuel, UtensilsCrossed, Banknote, FileText, Smartphone, TrendingUp, Pill, Landmark, CreditCard, Mail, User, Activity, Clock3, AlertCircle, ShieldCheck
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

// 🛡️ [RUNTIME_STABILIZATION] Category Icon Mapper
const getCategoryIcon = (category: string, className: string = "h-4 w-4 sm:h-5 sm:w-5") => {
  const cat = (category || "").toLowerCase();
  
  // 🛡️ [RUNTIME_ICON_MAPPING] - Expanded Coverage for Activity Ledger
  if (cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe') || cat.includes('dining') || cat.includes('zomato') || cat.includes('swiggy')) return <UtensilsCrossed className={className} />;
  if (cat.includes('merchant') || cat.includes('shop') || cat.includes('shopping') || cat.includes('store') || cat.includes('purchase') || cat.includes('amazon') || cat.includes('flipkart') || cat.includes('myntra')) return <Store className={className} />;
  if (cat.includes('travel') || cat.includes('trip') || cat.includes('taxi') || cat.includes('uber') || cat.includes('ola') || cat.includes('cab') || cat.includes('train') || cat.includes('irctc') || cat.includes('flight')) return <Car className={className} />;
  if (cat.includes('fuel') || cat.includes('petrol') || cat.includes('diesel') || cat.includes('gas') || cat.includes('hp') || cat.includes('iocl') || cat.includes('indian oil')) return <Fuel className={className} />;
  if (cat.includes('bank') || cat.includes('atm') || cat.includes('branch') || cat.includes('landmark')) return <Landmark className={className} />;
  if (cat.includes('card') || cat.includes('credit') || cat.includes('debit')) return <CreditCard className={className} />;
  if (cat.includes('upi') || cat.includes('transfer') || cat.includes('payment') || cat.includes('self')) return <ArrowRightLeft className={className} />;
  if (cat.includes('salary') || cat.includes('income') || cat.includes('cash')) return <Banknote className={className} />;
  if (cat.includes('medic') || cat.includes('medicine') || cat.includes('hospital') || cat.includes('pharm') || cat.includes('doctor') || cat.includes('health') || cat.includes('pill')) return <Pill className={className} />;
  if (cat.includes('bill') || cat.includes('electricity') || cat.includes('water') || cat.includes('gas bill') || cat.includes('recharge') || cat.includes('broadband') || cat.includes('jio') || cat.includes('airtel') || cat.includes('vi') || cat.includes('mobile')) return <FileText className={className} />;
  if (cat.includes('mail') || cat.includes('email') || cat.includes('gmail')) return <Mail className={className} />;
  if (cat.includes('user') || cat.includes('person') || cat.includes('friend')) return <User className={className} />;
  if (cat.includes('invest') || cat.includes('mutual') || cat.includes('stock')) return <TrendingUp className={className} />;
  
  // Return ReceiptIndianRupee with primary color for unknown categories
  return <ReceiptIndianRupee className={className.replace("text-muted-foreground", "text-primary")} />;
};

// 🛡️ [RUNTIME_STABILIZATION] Memoized Row for Ledger Performance
const MemoizedExpenseRow = React.memo(({ exp, isAdmin, currentUserId, members, t, formatCurrency, onEdit, onDelete, intent }: any) => {
  const isSettlement = exp.source === 'settlement';

  // 🛡️ [ICON_STYLING_STABILIZATION] - Detect unknown categories for primary styling
  const isFallbackIcon = useMemo(() => {
    if (isSettlement) return false;
    const cat = (exp.category || "").toLowerCase();
    const knownKeywords = [
      'food', 'restaurant', 'cafe', 'dining', 'zomato', 'swiggy',
      'merchant', 'shop', 'shopping', 'store', 'purchase', 'amazon', 'flipkart', 'myntra',
      'travel', 'trip', 'taxi', 'uber', 'ola', 'cab', 'train', 'irctc', 'flight',
      'fuel', 'petrol', 'diesel', 'gas', 'hp', 'iocl', 'indian oil',
      'bank', 'atm', 'branch', 'landmark',
      'card', 'credit', 'debit',
      'upi', 'transfer', 'payment', 'self',
      'salary', 'income', 'cash',
      'medic', 'medicine', 'hospital', 'pharm', 'doctor', 'health', 'pill',
      'bill', 'electricity', 'water', 'gas bill', 'recharge', 'broadband', 'jio', 'airtel', 'vi', 'mobile',
      'mail', 'email', 'gmail',
      'user', 'person', 'friend',
      'invest', 'mutual', 'stock'
    ];
    return !knownKeywords.some(k => cat.includes(k));
  }, [exp.category, isSettlement]);

  const payerName = members.find((m: any) => m.id === exp.paid_by_member_id)?.name || exp.paid_by;
  const formattedDate = new Date(exp.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short"
  });

  // 🛡️ [VERIFICATION_BADGE_LOGIC]
  const badge = useMemo(() => {
    if (!isSettlement) return null;
    if (!intent) return (
      <span className="text-[9px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20 flex items-center gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
      </span>
    );

    if (intent.metadata?.is_override) {
        return (
          <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5" /> Override
          </span>
        );
    }

    switch (intent.status) {
        case 'success':
            return (
              <span className="text-[9px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20 flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
              </span>
            );
        case 'pending_verification':
            return (
              <span className="text-[9px] font-black uppercase text-yellow-500 bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                <Clock3 className="h-2.5 w-2.5" /> Pending
              </span>
            );
        case 'failed':
            return (
              <span className="text-[9px] font-black uppercase text-destructive bg-destructive/5 px-2 py-0.5 rounded border border-destructive/20 flex items-center gap-1">
                <AlertCircle className="h-2.5 w-2.5" /> Disputed
              </span>
            );
        default:
            return null;
    }
  }, [intent, isSettlement]);

  return (
    <div
      key={exp.id}
      className={cn(
        "group/row flex items-center justify-between gap-3 sm:gap-4",
        "px-4 py-3.5 sm:px-5 sm:py-4",
        "bg-card rounded-xl border border-border/60",
        "hover:border-border hover:shadow-sm",
        "transition-all duration-200"
      )}
    >
      {/* Left: Icon + Details */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl",
          "bg-muted border border-border/50",
          "flex items-center justify-center",
          "group-hover/row:bg-accent transition-colors duration-200",
          (isSettlement || isFallbackIcon) ? "text-primary bg-primary/5 border-primary/20" : ""
        )}>
          {isSettlement ? <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : getCategoryIcon(exp.category, "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground")}
        </div>

        <div className="flex-1 min-w-0">
          {/* Bill title — sentence case, not all-caps */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-card-foreground truncate leading-tight">
              {exp.title}
            </p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            <span className="font-medium text-foreground/70">{payerName}</span>
            <span className="mx-1.5 opacity-40">·</span>
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Right: Amount + Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Amount badge */}
        <div className="text-right">
          <span className={cn(
            "font-semibold font-mono tabular-nums text-sm sm:text-base",
            "text-destructive"
          )}>
            {formatCurrency(Number(exp.amount))}
          </span>
        </div>

        {/* Action buttons — always visible on mobile, hover on desktop */}
        {(isAdmin || exp.user_id === currentUserId) && (
          <div className={cn(
            "flex items-center gap-1.5",
            "opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100",
            "transition-opacity duration-150"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(exp)}
              aria-label={`Edit ${exp.title}`}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg",
                "text-muted-foreground hover:text-primary",
                "hover:bg-primary/8",
                "transition-all duration-150"
              )}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(exp.id)}
              aria-label={`Delete ${exp.title}`}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg",
                "text-muted-foreground hover:text-destructive",
                "hover:bg-destructive/8",
                "transition-all duration-150"
              )}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // 🛡️ [IDENTITY_HARDENED_COMPARATOR]
  return (
    prev.exp.id === next.exp.id &&
    prev.exp.amount === next.exp.amount &&
    prev.exp.title === next.exp.title &&
    prev.exp.paid_by_member_id === next.exp.paid_by_member_id &&
    prev.isAdmin === next.isAdmin
  );
});

const GroupExpenses = () => {
  const navigate = useNavigate();
  const { user, session, isAuthReady } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useI18nNamespaces(["group-expenses", "split", "common", "dashboard"]);

  // 🔒 Memory locks to prevent duplicate voice processing
  const lastProcessedText = useRef<string>("");
  const settledTranscriptRef = useRef<string>("");
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

    return () => { mounted = false; };
  }, [isAndroid, isSQLiteReady]);

  const fetchGroupsSafe = async ({ queryKey }: any) => {
    const [_key, userId] = queryKey;
    if (isAndroid) console.log(`🔍 [DIAGNOSTIC] fetchGroupsSafe Start - UserID: ${userId}`);
    
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
        isAuthReady, hasUser: !!user?.id, isSQLiteReady, selectedGroupId: !!selectedGroupId
      });
    }
  }, [isAuthReady, user?.id, isSQLiteReady, selectedGroupId, isAndroid]);

  const { data: groups = [], refetch: refetchGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    enabled: isAuthReady && !!user?.id && isSQLiteReady,
    queryFn: fetchGroupsSafe,
  });

  // 🛡️ [OFFLINE_SYNC_LISTENER]
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleSyncUpdate = () => {
      if (invalidationTimeoutRef.current) clearTimeout(invalidationTimeoutRef.current);
      invalidationTimeoutRef.current = setTimeout(() => {
        console.log("🔄 [OFFLINE_SYNC_EVENT] Debounced refresh signal executed.");
        void queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] });
        void queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] });
        void queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
        void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      }, 300);
    };

    window.addEventListener('sync_queue_updated', handleSyncUpdate);
    window.addEventListener('newTransaction', handleSyncUpdate);
    window.addEventListener('newLocalTransaction', handleSyncUpdate);
    
    return () => {
      if (invalidationTimeoutRef.current) clearTimeout(invalidationTimeoutRef.current);
      window.removeEventListener('sync_queue_updated', handleSyncUpdate);
      window.removeEventListener('newTransaction', handleSyncUpdate);
      window.removeEventListener('newLocalTransaction', handleSyncUpdate);
    };
  }, [queryClient, selectedGroupId, GROUPS_QUERY_KEY]);

  // 🛡️ REALTIME LISTENER
  const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!selectedGroupId || !navigator.onLine) return;
    const channel = supabase
      .channel(`group-expenses-listener:${selectedGroupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_expenses', filter: `group_id=eq.${selectedGroupId}` },
        (payload) => {
          console.log('✅ [REALTIME_INSERT] New group expense detected.', payload.new);
          if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
          realtimeTimeoutRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: ['group-expenses', selectedGroupId] });
            void queryClient.invalidateQueries({ queryKey: ['expense-splits', selectedGroupId] });
          }, 300);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log(`✅ [REALTIME] Subscribed to group: ${selectedGroupId}`);
        if (status === 'CHANNEL_ERROR') console.error(`❌ [REALTIME_ERROR]`, err);
      });

    return () => {
      console.log(`🔌 [REALTIME_UNSUB] Unsubscribing from group: ${selectedGroupId}`);
      if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId, queryClient]);

  const safeGroups = groups ?? [];

  // 3. Group Hydration & Persistence Flow
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
      const isStillValid = safeGroups.some(g => g.id === selectedGroupId);
      if (!isStillValid && !isLoadingGroups) {
        console.warn("🚨 [HYDRATION_GUARD] Current selectedGroupId is no longer in groups list. Clearing state.");
        setSelectedGroupId("");
      }
    }
  }, [safeGroups, isLoadingGroups, user?.id, selectedGroupId]);

  // PHASE 1: Hybrid Active Group Model
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
      try {
        const state = await hydrateLocalActiveGroupFromCloud(user.id);
        if (cancelled) return;
        if (state.groupId && state.groupId !== selectedGroupId) setSelectedGroupId(state.groupId);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroupId && user?.id) localStorage.setItem(STORAGE_KEY, selectedGroupId);
  }, [selectedGroupId, user?.id, STORAGE_KEY]);

  useEffect(() => {
    if (!user?.id || !selectedGroupId) return;
    void setLocalActiveGroup(user.id, selectedGroupId).catch(() => undefined);
    scheduleActiveGroupSync(user.id);
  }, [selectedGroupId, user?.id]);

  // 4. Group-Dependent Queries
  const { data: members = [], refetch: refetchMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["group-members", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId && isSQLiteReady,
    queryFn: async () => fetchLocalOrCloud("group_members", selectedGroupId, "", "name ASC", "group_id", true, isAndroid && navigator.onLine),
  });

  const activeMembers = useMemo(() => members.filter((m: any) => !m.is_deleted), [members]);
  const isAdmin = useMemo(() => isGroupAdmin(activeMembers, user?.id), [activeMembers, user]);

  const { data: expenses = [], refetch: refetchExpenses, error: expensesError, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["group-expenses", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId,
    queryFn: async () => fetchLocalOrCloud("group_expenses", selectedGroupId, "", "created_at DESC", "group_id"),
  });

  // 🛡️ [VERIFICATION_BADGE_QUERY]
  const { data: allIntents = [] } = useQuery({
    queryKey: ['settlement-intents', selectedGroupId],
    enabled: !!selectedGroupId && isAuthReady,
    queryFn: async () => {
        const { data, error } = await supabase
            .from('settlement_intents')
            .select('*')
            .eq('group_id', selectedGroupId);
        if (error) throw error;
        return data || [];
    }
  });

  const intentMap = useMemo(() => {
    return allIntents.reduce((acc: Record<string, any>, intent) => {
        acc[intent.idempotency_key] = intent;
        return acc;
    }, {});
  }, [allIntents]);

  const { data: splits = [], refetch: refetchSplits, isLoading: isLoadingSplits } = useQuery({
    queryKey: ["expense-splits", selectedGroupId],
    enabled: isAuthReady && !!user?.id && !!selectedGroupId,
    queryFn: async () => fetchLocalOrCloud("expense_splits", selectedGroupId, "", "created_at ASC", "group_id"),
  });

  // 🛡️ [PHASE_0C] HYDRATION BARRIER SYSTEM
  const isHydrating = isLoadingMembers || isLoadingExpenses || isLoadingSplits;

  useEffect(() => {
    if (import.meta.env.DEV && isHydrating) {
      console.log("[HYDRATION_BARRIER_ACTIVE]", {
        members: !isLoadingMembers, expenses: !isLoadingExpenses, splits: !isLoadingSplits
      });
    }
  }, [isLoadingMembers, isLoadingExpenses, isLoadingSplits, isHydrating]);

  const safeExpenses = useMemo(() => {
    if (!expenses) return [];
    const seen = new Set();
    return expenses.filter(exp => {
      if (!exp.id || seen.has(exp.id)) return false;
      seen.add(exp.id);
      return true;
    });
  }, [expenses]);
  
  const safeSplits = splits ?? [];

  // 💎 30-Day Premium Logic
  const { isVoicePremiumActive, premiumDaysLeft } = useMemo(() => {
    if (!user || !user.created_at) return { isVoicePremiumActive: false, premiumDaysLeft: 0 };
    const createdDate = new Date(user.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - diffDays);
    return { isVoicePremiumActive: diffDays <= 30, premiumDaysLeft: daysLeft };
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
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [safeExpenses, currentPage, totalPages]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (isAndroid) {
        void syncEngine.processQueue().finally(() => {
          queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
          if (selectedGroupId) queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
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
  useEffect(() => {
    if (!user?.id || members.length === 0 || !selectedGroupId) return;
    if (!expensePaidByMemberId) {
      const currentUserMember = members.find(m => m.user_id === user.id);
      if (currentUserMember) {
        console.log("🛡️ [HYDRATION] Auto-selecting current user as payer:", currentUserMember.name);
        safeSetPayerId(currentUserMember.id, 'AutoHydration');
      } else {
        console.warn("⚠️ [HYDRATION_WARNING] Logged-in user is not a member of the selected group.");
      }
    }
  }, [user?.id, members, selectedGroupId, expensePaidByMemberId, safeSetPayerId]);

  const handleSettleDebt = async (fromName: string, toName: string, amount: number, idempotencyKey?: string) => {
    if (!user?.id || !selectedGroupId) return;

    if (!isAdmin && !idempotencyKey) {
      console.warn("[SETTLEMENT_BLOCKED] Manual settlement requires Admin role.");
      toast({
        title: t("permission_denied", "Permission Denied"),
        description: t("only_admins_settle", "Only group admins can manually mark debts as settled."),
        variant: "destructive"
      });
      return;
    }

    // 🛡️ [ADMIN_OVERRIDE_LOGIC]
    let overrideReason = "";
    if (isAdmin && !idempotencyKey) {
        const reason = window.prompt("Mandatory: Please provide a reason for force settlement (e.g. Cash Paid, Error Correction):");
        if (!reason || reason.trim().length < 4) {
            toast({ title: "Reason Required", description: "A valid reason (min 4 chars) is mandatory for force settlements.", variant: "destructive" });
            return;
        }
        overrideReason = reason.trim();
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
      const amountPaisa = convertToPaisa(amount);

      const rpcPayload = {
        p_group_id: selectedGroupId,
        p_user_id: user.id,
        p_title: `Settlement: ${fromName} -> ${toName}`,
        p_amount: amountPaisa,
        p_paid_by_member_id: fromMember.id,
        p_split_type: 'unequal',
        p_splits: [{ member_id: toMember.id, user_id: toMember.user_id || null, share_amount: amountPaisa }],
        p_idempotency_key: idempotencyKey || null,
        p_notes: overrideReason || undefined
      };

      const isAndroid = Capacitor.getPlatform() === 'android';
      const expenseId = self.crypto.randomUUID();
      const finalIdempotencyKey = idempotencyKey || `idemp_${expenseId}`;
      const finalRpcPayload = { ...rpcPayload, p_id: expenseId, p_idempotency_key: finalIdempotencyKey };

      // 🛡️ [ADMIN_OVERRIDE_METADATA]
      if (overrideReason) {
          const { error: intentError } = await supabase.from('settlement_intents').insert({
              id: self.crypto.randomUUID(),
              group_id: selectedGroupId,
              sender_id: fromMember.id,
              receiver_id: toMember.id,
              amount: amountPaisa,
              status: 'success', // Terminal state for Admin Override
              idempotency_key: finalIdempotencyKey,
              metadata: { 
                  is_override: true, 
                  override_reason: overrideReason, 
                  admin_id: user.id,
                  overridden_at: new Date().toISOString()
              }
          });
          if (intentError) console.error("[ORCHESTRATOR_OVERRIDE_LOG_FAIL]", intentError);
      }

      if (isAndroid) {
        const db = getDB();
        if (db) {
          console.log("📱 [SETTLEMENT_SQLITE_OPTIMISTIC] Injecting settlement into local ledger");
          await db.run(`INSERT INTO group_expenses (id, group_id, title, category, amount, paid_by, paid_by_member_id, user_id, split_type, idempotency_key, sync_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [expenseId, selectedGroupId, rpcPayload.p_title, "Others", amountPaisa, fromMember.id, fromMember.id, user.id, 'unequal', finalIdempotencyKey, 'pending', overrideReason || ""]
          );
          for (const s of rpcPayload.p_splits) {
            const splitId = `spl_${Math.random().toString(36).substring(2, 9)}`;
            await db.run(`INSERT INTO expense_splits (id, expense_id, group_id, member_id, user_id, share_amount, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [splitId, expenseId, selectedGroupId, s.member_id, s.user_id, s.share_amount, 'pending']
            );
          }
        }
      }

      await saveAndSync("insert_group_expense_with_split", finalRpcPayload, "RPC");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ['settlement-intents', selectedGroupId] }),
        refetchExpenses(), refetchSplits()
      ]);
      toast({ title: t("settlement_success", "Settlement securely logged.") });
    } catch (e: any) {
      toast({ title: "Settlement Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAutoSaving(false);
    }
  };

  // ── Shared style tokens (scoped to this component) ──
  const gradientClass = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border-none active:scale-[0.98]";
  const cardClass = "bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden";
  const inputClass = "bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-150";

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
    
    if (isHydrating) {
      if (import.meta.env.DEV) console.log("[HYDRATION_STALL] Skipping balance engine while data hydrates...");
      return { debts: [], memberBalances: [] };
    }

    if (import.meta.env.DEV) {
      console.log("🕵️ [PIPELINE_TRACE] Group Ledger Input Counts:", {
        expenses: safeExpenses.length, splits: safeSplits.length, members: members.length,
        isLoadingExpenses, isAuthReady, selectedGroupId: !!selectedGroupId
      });
    }

    console.log("[BALANCE_RECOMPUTE_REASON]", {
      expensesChanged: safeExpenses.length, splitsChanged: safeSplits.length,
      membersChanged: members.length, timestamp: Date.now()
    });

    if (safeExpenses.length > 0 && safeSplits.length > 0 && members.length > 0) {
      const splitMap = safeSplits.reduce((acc: any, s: any) => {
        if (!acc[s.expense_id]) acc[s.expense_id] = [];
        acc[s.expense_id].push({ member_id: s.member_id, shareAmount: Number(s.share_amount) });
        return acc;
      }, {});
      
      const normalized = safeExpenses.map((exp: any) => ({
        paidByMemberId: exp.paid_by_member_id, splits: splitMap[exp.id] || []
      })).filter((exp: any) => !!exp.paidByMemberId && exp.splits.length > 0);
      
      const normalizedMembers = members.map((m: any) => ({ id: m.id, name: m.name }));
      console.log("🧪 [BALANCE_ENGINE_INPUT]", { normalizedExpenses: normalized, normalizedMembers });

      balances = computeBalances(normalized, normalizedMembers);
      const rawDebts = simplifyDebts(balances);
      
      debtsList = rawDebts.map(d => {
        const fromMember = members.find(m => m.id === d.from);
        const toMember = members.find(m => m.id === d.to);
        console.log("[AMOUNT_AFTER_NORMALIZATION] debt.amount:", d.amount, "from:", fromMember?.name, "to:", toMember?.name);
        return {
          from: d.from, to: d.to,
          fromName: fromMember?.name || "User",
          toName: toMember?.name || "User",
          amount: d.amount,
          upi_id: toMember?.upi_id || null
        };
      });
      console.log("🧪 [BALANCE_ENGINE_OUTPUT]", { balances, debtsList });
    } else {
      console.warn("⚠️ [BALANCE_ENGINE_SKIP] Missing required data", {
        hasExpenses: expenses.length > 0, hasSplits: splits.length > 0, hasMembers: members.length > 0
      });
    }

    const safeBalances = Array.isArray(balances) ? balances : [];
    const statsMap: Record<string, { paid: number; owes: number }> = {};
    if (Array.isArray(members)) members.forEach((m: any) => { if (m?.id) statsMap[m.id] = { paid: 0, owes: 0 }; });

    if (Array.isArray(safeExpenses) && Array.isArray(safeSplits)) {
      safeExpenses.forEach((exp: any) => {
        const payerId = exp.paid_by_member_id;
        const expSplits = safeSplits.filter((s: any) => s.expense_id === exp.id);
        let total = 0;
        expSplits.forEach((s: any) => {
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
  }, [safeExpenses, safeSplits, members, isHydrating, selectedGroupId, isLoadingExpenses, isAuthReady]);

  const isUUID = (str: string) => /^[0-9a-fA-F-]{36}$/.test(str);

  // 🚀 ZERO-DELAY DIRECT DATABASE HIT
  const processExpense = useCallback(async (amount: number, payerId: string, title: string, splitMethod: SplitType, customSplits: any, silent = false) => {
    if (isAutoSaving) return false;
    
    const isOnline = typeof navigator !== "undefined" && navigator.onLine;
    let activeSession = session;
    let activeAuthUser = user;

    if (isOnline) {
      try {
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const { data: { user: freshUser }, error: authError } = await supabase.auth.getUser();
        if (freshSession) activeSession = freshSession;
        if (freshUser) activeAuthUser = freshUser;
        if (authError || !freshUser || !freshSession?.access_token) {
          console.warn("⚠️ [AUTH_SYNC] Session stale or missing. Forcing refresh...");
          const refreshed = await supabase.auth.refreshSession();
          if (refreshed.data.session) {
            activeSession = refreshed.data.session;
            activeAuthUser = refreshed.data.session.user;
          }
        }
      } catch (err) {
        console.warn("⚠️ [AUTH_SYNC] Online verification failed, falling back to cached session:", err);
      }
    }

    if (!activeSession || !activeSession.access_token || !activeAuthUser || activeAuthUser.role !== 'authenticated' || !user?.id || !selectedGroupId || !payerId) {
      console.error("🚨 [AUTH_RACE_FAILURE] Blocked insert due to missing required state or session:", {
        stateUserId: user?.id, authUserId: activeAuthUser?.id, role: activeAuthUser?.role,
        hasToken: !!activeSession?.access_token, selectedGroupId, payerId
      });
      toast({ title: "Session Error", description: "Your authentication session is not ready or has expired. Please sign in again.", variant: "destructive" });
      return false;
    }

    setIsAutoSaving(true);
    try {
      const invalidFields = [];
      if (!isUUID(selectedGroupId)) invalidFields.push(`group_id (${selectedGroupId})`);
      if (!isUUID(payerId)) {
        console.error("[INVALID_PAYER_UUID] Non-UUID detected for payerId:", payerId);
        invalidFields.push(`payerId (${payerId})`);
      }
      if (user?.id && !isUUID(user.id)) invalidFields.push(`user_id (${user.id})`);

      if (invalidFields.length > 0) {
        console.error("🚨 [FORENSIC_FAILURE] Invalid UUIDs detected:", invalidFields);
        toast({ title: "Data Integrity Error", description: `Invalid identifiers: ${invalidFields.join(", ")}. Please refresh or re-select.`, variant: "destructive" });
        setIsAutoSaving(false);
        return false;
      }

      const amountPaisa = convertToPaisa(amount);
      const customSplitsPaisa: Record<string, number> = {};
      if (splitMethod === 'unequal') {
        Object.entries(customSplits).forEach(([mid, val]) => { customSplitsPaisa[mid] = convertToPaisa(val); });
      }

      const splitResults = calculateSplit({
        amountPaisa, splitType: splitMethod,
        members: activeMembers.map((m: any) => ({ memberId: m.id, name: m.name })),
        customValues: splitMethod === 'unequal' ? customSplitsPaisa : undefined
      });

      console.log("📡 [SPLIT_RESULTS_DEBUG]", splitResults);

      const { createGroupExpense } = await import('@/services/groupLedgerService');
      const finalRpcPayload = await createGroupExpense({
        userId: user.id, groupId: selectedGroupId, amount, title: title || "New Bill", payerId, activeMembers
      });

      setExpenseTitle(""); setExpenseAmount("");
      safeSetPayerId("", "Reset");
      setSplitType("equal"); setCustomAmounts({});

      console.log("🚀 [CENTRALIZED_SUCCESS] Triggering UI invalidation...");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] }),
        refetchExpenses(), refetchSplits()
      ]);

      if (!silent) toast({ title: t("bill_saved", "Bill Saved! 🚀") });
      return true;
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsAutoSaving(false);
    }
  }, [selectedGroupId, activeMembers, user, queryClient, t, isAutoSaving, toast]);

  useEffect(() => { processExpenseRef.current = processExpense; }, [processExpense]);

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
      lastProcessedText.current = "";
      if (voice.listening) { voice.stop(); setTimeout(() => voice.start(), 50); return; }
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
      toast({ title: t("deleted_entry", "Deleted!") });
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
      toast({ title: "Updated!", description: "All data is now fresh." });
    } catch {
      toast({ title: "Refresh Failed", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedGroupId) return;
    if (!navigator.onLine || isOffline) {
      setShowClearLedgerConfirm(false);
      toast({ title: t("offline_mode", "Offline Mode"), description: t("connect_to_delete", "Connect to internet to delete expenses safely."), variant: "destructive" });
      return;
    }
    setShowClearLedgerConfirm(false);

    const previousExpenses = queryClient.getQueryData(["group-expenses", selectedGroupId]);
    const previousSplits = queryClient.getQueryData(["expense-splits", selectedGroupId]);

    queryClient.setQueryData(["group-expenses", selectedGroupId], []);
    queryClient.setQueryData(["expense-splits", selectedGroupId], []);

    setIsBulkDeleting(true);
    try {
      console.log(`🗑️ [LEDGER_CLEAR_START] Group: ${selectedGroupId}`);
      await clearGroupLedger(selectedGroupId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] }),
        queryClient.invalidateQueries({ queryKey: ["expense-splits", selectedGroupId] })
      ]);
      toast({ title: "Ledger cleared." });
    } catch (error: any) {
      console.error("❌ [LEDGER_CLEAR_FAIL]", error);
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
    
    if (isProcessingRef.current || !transcript || transcript.length < 3 || isAutoSaving || transcript === settledTranscriptRef.current) return;
    if (transcript === lastProcessedText.current && voice.listening) return;
    lastProcessedText.current = transcript;

    const timeoutId = setTimeout(async () => {
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
            setIsParsing(false);
            isProcessingRef.current = false;
            return;
          }

          const commandWord = lowerTranscript.split(/\s+/)[0];
          const targetName = lowerTranscript.replace(commandWord, "").trim();
          const targetExp = expensesRef.current.find((e: any) => e.title.toLowerCase().includes(targetName));

          if (targetExp) {
            if (voice.listening) voice.stop();
            if (voice.reset) voice.reset();
            settledTranscriptRef.current = transcript;

            if (isDeleteCommand) {
              await handleDeleteExpense(targetExp.id);
            } else if (isEditCommand) {
              setEditDialogExp(targetExp);
              setEditTempTitle(targetExp.title);
              toast({ title: t("opening_edit", "Opening Edit...") });
            }
          } else {
            toast({ title: t("not_found", "Not Found"), description: `Could not find a bill named "${targetName}"` });
            if (voice.listening) voice.stop();
            if (voice.reset) voice.reset();
            settledTranscriptRef.current = transcript;
          }
          setIsParsing(false);
          isProcessingRef.current = false;
          return;
        }

        const amountMatch = transcript.match(/\b\d+(?:\.\d+)?\b/);
        const sortedMembers = [...membersRef.current].sort((a, b) => b.name.length - a.name.length);
        const foundMember = sortedMembers.find(m => lowerTranscript.includes(m.name.toLowerCase()));

        if (amountMatch && foundMember && voice.listening) {
          const matchedAmount = amountMatch[0];
          const matchedPayerId = foundMember.id;
          let cleanTitle = transcript.replace(matchedAmount, "").trim();
          const nameRegex = new RegExp(foundMember.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
          cleanTitle = cleanTitle.replace(nameRegex, "").trim();
          cleanTitle = cleanTitle.replace(/^(for|by|to|and|paid|rs|rupees?|₹)\s+/i, "").trim();
          cleanTitle = cleanTitle.replace(/\s+/g, " ").trim();
          const matchedTitle = cleanTitle.length > 1 ? cleanTitle : "Voice Entry";

          if (voice.listening) voice.stop();
          if (voice.reset) voice.reset();
          settledTranscriptRef.current = transcript;

          setExpenseAmount(matchedAmount);
          safeSetPayerId(matchedPayerId, "VoiceRocket");
          setExpenseTitle(matchedTitle);
          setSplitType("equal");

          await processExpenseRef.current(Number(matchedAmount), matchedPayerId, matchedTitle, "equal", {}, false);
        } else if (!voice.listening) {
          const result = await parseWithAIRef.current(transcript);
          const data = result.success ? result.data : result.fallback;
          if (voice.reset) voice.reset();
          settledTranscriptRef.current = transcript;

          let aiMatchedId = "";
          if (data.paidBy) {
            const aiFound = membersRef.current.find((m: any) => m.name.toLowerCase().includes(data.paidBy!.toLowerCase()));
            if (aiFound) aiMatchedId = aiFound.id;
          }

          if (data.amount) setExpenseAmount(data.amount.toString());
          if (aiMatchedId) safeSetPayerId(aiMatchedId, "AIFallback");
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
        if (voice.transcript) voice.reset();
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [voice.transcript, voice.listening, isAutoSaving]);

  const handleUpdateExpenseTitle = async () => {
    if (!editDialogExp || !editTempTitle.trim()) return;
    const previousExpenses = queryClient.getQueryData(["group-expenses", selectedGroupId]);
    const newTitle = editTempTitle.trim();

    queryClient.setQueryData(["group-expenses", selectedGroupId], (old: any) =>
      Array.isArray(old) ? old.map((e: any) => e.id === editDialogExp.id ? { ...e, title: newTitle } : e) : []
    );

    setIsUpdating(true);
    try {
      console.log(`✏️ [LEDGER_EDIT_START] ID: ${editDialogExp.id}`);
      await updateGroupExpenseTitle(editDialogExp.id, newTitle);
      await queryClient.invalidateQueries({ queryKey: ["group-expenses", selectedGroupId] });
      setEditDialogExp(null);
      toast({ title: t("updated", "Entry updated.") });
    } catch (e: any) {
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
        const queuedMember = { id: memberId, group_id: selectedGroupId, user_id: null, name: cleanName, role: "member", upi_id: null, sync_status: "pending", is_deleted: 0, created_at: now, updated_at: now };
        await seedLocalCacheRow("group_members", queuedMember, "pending");
        await saveAndSync("add_group_member_ghost", { p_group_id: selectedGroupId, p_name: cleanName, p_member_id: memberId }, "RPC");
        queryClient.setQueryData(["group-members", selectedGroupId], (old: unknown) => {
          const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
          return [...list.filter((m) => m.id !== memberId), queuedMember].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        });
        setMemberName("");
        await queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
        toast({ title: t("queued", "Queued"), description: t("sync_when_online", "Member will sync when back online.") });
        return;
      }

      const { data, error } = await supabase.rpc("add_group_member_ghost", { p_group_id: selectedGroupId, p_name: cleanName, p_member_id: memberId });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.reason || "Could not add member");
      const serverMemberId = readJsonString(data, "member_id");
      if (!serverMemberId) throw new Error("Could not resolve member id");

      const { data: cloudMember, error: memberFetchError } = await supabase.from("group_members").select("*").eq("id", serverMemberId).maybeSingle();
      if (memberFetchError) throw memberFetchError;

      const cloudMemberRecord = (cloudMember || {}) as Record<string, unknown>;
      const createdMember = { id: serverMemberId, group_id: selectedGroupId, user_id: null, name: cleanName, role: "member", upi_id: null, created_at: now, ...cloudMemberRecord, sync_status: "completed", is_deleted: 0, updated_at: now };

      await seedLocalCacheRow("group_members", createdMember);
      queryClient.setQueryData(["group-members", selectedGroupId], (old: unknown) => {
        const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
        const withoutDuplicate = list.filter((m) => (m.id !== serverMemberId && String(m.name || "").trim().toLowerCase() !== cleanName.toLowerCase()));
        return [...withoutDuplicate, createdMember].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      });

      setMemberName("");
      await queryClient.invalidateQueries({ queryKey: ["group-members", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"], exact: false });
      toast({ title: t("added", "Member added to ledger.") });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteMember = useCallback(async (member: any) => {
    if (!window.confirm(t("delete_member_confirm", `Are you sure you want to remove ${member.name}?`))) return;

    console.log("🚨 REMOVE_MEMBER_START", { memberId: member.id, groupId: selectedGroupId });
    try {
      const { data, error } = await supabase.rpc('archive_group_member_atomic', { p_member_id: member.id });
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

      if (isAndroid) {
        const db = getDB();
        if (db) await db.run(`UPDATE group_members SET is_deleted = 1, sync_status = 'completed' WHERE id = ?`, [member.id]);
      }

      toast({ title: "Success", description: result?.message || "Member safely removed." });
      await refetchMembers();
    } catch (err: any) {
      console.error("❌ REMOVE_EXCEPTION", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedGroupId, isAndroid, toast, refetchMembers, t, supabase]);

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
        const groupRow = { id: groupId, name: groupName, user_id: user.id, member_count: 1, sync_status: "pending", is_deleted: 0, created_at: now, updated_at: now };
        const adminRow = { id: adminMemberId, group_id: groupId, user_id: user.id, name: adminName, role: "admin", upi_id: null, sync_status: "pending", is_deleted: 0, created_at: now, updated_at: now };
        await seedLocalCacheRow("groups", groupRow, "pending");
        await seedLocalCacheRow("group_members", adminRow, "pending");
        await saveAndSync("create_group_with_admin", { p_name: groupName, p_group_id: groupId, p_member_id: adminMemberId }, "RPC");
        queryClient.setQueryData(GROUPS_QUERY_KEY, (old: unknown) => {
          const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
          return [groupRow, ...list.filter((g) => g.id !== groupId)];
        });
        queryClient.setQueryData(["group-members", groupId], [adminRow]);
        setNewGroupName(""); setShowCreateModal(false); setSelectedGroupId(groupId);
        await Promise.all([queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }), queryClient.invalidateQueries({ queryKey: ["group-members", groupId] })]);
        toast({ title: t("queued", "Queued"), description: t("sync_when_online", "Group will sync when back online.") });
        return;
      }

      const { data: result, error } = await supabase.rpc("create_group_with_admin", { p_name: groupName, p_group_id: groupId, p_member_id: adminMemberId });
      if (error) throw error;
      console.log("🚀 [CreateGroup] RPC Result:", result);
      if (!result?.success || !result?.group_id) throw new Error(result?.reason || "Could not create group");

      const [{ data: createdGroup }, { data: adminMember }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", result.group_id).maybeSingle(),
        supabase.from("group_members").select("*").eq("group_id", result.group_id).eq("user_id", user.id).maybeSingle(),
      ]);
      const resultMemberId = readJsonString(result, "member_id");
      const adminMemberRecord = (adminMember || {}) as Record<string, unknown>;

      const groupRow = { id: result.group_id, name: groupName, user_id: user.id, member_count: 1, sync_status: "completed", is_deleted: 0, created_at: now, updated_at: now, ...(createdGroup || {}) };
      await seedLocalCacheRow("groups", groupRow);

      if (adminMember?.id || resultMemberId) {
        const adminRow = { id: adminMember?.id || resultMemberId, group_id: result.group_id, user_id: user.id, name: adminMember?.name || user.user_metadata?.full_name || user.email || "You", role: adminMember?.role || "admin", upi_id: adminMemberRecord.upi_id || null, created_at: adminMember?.created_at || now, ...adminMember, sync_status: "completed", is_deleted: 0, updated_at: adminMemberRecord.updated_at || now };
        await seedLocalCacheRow("group_members", adminRow);
        queryClient.setQueryData(["group-members", result.group_id], [adminRow]);
      }

      queryClient.setQueryData(GROUPS_QUERY_KEY, (old: unknown) => {
        const list = Array.isArray(old) ? old as Array<Record<string, unknown>> : [];
        return [groupRow, ...list.filter((g) => g.id !== result.group_id)];
      });

      setNewGroupName(""); setShowCreateModal(false);
      console.log("🚀 [CreateGroup] Refetching groups...");
      await refetchGroups();
      await Promise.all([queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }), queryClient.invalidateQueries({ queryKey: ["group-members", result.group_id] })]);
      await queryClient.invalidateQueries({ queryKey: ["user-memberships", user.id], exact: true });
      console.log("🚀 [CreateGroup] Setting Selected ID:", result.group_id);
      setSelectedGroupId(result.group_id);
      toast({ title: t("group_created", "Group ledger established.") });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !isAdmin) return;
    const groupId = selectedGroupId;
    console.log("🚀 [DeleteGroup] Starting deletion for:", groupId);
    try {
      if (isAndroid) {
        const db = getDB();
        if (db) {
          await db.run(`UPDATE groups SET is_deleted = 1, sync_status = 'completed' WHERE id = ?`, [groupId]);
          await db.run(`UPDATE group_members SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
          await db.run(`UPDATE group_expenses SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
          await db.run(`UPDATE expense_splits SET is_deleted = 1, sync_status = 'completed' WHERE group_id = ?`, [groupId]);
        }
      }

      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;

      console.log("✅ [DeleteGroup] Success for:", groupId);
      localStorage.removeItem(STORAGE_KEY);
      setSelectedGroupId(""); setShowDeleteConfirm(false);
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
      const { data: token, error } = await supabase.rpc('generate_share_link', { p_group_id: selectedGroupId });
      if (error) throw error;
      const link = `${window.location.origin}/join?token=${token}`;
      const message = `${t("join_group_message", "Join my group")} "${group?.name}" ${t("on_bachatkaro", "on BachatKaro to split bills")}: ${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err: any) {
      console.error("❌ [InviteShare] Failed:", err);
      toast({ title: "Invite Failed", description: err.message || "Could not generate link.", variant: "destructive" });
    }
  };

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* Offline banner */}
      {isOffline && (
        <div className={cn(
          "flex items-center justify-center gap-2 py-2 px-4",
          "bg-warning/10 border-b border-warning/20",
          "text-warning text-xs font-medium"
        )}>
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>{t("offline", "You're offline — changes will sync when reconnected")}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Loading state */}
        {!isAuthReady || isLoadingGroups ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">{t("loading", "Loading your groups…")}</p>
          </div>
        ) : (
          <>
            {/* Header */}
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

            {/* Empty — no group selected */}
            {!selectedGroupId ? (
              <div className={cn(
                "flex flex-col items-center justify-center",
                "py-20 sm:py-28 px-6 text-center",
                "rounded-2xl border-2 border-dashed border-border/50",
                "bg-card/50"
              )}>
                <div className={cn(
                  "w-14 h-14 rounded-2xl mb-5",
                  "bg-muted border border-border/60",
                  "flex items-center justify-center"
                )}>
                  <LayoutGrid className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  {t("split_smarter", "Split bills together")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {t("choose_group_msg", "Select a group above, or create a new one to start tracking shared expenses.")}
                </p>
              </div>

            ) : isHydrating ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">{t("loading_ledger", "Loading group data…")}</p>
              </div>

            ) : (
              <div className="space-y-6 sm:space-y-8">

                {/* ── TOP STATS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total */}
                  <div className={cn("p-4 sm:p-6 rounded-2xl border border-border/60 bg-card", "flex flex-col gap-1")}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("group_total")}
                    </p>
                    <p className="text-xl sm:text-2xl font-semibold text-foreground font-mono tabular-nums truncate">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>

                  {/* Per person */}
                  <div className={cn("p-4 sm:p-6 rounded-2xl border border-border/60 bg-card", "flex flex-col gap-1")}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("fixed_share")}
                    </p>
                    <p className="text-xl sm:text-2xl font-semibold text-foreground font-mono tabular-nums truncate">
                      {formatCurrency(perPerson)}
                    </p>
                  </div>

                  {/* Tools */}
                  <div className="col-span-2 flex items-stretch gap-3">
                    <div className={cn(
                      "flex items-center gap-3 flex-1",
                      "p-3 sm:p-4 rounded-2xl border border-border/60 bg-card"
                    )}>
                      <BillRoulette members={activeMembers} />
                      <Button
                        onClick={() => setTripAdvisorOpen(true)}
                        variant="outline"
                        className={cn(
                          "h-10 px-4 rounded-xl flex-1",
                          "border-border/60 bg-background",
                          "text-muted-foreground hover:text-foreground",
                          "text-xs font-medium",
                          "transition-all duration-150"
                        )}
                      >
                        <Map className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('dashboard.tripPlanner', 'Trip')}</span>
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

                {/* ── MAIN GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                  {/* LEFT: Members + Debts */}
                  <div className="space-y-5">
                    <MemberSection
                      t={t}
                      members={members}
                      activeMembers={activeMembers}
                      isAdmin={isAdmin}
                      memberName={memberName}
                      setMemberName={setMemberName}
                      handleAddMember={handleAddMember}
                      isAddingMember={isAddingMember}
                      onDeleteMember={handleDeleteMember}
                      handleInviteShare={handleInviteShare}
                      cardStyle={cardClass}
                      inputClass={inputClass}
                      gradientClass={gradientClass}
                    />

                    {/* Who Owes Whom */}
                    <div className={cn("rounded-2xl border border-border/60 bg-card overflow-hidden")}>
                      <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <ReceiptIndianRupee className="h-4 w-4" />
                          {t("who_owes_whom")}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {debts.length > 0 ? debts.map((d, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl",
                              "border border-border/50 bg-background",
                              "hover:border-border transition-colors duration-150"
                            )}
                          >
                            {/* From */}
                            <span className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">
                              {d.fromName}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                            {/* To */}
                            <span className="text-xs font-medium text-foreground flex-1 min-w-0 truncate text-center">
                              {d.toName}
                            </span>
                            {/* Amount */}
                            <span className="ml-auto font-semibold font-mono tabular-nums text-sm text-destructive flex-shrink-0">
                              {formatCurrency(d.amount)}
                            </span>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <CheckCircle2 className="h-8 w-8 text-green-500/30 mb-3" />
                            <p className="text-xs text-muted-foreground font-medium">
                              {t("all_settled", "Everyone is settled up.")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Bill Entry + Feed */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* ── Bill Entry ── */}
                    <div className={cn("rounded-2xl border border-border/60 bg-card overflow-hidden")}>
                      {/* Card header */}
                      <div className="px-5 sm:px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {t("new_bill_entry")}
                            </h3>
                            {isVoicePremiumActive && premiumDaysLeft <= 5 && premiumDaysLeft > 0 && (
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                "bg-warning/10 text-warning border border-warning/25"
                              )}>
                                {premiumDaysLeft}d left
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{t("voice_hint")}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Saving indicator — visible on all screen sizes */}
                          {isAutoSaving && (
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                              "bg-background border border-border/60",
                              "text-xs text-muted-foreground"
                            )}>
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              {t("saving_instantly", "Saving…")}
                            </div>
                          )}

                          {/* Voice button */}
                          <button
                            onClick={handleVoiceStart}
                            aria-label={voice.listening ? "Stop recording" : "Start voice entry"}
                            aria-pressed={voice.listening}
                            className={cn(
                              "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full",
                              "flex items-center justify-center",
                              "transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              voice.listening
                                ? "bg-destructive shadow-lg shadow-destructive/20 scale-105"
                                : "bg-primary shadow-md hover:shadow-lg hover:bg-primary/90"
                            )}
                          >
                            {voice.listening && (
                              <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-20 pointer-events-none" />
                            )}
                            {voice.listening
                              ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              : <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5 sm:p-6 space-y-5">

                        {/* Voice transcript */}
                        {(voice.transcript || isParsing) && (
                          <div className={cn(
                            "flex items-start gap-3 p-4 rounded-xl",
                            "bg-muted/50 border border-border/50"
                          )}>
                            <div className="flex-shrink-0 mt-0.5">
                              {isParsing
                                ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                : <span className="block h-2 w-2 rounded-full bg-destructive animate-pulse mt-1" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                                {isParsing ? t("analyzing_command") : t('dashboard.realtime', "Listening")}
                              </p>
                              <p className="text-sm text-foreground italic truncate">"{voice.transcript}"</p>
                            </div>
                          </div>
                        )}

                        {/* Form fields */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t("bill_name")}
                            </Label>
                            <Input
                              value={expenseTitle}
                              onChange={e => setExpenseTitle(e.target.value)}
                              placeholder={t("bill_name_placeholder")}
                              className={cn("h-11 rounded-xl", inputClass)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t("amount")}
                            </Label>
                            <Input
                              type="number"
                              value={expenseAmount}
                              onChange={e => setExpenseAmount(e.target.value)}
                              placeholder={t("amount_placeholder")}
                              className={cn("h-11 rounded-xl font-mono text-base", inputClass)}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t("who_paid")}
                            </Label>
                            <Select value={expensePaidByMemberId} onValueChange={handlePayerChange}>
                              <SelectTrigger className={cn("h-11 rounded-xl font-medium", inputClass)}>
                                <SelectValue placeholder={t("select_member")} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl bg-popover border-border shadow-lg">
                                {activeMembers.map((m: any) => (
                                  <SelectItem key={m.id} value={m.id} className="py-2.5 cursor-pointer">
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t("split_method")}
                            </Label>
                            <Select value={splitType} onValueChange={(v: SplitType) => setSplitType(v)}>
                              <SelectTrigger className={cn("h-11 rounded-xl font-medium", inputClass)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl bg-popover border-border shadow-lg">
                                <SelectItem value="equal" className="py-2.5 cursor-pointer">{t("split_equally")}</SelectItem>
                                <SelectItem value="unequal" className="py-2.5 cursor-pointer">{t("split_unequally")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Unequal splits */}
                        {splitType === "unequal" && (
                          <div className={cn(
                            "p-4 sm:p-5 rounded-xl space-y-4",
                            "bg-muted/40 border border-border/50"
                          )}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <Label className="text-xs font-medium text-muted-foreground">
                                {t("individual_shares")}
                              </Label>
                              {(() => {
                                const sum = Object.values(customAmounts).reduce((acc, val) => acc + Number(val || 0), 0);
                                const isMatch = sum === Number(expenseAmount || 0);
                                return (
                                  <span className={cn(
                                    "text-xs font-mono px-3 py-1 rounded-full border",
                                    isMatch
                                      ? "bg-green-500/10 text-green-600 border-green-500/25 dark:text-green-400"
                                      : "bg-destructive/10 text-destructive border-destructive/25"
                                  )}>
                                    {formatCurrency(convertToPaisa(sum))} / {formatCurrency(convertToPaisa(expenseAmount || 0))}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeMembers.map((m: any) => (
                                <div key={m.id} className="flex items-center justify-between gap-3 bg-background p-3 rounded-lg border border-border/60">
                                  <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">{m.name}</span>
                                  <div className="relative w-32 flex-shrink-0">
                                    <ReceiptIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={customAmounts[m.id] || ""}
                                      onChange={(e) => setCustomAmounts(prev => ({ ...prev, [m.id]: e.target.value }))}
                                      className={cn("h-9 pl-9 rounded-lg text-sm font-mono", inputClass)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submit */}
                        <Button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); addExpense(); }}
                          disabled={isAutoSaving || !expenseAmount || !expensePaidByMemberId}
                          className={cn(
                            "w-full h-12 rounded-xl font-semibold text-sm",
                            "bg-primary text-primary-foreground",
                            "hover:bg-primary/90 active:scale-[0.99]",
                            "transition-all duration-150",
                            "disabled:opacity-40 disabled:cursor-not-allowed"
                          )}
                        >
                          {isAutoSaving
                            ? <Loader2 className="animate-spin h-4 w-4" />
                            : <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 opacity-60" />
                                {t("record_expense")}
                              </span>
                          }
                        </Button>
                      </div>
                    </div>

                    {/* ── Activity Ledger ── */}
                    <div className="space-y-3">
                      {/* Ledger header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <Clock className="h-3.5 w-3.5" />
                          {t("activity_ledger")}
                          {safeExpenses.length > 0 && (
                            <span className="font-normal text-muted-foreground/60">
                              ({safeExpenses.length})
                            </span>
                          )}
                        </div>

                        {expenses.length > 0 && (
                          <div className="flex items-center gap-2">
                            {/* Clear ledger */}
                            <Dialog open={showClearLedgerConfirm} onOpenChange={show => !isBulkDeleting && setShowClearLedgerConfirm(show)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isBulkDeleting}
                                  className={cn(
                                    "h-8 px-3 rounded-lg text-xs font-medium",
                                    "text-muted-foreground hover:text-destructive hover:bg-destructive/8",
                                    "transition-all duration-150"
                                  )}
                                >
                                  {isBulkDeleting
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    : <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  }
                                  {t("clear_ledger")}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className={cn(
                                "p-0 max-w-sm w-[92%] mx-auto overflow-hidden",
                                "rounded-2xl bg-card border border-border/60 shadow-xl"
                              )}>
                                <div className="p-6 border-b border-border/50 bg-muted/30">
                                  <DialogHeader>
                                    <div className="flex items-center gap-3 mb-1">
                                      <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                      </div>
                                      <DialogTitle className="text-base font-semibold text-foreground">
                                        {t('common.confirm', 'Clear all entries?')}
                                      </DialogTitle>
                                    </div>
                                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed ml-12">
                                      {t("clear_ledger_confirm_desc")}
                                    </DialogDescription>
                                  </DialogHeader>
                                </div>
                                <DialogFooter className="flex gap-2 p-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowClearLedgerConfirm(false)}
                                    className="flex-1 h-10 rounded-xl text-sm font-medium"
                                  >
                                    {t("common.cancel", "Cancel")}
                                  </Button>
                                  <Button
                                    onClick={handleBulkDelete}
                                    className="flex-1 h-10 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("yes_clear", "Clear all")}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Export */}
                            <div className="border border-border/60 rounded-lg overflow-hidden bg-background">
                              <ExportMenu
                                data={expenses.map((exp: any) => {
                                  const payerName = members.find((m: any) => m.id === exp.paid_by_member_id)?.name || exp.paid_by;
                                  return {
                                    date: exp.created_at, category: "Group Expense",
                                    amount: exp.amount, type: 'expense',
                                    payment_mode: `Paid by ${payerName}`,
                                    note: `Bill: ${exp.title} (Split: ${exp.split_type})`
                                  };
                                })}
                                reportTitle={`${groups.find((g: any) => g.id === selectedGroupId)?.name || 'Group'} Expenses`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expense rows */}
                      <div className="space-y-2">
                        {paginatedExpenses.length > 0 ? (
                          paginatedExpenses.map((exp: any) => (
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
                              intent={intentMap[exp.idempotency_key]}
                            />
                          ))
                        ) : (
                          <div className={cn(
                            "flex flex-col items-center justify-center py-14 text-center",
                            "rounded-xl border-2 border-dashed border-border/40 bg-card/50"
                          )}>
                            <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center mb-3">
                              <Clock className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t("recentExpenses.timelineEmpty", "No expenses recorded yet.")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-9 px-4 rounded-xl text-xs font-medium"
                          >
                            {t('common.prev', 'Previous')}
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 px-4 rounded-xl text-xs font-medium"
                          >
                            {t('common.next', 'Next')}
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

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editDialogExp} onOpenChange={(open) => !open && setEditDialogExp(null)}>
        <DialogContent className="p-0 max-w-sm w-[92%] mx-auto rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-muted/30">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted border border-border/60 flex items-center justify-center">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Update Entry
                </DialogTitle>
              </div>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Title</Label>
              <Input
                value={editTempTitle}
                onChange={e => setEditTempTitle(e.target.value)}
                placeholder={t("edit_bill_placeholder")}
                className={cn("h-11 rounded-xl", inputClass)}
                autoFocus
              />
            </div>
            <Button
              onClick={handleUpdateExpenseTitle}
              disabled={isUpdating || !editTempTitle.trim()}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : t("save_changes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Premium Modal ── */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="p-0 max-w-sm w-[92%] mx-auto rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
          <div className="p-6 text-center border-b border-border/50 bg-muted/30">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground mb-1">
              {t("unlock_magic_voice", "Unlock Voice Features")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("premium_trial_ended")}
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4">
            <ul className="space-y-3">
              {[
                "Edit bills with voice",
                "Delete instantly via mic",
                "Priority AI processing"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500/50 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => { setShowPremiumModal(false); navigate("/?checkout=true"); }}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("upgrade_now_price")}
            </Button>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {t("maybe_later")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupExpenses;
