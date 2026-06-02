import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { forensicEngine } from "@/test/forensic/validationSuite";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Wallet,
  CreditCard,
  Banknote,
  Pencil,
  Loader2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  RefreshCw,
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

const getPaymentIcon = (mode: string, type: string = "expense") => {
  if (type === "income") return <ArrowDownLeft className="h-5 w-5 text-[#16A34A]" />;
  switch (mode?.toLowerCase()) {
    case "cash":
      return <Banknote className="h-5 w-5 text-text-secondary" />;
    case "card":
      return <CreditCard className="h-5 w-5 text-text-secondary" />;
    case "upi":
    case "gpay":
    case "paytm":
    case "phonepe":
      return <ArrowUpRight className="h-5 w-5 text-text-secondary" />;
    default:
      return <Wallet className="h-5 w-5 text-text-secondary" />;
  }
};

const MemoizedRecentExpenseRow = memo(
  ({ expense, formatCurrency, onEdit, onDelete }: any) => {
    const { t } = useLanguage();
    const isIncome =
      expense.type === "income" || expense.direction === "credit";
    const badgeLabel =
      expense.origin === "native-transaction" || !!expense.smsHash
        ? t("common.verified", "Verified")
        : t("common.manual", "Manual");
    const badgeColor =
      expense.origin === "native-transaction" || !!expense.smsHash
        ? "bg-foreground/5 border-border/40 text-foreground"
        : "bg-background border-border/30 text-text-muted";

    return (
      <div className="group rounded-2xl p-4 transition-all duration-300 relative overflow-hidden bg-surface border border-border/40 hover:border-border/70 shadow-sm group/row">
        <div className="flex items-center justify-between relative z-10 gap-3 sm:gap-5">
          {/* Left: Icon + Meta */}
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="p-3 bg-background rounded-xl border border-border/60 shadow-inner shrink-0">
              {getPaymentIcon(expense.payment_mode, expense.type)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 overflow-hidden">
                <span className="text-sm font-semibold text-foreground truncate">
                  {expense.category}
                </span>
                <span className="inline-block text-xs text-text-muted font-medium bg-background px-2 py-0.5 rounded border border-border/40 whitespace-nowrap shrink-0">
                  {isValidDate(expense.date)
                    ? format(safeDate(expense.date)!, "dd MMM")
                    : "—"}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap shrink-0",
                    badgeColor
                  )}
                >
                  {badgeLabel}
                </span>
              </div>
              <div className="text-xs text-text-secondary truncate leading-tight">
                {expense.sender || "Unknown payee"}
              </div>
            </div>
          </div>

          {/* Right: Amount + Actions */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0 ml-auto">
            {/* Amount — color-coded: green for income, red for expense */}
            <div
              className={cn(
                "text-base sm:text-lg font-bold font-mono tracking-tight leading-none tabular-nums",
                isIncome ? "text-[#16A34A]" : "text-[#DC2626]"
              )}
            >
              {isIncome ? "+" : "−"}{formatCurrency(expense.amount)}
            </div>
            <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={() => onEdit(expense)}
                className="h-9 w-9 rounded-xl bg-background border border-border/40 text-text-muted hover:text-[#2563EB] hover:bg-[#2563EB]/5 shadow-sm transition-all duration-200 active:scale-95"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={() => onDelete(expense.id)}
                className="h-9 w-9 rounded-xl bg-background border border-border/40 text-text-muted hover:text-[#DC2626] hover:bg-[#DC2626]/5 shadow-sm transition-all duration-200 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.note === nextProps.expense.note &&
    prevProps.expense.category === nextProps.expense.category &&
    prevProps.expense.date === nextProps.expense.date &&
    prevProps.expense.payment_mode === nextProps.expense.payment_mode &&
    prevProps.expense.sender === nextProps.expense.sender &&
    prevProps.expense.type === nextProps.expense.type
);

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
  if (process.env.NODE_ENV === "development") {
    forensicEngine.trackRender("RecentExpenses");
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scanProgress, setScanProgress] = useState<{
    scanned: number;
    total: number;
  } | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleEditInitiate = useCallback((exp: any) => {
    setEditingId(exp.id);
    setEditAmount(convertToRupees(exp.amount).toString());
    setEditNote(exp.note || "");
  }, []);

  const handleDeleteInitiate = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [userId, dateFilter?.preset]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const filteredExpenses = useMemo(() => {
    return expenses
      .map((e) => ({ ...e, _ts: safeDate(e.date)?.getTime() || 0 }))
      .sort((a, b) => b._ts - a._ts);
  }, [expenses]);

  const totalItems = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (!loading && totalItems > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, loading, totalItems]);

  const filterScopeLabel = useMemo(() => {
    if (!dateFilter) return "All time";
    const preset = dateFilter.preset || "custom";
    return preset.replace("_", " ");
  }, [dateFilter]);

  const getUpdateTarget = (expense?: Expense) =>
    expense?.origin === "cloud-expense" ? "expenses" : "transactions";

  const shouldTouchNative = (expense?: Expense) =>
    expense?.source === "sms" ||
    expense?.origin === "native-transaction" ||
    Boolean(expense?.smsHash);

  const isUuid = (value?: string | null) =>
    Boolean(
      value &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        )
    );

  const handleSave = async () => {
    if (!editingId) return;
    const expense = expenses.find((item) => item.id === editingId);
    if (!expense) return;

    const amountInPaisa = convertToPaisa(editAmount);
    setIsSaving(true);

    try {
      const payload = {
        id: editingId,
        user_id: userId,
        amount: amountInPaisa,
        description:
          editNote.trim() || expense.sender || expense.category,
        category: expense.category,
        payment_mode: expense.payment_mode,
        date: expense.date,
        canonical_key: (expense as any).canonicalKey || null,
        sms_hash: expense.smsHash || null,
        idempotency_key: (expense as any).idempotencyKey || null,
        created_at: (expense as any).created_at || expense.date,
        updated_at: new Date().toISOString(),
      };

      await saveAndSync(getUpdateTarget(expense), payload, "UPDATE");

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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ledger-transactions", userId] }),
        queryClient.invalidateQueries({ queryKey: ["salaries", userId] }),
        queryClient.invalidateQueries({ queryKey: ["budgets", userId] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-snapshot", userId] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      
      setEditingId(null);
      toast({ title: t("dashboard.transactionUpdated", "Transaction updated") });
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: t("dashboard.failedToUpdate", "Failed to update transaction"),
        variant: "destructive",
      });
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
      const scanRes = await scanHistoricalSms(60);
      if (scanRes) {
        setScanProgress({
          scanned: scanRes.scanned ?? 0,
          total: scanRes.scanned ?? 0,
        });
      }
      window.dispatchEvent(new Event("newTransaction"));
      toast({
        title: t("emi.opSuccess", "Scan complete"),
        description: `Processed ${scanRes.scanned} financial messages.`,
      });
    } catch (err) {
      toast({
        title: t("common.error", "Scan failed"),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setScanProgress(null), 3000);
      setIsScanning(false);
    }
  };

  return (
    <Card className="bg-surface border border-border/40 shadow-sm rounded-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 sm:p-7 pb-5 border-b border-border/40 bg-background/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
              <RefreshCw className={cn("h-4 w-4 text-foreground/60", loading && "animate-spin")} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold text-foreground leading-tight">
                {t("dashboard.recentTransactions", "Recent Transactions")}
              </CardTitle>
              <p className="text-xs text-text-muted mt-0.5">
                {loading
                  ? t("dashboard.syncing", "Syncing…")
                  : t("dashboard.realtime", "Verified ledger")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <ExportMenu data={filteredExpenses} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => void handleRescan()}
              disabled={isScanning || !canRescanSms}
              className="h-9 w-9 rounded-xl border-border/50 bg-background hover:bg-foreground hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
              title={t("common.update", "Rescan SMS")}
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setConfirmClearAll(true)}
              className="h-9 w-9 rounded-xl border-border/50 bg-background hover:bg-[#DC2626] hover:text-white hover:border-[#DC2626] transition-all duration-200 active:scale-95 shadow-sm"
              title={t("common.delete", "Clear all")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scan progress bar */}
        {scanProgress && (
          <div className="mt-3 animate-in fade-in">
            <div className="h-1 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] opacity-50 animate-pulse w-full" />
            </div>
            <p className="text-xs text-text-muted mt-1.5 text-center">
              {t("common.syncing", "Processing SMS history…")}
            </p>
          </div>
        )}

        {/* Retention notice */}
        {retentionMessage && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
            <AlertTriangle className="h-3 w-3 text-[#D97706] shrink-0" />
            <span className="text-xs text-text-secondary">
              {retentionMessage}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-7">
        {/* Loading state */}
        {loading && filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-10 h-10 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-xs text-text-muted">
              {t("common.loading", "Loading transactions…")}
            </p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-background border border-border/60 shadow-inner flex items-center justify-center mb-5">
              <Sparkles className="h-7 w-7 text-text-muted opacity-30" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t("recentExpenses.timelineEmpty", "No transactions yet")}
            </h3>
            <p className="text-sm text-text-muted max-w-[260px] leading-relaxed">
              {t(
                "recentExpenses.addFirst",
                "Your financial activity will appear here."
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3">
              {paginatedExpenses.map((expense) => {
                // Inline delete confirm
                if (confirmDeleteId === expense.id) {
                  return (
                    <div
                      key={expense.id}
                      className="rounded-2xl p-5 bg-background border border-border animate-in zoom-in-95"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0" />
                          <p className="text-sm font-medium text-foreground">
                            {t("common.confirm", "Delete this record?")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-9 px-4 rounded-xl text-text-secondary font-medium text-xs border border-border"
                          >
                            {t("common.cancel", "Cancel")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              void handleDeleteConfirmed(expense.id)
                            }
                            className="h-9 px-4 bg-[#DC2626] text-white hover:bg-[#DC2626]/90 font-medium rounded-xl text-xs"
                          >
                            {t("common.confirm", "Delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Inline edit form
                if (editingId === expense.id) {
                  return (
                    <div
                      key={expense.id}
                      className="rounded-2xl p-5 bg-background border border-border/40 transition-all duration-200"
                    >
                      <div className="space-y-3 animate-in slide-in-from-top-2">
                        <p className="text-xs font-medium text-text-muted">
                          Amount (₹)
                        </p>
                        <Input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          placeholder="0.00"
                          className="h-12 rounded-xl border-border bg-surface font-bold text-lg text-foreground placeholder:text-text-muted focus:border-foreground"
                        />
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder={t(
                            "dashboard.emiNamePlaceholder",
                            "Add a note"
                          )}
                          className="h-12 rounded-xl border-border bg-surface text-foreground placeholder:text-text-muted focus:border-foreground"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="h-10 rounded-xl text-text-secondary hover:text-foreground border border-border font-medium text-xs"
                          >
                            {t("common.cancel", "Cancel")}
                          </Button>
                          <Button
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="h-10 px-6 rounded-xl text-white bg-foreground hover:bg-foreground/90 font-medium shadow-sm text-xs"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("common.save", "Save changes")
                            )}
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
                    formatCurrency={formatCurrency}
                    onEdit={handleEditInitiate}
                    onDelete={handleDeleteInitiate}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t border-border">
                <div className="text-xs text-text-muted">
                  Page <span className="text-foreground font-medium">{currentPage}</span> of{" "}
                  <span className="text-foreground font-medium">{totalPages}</span>
                  <span className="ml-2">
                    · {totalItems} {t("common.items", "items")} · {filterScopeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-9 px-5 rounded-xl border border-border/40 bg-background text-text-muted font-medium text-xs transition-all duration-200 disabled:opacity-30"
                  >
                    {t("common.prev", "Previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="h-9 px-5 rounded-xl border border-border/40 bg-background text-text-muted font-medium text-xs transition-all duration-200 disabled:opacity-30"
                  >
                    {t("common.next", "Next")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Clear-all confirmation overlay */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-sm w-full rounded-2xl p-8 bg-surface border border-border/40 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1.5">
                  {t("common.confirmWipe", "Delete all transactions?")}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  This will permanently remove all transactions from this device and the cloud. This cannot be undone.
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 h-11 rounded-xl text-text-muted font-medium text-sm border border-border/40 hover:bg-background"
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  onClick={() => void handleClearAllConfirmed()}
                  className="flex-1 h-11 rounded-xl bg-[#DC2626] text-white font-medium text-sm hover:bg-[#DC2626]/90 active:scale-95"
                >
                  {t("common.confirm", "Delete all")}
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
