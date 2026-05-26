import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { forensicEngine } from "@/test/forensic/validationSuite";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Wallet,
  CreditCard,
  Banknote,
  Pencil,
  Check,
  Loader2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatCurrency, convertToPaisa, convertToRupees } from "@/utils/currencyFormatter";
import { isValidDate, safeDate } from "@/utils/dateFilters";
import ExportMenu from "@/components/dashboard/ExportMenu";
import {
  clearNativeTransactions,
  deleteNativeTransaction,
  scanHistoricalSms,
  upsertNativeTransaction,
} from "../../integrations/smsBridge";
import { saveAndSync } from "@/integrations/sqliteService";

interface Expense {
  id: string;
  amount: number;
  category: string;
  type?: string;
  note?: string;
  sender?: string;
  payment_mode: string;
  date: string;
  smsHash?: string | null;
  source?: string;
  origin?: string;
  direction?: "debit" | "credit";
  idempotencyKey?: string | null;
}

interface RecentExpensesProps {
  expenses: Expense[];
  loading: boolean;
  userId?: string;
  canRescanSms?: boolean;
  retentionMessage?: string;
  dateFilter?: any;
  onDelete?: (id: string) => void | Promise<void>;
  onClearAll?: () => void | Promise<void>;
}

const ITEMS_PER_PAGE = 7;

const getPaymentIcon = (mode: string, type: string = 'expense') => {
  if (type === 'income') return <ArrowDownLeft className="h-5 w-5 text-success" />;
  switch (mode?.toLowerCase()) {
    case 'cash':
      return <Banknote className="h-5 w-5 text-text-secondary" />;
    case 'card':
      return <CreditCard className="h-5 w-5 text-text-secondary" />;
    case 'upi':
    case 'gpay':
    case 'paytm':
    case 'phonepe':
      return <ArrowUpRight className="h-5 w-5 text-text-secondary" />;
    default:
      return <Wallet className="h-5 w-5 text-text-secondary" />;
  }
};

const MemoizedRecentExpenseRow = memo(({ expense, formatCurrency, onEdit, onDelete }: any) => {
  const isIncome = expense.type === 'income' || expense.direction === 'credit';
  const badgeLabel = (expense.origin === 'native-transaction' || !!expense.smsHash) ? "Verified" : "Manual";
  const badgeColor = badgeLabel === "Verified" ? "bg-ai-accent/10 border-ai-accent/20 text-ai-accent" : "bg-white/5 border-white/10 text-text-secondary";

  return (
    <div className="group rounded-[24px] p-5 transition-all duration-300 active:scale-[0.99] relative overflow-hidden glass-v2 bg-surface hover:bg-white/5">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-black uppercase tracking-tight text-foreground">
              {expense.category}
            </span>
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-widest">
              {isValidDate(expense.date) ? format(safeDate(expense.date)!, "dd MMM, hh:mm a") : "Date Unavailable"}
            </span>
            <span className={cn("px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border", badgeColor)}>
              {badgeLabel}
            </span>
          </div>
          <div className="text-[11px] text-foreground font-medium truncate">
            {expense.sender || "Unknown payee"}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-text-secondary font-medium uppercase tracking-widest">
            <span className="flex items-center gap-1">
              {getPaymentIcon(expense.payment_mode, expense.type)}
              {expense.payment_mode || (isIncome ? "Bank Credit" : "App")}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className={cn("text-lg font-black font-mono tracking-tighter", isIncome ? 'text-success' : 'text-foreground')}>
            {isIncome ? "+" : "-"}{formatCurrency(expense.amount)}
          </div>
          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              onClick={() => onEdit(expense)}
              className="h-8 w-8 rounded-lg bg-surface border border-white/10 text-text-secondary hover:bg-white/10 hover:text-foreground shadow-sm"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              onClick={() => onDelete(expense.id)}
              className="h-8 w-8 rounded-lg bg-surface border border-white/10 text-text-secondary hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 shadow-sm"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 🛡️ [DEEP_COMPARATOR] Deterministic structural equality check.
  // Prevents array recreation from causing O(N) child row rerenders.
  return (
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.note === nextProps.expense.note &&
    prevProps.expense.category === nextProps.expense.category &&
    prevProps.expense.date === nextProps.expense.date &&
    prevProps.expense.payment_mode === nextProps.expense.payment_mode &&
    prevProps.expense.sender === nextProps.expense.sender &&
    prevProps.expense.type === nextProps.expense.type
  );
});

const RecentExpenses = React.memo(({
  expenses,
  loading,
  userId,
  canRescanSms = true,
  retentionMessage,
  dateFilter,
  onDelete,
  onClearAll,
}: RecentExpensesProps) => {
  if (process.env.NODE_ENV === 'development') {
    forensicEngine.trackRender('RecentExpenses');
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number } | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout>();

  // 🛡️ [CALLBACK_STABILIZATION] Prevent row rerender storms
  const handleEditInitiate = useCallback((exp: any) => {
    setEditingId(exp.id);
    setEditAmount(convertToRupees(exp.amount).toString());
    setEditNote(exp.note || "");
  }, []);

  const handleDeleteInitiate = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  // 🛡️ [PAGINATION_STATE_HARDENING]
  // Force reset to Page 1 on major context shifts (New User or Filter change).
  useEffect(() => {
    setCurrentPage(1);
  }, [userId, dateFilter?.preset]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const premiumSurface = "bg-surface border border-border shadow-sm rounded-[24px] overflow-hidden";
  const clearWhiteText = "text-white";
  const glassPanel = "bg-white/5 border border-white/10 backdrop-blur-md";

  const filteredExpenses = useMemo(
    () => [...expenses].sort((a, b) => {
      const dateA = safeDate(a.date)?.getTime() || 0;
      const dateB = safeDate(b.date)?.getTime() || 0;
      return dateB - dateA;
    }),
    [expenses],
  );

  const totalItems = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 🛡️ [SAFE_CLAMPING_LOGIC]
  // Only clamp if the current page is strictly invalid and data has finished loading.
  // This prevents the 'Page 4/4' trap during transient hydration (0 -> 5 -> 23 items).
  useEffect(() => {
    if (!loading && totalItems > 0 && currentPage > totalPages) {
      console.log(`[PAGINATION_TRACE] Clamping page ${currentPage} -> ${totalPages}`);
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, loading, totalItems]);

  const filterScopeLabel = useMemo(() => {
    if (!dateFilter) return "ALL TIME";
    const preset = dateFilter.preset || "custom";
    return preset.replace("_", " ").toUpperCase();
  }, [dateFilter]);

  const getUpdateTarget = (expense?: Expense) =>
    expense?.origin === "cloud-expense" ? "expenses" : "transactions";

  const shouldTouchNative = (expense?: Expense) =>
    expense?.source === "sms" || expense?.origin === "native-transaction" || Boolean(expense?.smsHash);

  const isUuid = (value?: string | null) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

  const handleSave = async () => {
    if (!editingId) return;

    const expense = expenses.find((item) => item.id === editingId);
    if (!expense) return;

    const amountInPaisa = convertToPaisa(editAmount);
    setIsSaving(true);

    try {
      console.log(`[FORENSIC_EDIT_START] ID: ${editingId}, Target: ${getUpdateTarget(expense)}`);
      
      const payload = {
        id: editingId,
        user_id: userId,
        amount: amountInPaisa,
        description: editNote.trim() || expense.sender || expense.category,
        category: expense.category,
        payment_mode: expense.payment_mode,
        date: expense.date,
        // 🛡️ [IDENTITY_PRESERVATION]
        // Preserve original unique identifiers and metadata during edits.
        // This ensures the conflict target 'id' handles the update correctly.
        sms_hash: expense.smsHash || null,
        idempotency_key: expense.idempotencyKey || null,
        created_at: (expense as any).created_at || expense.date,
        updated_at: new Date().toISOString()
      };

      // 🛡️ [CANONICAL_EDIT_PIPELINE]
      // Every edit must flow through saveAndSync to ensure cross-platform persistence.
      await saveAndSync(getUpdateTarget(expense), payload, 'UPSERT');

      // Sync to native bridge if it's an SMS/Native record
      if (shouldTouchNative(expense) && expense?.smsHash) {
        await upsertNativeTransaction({
          id: expense.id,
          smsHash: expense.smsHash,
          amount: amountInPaisa,
          type: expense.type ?? null,
          sender: expense.sender ?? null,
          timestamp: expense.date ? new Date(expense.date).getTime() : null,
          userId,
        });
      }

      await queryClient.invalidateQueries();
      setEditingId(null);
      toast({ title: t('dashboard.transactionUpdated', 'Transaction updated!') });
    } catch (error) {
      console.error("[FORENSIC_EDIT_FAIL]", error);
      toast({ title: t('common.error', 'Error'), description: t('dashboard.failedToUpdate', 'Failed to update transaction'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      setConfirmDeleteId(null);
    }
  };

  const handleClearAllConfirmed = async () => {
    if (onClearAll) {
      await onClearAll();
      setConfirmClearAll(false);
    }
  };

  const handleRescan = async () => {
    setIsScanning(true);
    setScanProgress(null);
    try {
      // Pass a callback to receive scan updates from the bridge
      const scanRes = await scanHistoricalSms(60); 
      
      // Update UI with result
      if (scanRes) {
        setScanProgress({ scanned: scanRes.scanned ?? 0, total: scanRes.scanned ?? 0 });
      }

      // Re-trigger feeder pull manually to pick up new SMS into SQLite
      window.dispatchEvent(new Event('newTransaction'));

      toast({ 
        title: "Scan Complete! 🚀", 
        description: `Successfully processed ${scanRes.scanned} financial messages.` 
      });
    } catch (err) {
      toast({ title: "Scan Failed", variant: "destructive" });
    } finally {
      // Clear progress after short delay
      setTimeout(() => setScanProgress(null), 3000);
      setIsScanning(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden rounded-[24px] border-border bg-surface shadow-sm relative", premiumSurface)}>
      <CardHeader className="relative z-10 border-b border-white/5 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <RefreshCw className={cn("h-5 w-5 text-text-muted", loading && "animate-spin")} />
            </div>
            <div>
              <CardTitle className={cn("text-xl font-bold tracking-tight", clearWhiteText)}>
                {t('dashboard.recentTransactions', 'Recent Transactions')}
              </CardTitle>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">
                {loading ? t('dashboard.syncing', 'Syncing Live...') : t('dashboard.realtime', 'Real-time Unified Ledger')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExportMenu data={filteredExpenses} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => void handleRescan()}
              disabled={isScanning || !canRescanSms}
              className="h-10 w-10 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
              title="Rescan SMS"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 opacity-40" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setConfirmClearAll(true)}
              className="h-10 w-10 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white"
              title="Clear All"
            >
              <Trash2 className="h-4 w-4 opacity-40" />
            </Button>
          </div>
        </div>

        {scanProgress && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white opacity-40 animate-pulse w-full" />
            </div>
            <p className="text-[8px] font-bold text-white/40 mt-2 uppercase tracking-widest text-center">
              Processing Native Bridge Engine
            </p>
          </div>
        )}

        {retentionMessage && (
           <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
             <AlertTriangle className="h-3 w-3 text-white/40" />
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
               {retentionMessage}
             </span>
           </div>
        )}
      </CardHeader>

      <CardContent className="p-6 relative z-10">
        {loading && filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] animate-pulse">
              Hydrating Ledger
            </p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-white/10" />
            </div>
            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">Zero Records</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest max-w-[240px]">
              No transactions detected for the selected period.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3">
              {paginatedExpenses.map((expense) => {
                if (confirmDeleteId === expense.id) {
                   return (
                    <div key={expense.id} className="rounded-2xl p-6 bg-white/5 border border-white/10 animate-in zoom-in-95">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-white/40" />
                          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Nuke record?</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-9 px-4 rounded-xl text-white/40 font-bold uppercase text-[10px]"
                          >
                            Abort
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleDeleteConfirmed(expense.id)}
                            className="h-9 px-4 bg-white text-background hover:bg-white/90 font-black rounded-xl text-[10px] uppercase"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                   );
                }

                if (editingId === expense.id) {
                   return (
                    <div key={expense.id} className={cn("rounded-2xl p-4 transition-all duration-300 relative overflow-hidden", glassPanel)}>
                      <div className="space-y-3 animate-in slide-in-from-top-2 relative z-10">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Amount (₹)</p>
                        <Input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          placeholder="0.00"
                          className="h-14 rounded-xl border-white/10 bg-black/40 font-black text-xl text-white placeholder:text-white/10 focus:border-white/20"
                        />
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add details"
                          className="h-14 rounded-xl border-white/10 bg-black/40 text-white font-medium placeholder:text-white/10 focus:border-white/20"
                        />
                        <div className="flex justify-end gap-3 pt-1">
                          <Button
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 border border-white/10 font-bold uppercase text-[10px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="h-12 px-8 rounded-xl text-background bg-white hover:bg-white/90 font-black shadow-lg uppercase text-[10px] tracking-widest"
                          >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Commit'}
                          </Button>
                        </div>
                      </div>
                    </div>
                   );
                }

                return (
                  <MemoizedRecentExpenseRow 
                    key={expense.id}
                    expense={expense}
                    glassPanel={glassPanel}
                    clearWhiteText={clearWhiteText}
                    formatCurrency={formatCurrency}
                    onEdit={handleEditInitiate}
                    onDelete={handleDeleteInitiate}
                  />
                );
              })}
            </div>

            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-white/5">
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
                  Page <span className="text-white/60">{currentPage}</span> / <span className="text-white/60">{totalPages}</span>
                  <span className="ml-3 text-white/10">
                    ({totalItems} items — {filterScopeLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-10 px-4 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-widest"
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-10 px-4 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-widest"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {confirmClearAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className={cn("max-w-md w-full rounded-[24px] p-8 bg-surface border border-white/10 shadow-2xl")}>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-white/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Nuclear Option</h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                    This will permanently delete ALL data from this device and the cloud. This action is irreversible.
                  </p>
                </div>
                <div className="flex w-full gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 h-14 rounded-xl text-white/40 font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5"
                  >
                    Abort
                  </Button>
                  <Button
                    onClick={() => void handleClearAllConfirmed()}
                    className="flex-1 h-14 rounded-xl bg-white text-background hover:bg-white/90 font-black uppercase tracking-widest"
                  >
                    Confirm Wipe
                  </Button>
                </div>
              </div>
           </div>
        </div>
      )}
    </Card>
  );
});

export default RecentExpenses;
