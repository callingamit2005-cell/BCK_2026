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
  const badgeColor = badgeLabel === "Verified" 
    ? "bg-fintech-graphite/5 border-border/40 text-fintech-graphite" 
    : "bg-background border-border/30 text-fintech-graphite-muted";

  return (
    <div className="group rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 transition-all duration-700 ease-butter-soft active:scale-[0.99] relative overflow-hidden bg-surface border border-border/40 hover:border-border/80 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] group/row">
      <div className="flex items-center justify-between relative z-10 gap-3 sm:gap-5">
        <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-5">
          <div className="p-2.5 sm:p-3.5 bg-background rounded-xl sm:rounded-2xl border border-border/60 shadow-inner group-hover/row:scale-105 transition-transform duration-700 shrink-0">
             {getPaymentIcon(expense.payment_mode, expense.type)}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-1 sm:mb-1.5 overflow-hidden">
              <span className="text-[14px] sm:text-[15px] font-black uppercase tracking-tight text-[#1a1a1a] truncate">
                {expense.category}
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] text-fintech-graphite-muted font-black uppercase tracking-[0.1em] bg-background px-2 py-0.5 rounded border border-border/40 whitespace-nowrap shrink-0">
                {isValidDate(expense.date) ? format(safeDate(expense.date)!, "dd MMM") : "TBD"}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] border transition-all duration-500 whitespace-nowrap shrink-0", badgeColor)}>
                {badgeLabel}
              </span>
            </div>
            <div className="text-[12px] sm:text-[13px] text-[#1a1a1a] font-bold truncate opacity-70 leading-tight">
              {expense.sender || "Unknown Payee"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-auto">
          <div className={cn("text-lg sm:text-xl font-black font-mono tracking-tighter leading-none tabular-nums truncate max-w-[100px] sm:max-w-none", isIncome ? 'text-fintech-emerald-dark' : 'text-[#1a1a1a]')}>
            {isIncome ? "+" : "-"}{formatCurrency(expense.amount)}
          </div>
          <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              onClick={() => onEdit(expense)}
              className="h-10 w-10 rounded-xl bg-background border border-border/40 text-fintech-graphite-muted hover:bg-[#1a1a1a] hover:text-white shadow-sm transition-all duration-300"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              onClick={() => onDelete(expense.id)}
              className="h-10 w-10 rounded-xl bg-background border border-border/40 text-fintech-graphite-muted hover:text-rose-500 hover:bg-rose-50 shadow-sm transition-all duration-300"
            >
              <Trash2 className="h-4 w-4" />
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
  const clearWhiteText = "text-foreground";
  const glassPanel = "bg-background border border-border";

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
    <Card className={cn(premiumSurface, "border-border/40 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-700 ease-butter-soft hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden relative group")}>
      <CardHeader className="p-6 sm:p-10 pb-5 sm:pb-6 border-b border-border/40 bg-background/50 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#F3F4F6] border border-border/60 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 group-hover:scale-110">
              <RefreshCw className={cn("h-5 w-5 text-[#DC2626]", loading && "animate-spin")} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className={cn("text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none truncate", clearWhiteText)}>
                {t('dashboard.recentTransactions', 'Verified Ledger')}
              </CardTitle>
              <p className="text-[10px] sm:text-[11px] text-fintech-graphite-muted font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] mt-1.5 opacity-60 leading-none truncate">
                {loading ? t('dashboard.syncing', 'Syncing...') : t('dashboard.realtime', 'Real-time Cycle')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ExportMenu data={filteredExpenses} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => void handleRescan()}
              disabled={isScanning || !canRescanSms}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl border-border/60 bg-background hover:bg-[#1a1a1a] hover:text-white transition-all duration-500 active:scale-95 shadow-sm"
              title="Rescan SMS"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {scanProgress && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="h-1 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-foreground opacity-20 animate-pulse w-full" />
            </div>
            <p className="text-[10px] font-bold text-text-secondary mt-2 uppercase tracking-widest text-center">
              Processing Native Bridge
            </p>
          </div>
        )}

        {retentionMessage && (
           <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border">
             <AlertTriangle className="h-3 w-3 text-text-secondary" />
             <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
               {retentionMessage}
             </span>
           </div>
        )}
      </CardHeader>

      <CardContent className="p-8 relative z-10">
        {loading && filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-16 h-16 border-[4px] border-[#111111]/5 border-t-fintech-emerald-dark rounded-full animate-spin shadow-sm" />
            <p className="text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.3em] animate-pulse">
              Analyzing Financial Data
            </p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-24 h-24 rounded-[32px] bg-background border border-border/60 shadow-inner flex items-center justify-center mb-8">
              <Sparkles className="h-10 w-10 text-fintech-graphite-muted opacity-40" />
            </div>
            <h3 className="text-2xl font-black text-[#1a1a1a] mb-4 uppercase tracking-tighter">Timeline Empty</h3>
            <p className="text-[11px] font-black text-fintech-graphite-muted uppercase tracking-[0.25em] max-w-[280px] opacity-60">
              Your financial timeline will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3">
              {paginatedExpenses.map((expense) => {
                if (confirmDeleteId === expense.id) {
                   return (
                    <div key={expense.id} className="rounded-2xl p-6 bg-background border border-border animate-in zoom-in-95">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-text-secondary" />
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">Delete record?</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-9 px-4 rounded-xl text-text-secondary font-bold uppercase text-[10px]"
                          >
                            Abort
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleDeleteConfirmed(expense.id)}
                            className="h-9 px-4 bg-foreground text-surface hover:bg-foreground/90 font-bold rounded-xl text-[10px] uppercase"
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Amount (₹)</p>
                        <Input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          placeholder="0.00"
                          className="h-14 rounded-xl border-border bg-surface font-bold text-xl text-foreground placeholder:text-text-muted focus:border-foreground"
                        />
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add details"
                          className="h-14 rounded-xl border-border bg-surface text-foreground font-medium placeholder:text-text-muted focus:border-foreground"
                        />
                        <div className="flex justify-end gap-3 pt-1">
                          <Button
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="h-12 rounded-xl text-text-secondary hover:text-foreground border border-border font-bold uppercase text-[10px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="h-12 px-8 rounded-xl text-surface bg-foreground hover:bg-foreground/90 font-bold shadow-lg uppercase text-[10px] tracking-widest"
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-border">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                  Page <span className="text-foreground">{currentPage}</span> / <span className="text-foreground">{totalPages}</span>
                  <span className="ml-3 text-text-muted">
                    ({totalItems} items — {filterScopeLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-11 px-8 rounded-2xl border border-border/40 bg-background hover:bg-[#1a1a1a] hover:text-white text-fintech-graphite-muted font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-sm"
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-11 px-8 rounded-2xl border border-border/40 bg-background hover:bg-[#1a1a1a] hover:text-white text-fintech-graphite-muted font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-sm"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className={cn("max-w-md w-full rounded-[24px] p-8 bg-surface border border-border shadow-2xl")}>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-foreground/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Wipe All Data?</h3>
                  <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest leading-relaxed">
                    This will permanently delete ALL data from this device and the cloud. This action is irreversible.
                  </p>
                </div>
                <div className="flex w-full gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 h-14 rounded-xl text-text-secondary font-bold uppercase tracking-widest border border-border hover:bg-background"
                  >
                    Abort
                  </Button>
                  <Button
                    onClick={() => void handleClearAllConfirmed()}
                    className="flex-1 h-14 rounded-xl bg-foreground text-surface hover:bg-foreground/90 font-bold uppercase tracking-widest"
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
