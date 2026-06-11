// src/features/split-expense/SettlementSummary.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// 🛡️ SECURITY: Enhanced Read-Only mode for non-admins with visual cues.

import React, { useMemo, useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, Zap, ArrowRightLeft, Lock, Smartphone, AlertCircle, RefreshCw, Loader2, Search, ChevronDown, ChevronUp, X, Users, Copy, Share2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { SmartPaySheet, PaymentTarget } from '@/components/dashboard/SmartPaySheet';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { paymentOrchestrator } from '@/services/paymentOrchestrator';
import { getDB } from '@/integrations/sqlite';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface Member {
  id: string;
  full_name: string;
  balance: number; // In PAISA (Integer). Positive = Receivable, Negative = Debt
  total_paid?: number;
  total_owes?: number;
  upi_id?: string;
  user_id?: string;
}

interface Settlement {
  from: string; // ID
  to: string;   // ID
  amount: number; // In PAISA (Integer)
  upi_id?: string;
}

interface SettlementSummaryProps {
  members: Member[];
  debts?: Settlement[];
  onSettle: (fromName: string, toName: string, amount: number, idempotencyKey?: string) => Promise<void>;
  onPayNow?: (amount: number, toUserId: string) => void;
  isAdmin?: boolean;
  isBalanced?: boolean;
  isSyncing?: boolean;
  isDataReady?: boolean;
  groupId?: string;
  currentUserId?: string;
}

/**
 * 🔒 PROTECTED FINTECH SETTLEMENT UI
 * Enterprise-grade scalable settlement rendering layer
 * 
 * Includes:
 * - scalable rendering
 * - expand/collapse
 * - local settlement filtering
 * - render optimization
 * 
 * DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
 */

// START PROTECTED REGION

const SettlementSummary: React.FC<SettlementSummaryProps> = React.memo(({
  members,
  debts = [],
  onSettle,
  onPayNow,
  isAdmin = true,
  isBalanced = false,
  isSyncing = false,
  isDataReady = true,
  groupId,
  currentUserId
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [payTarget, setPayTarget] = useState<PaymentTarget | null>(null);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🛡️ [UTILITY_HANDLERS] - RBI Compliance Fallbacks
  const handleCopyUPI = (upiId?: string) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    console.log("[UPI_COPY_SUCCESS]", upiId);
  };

  const handleShareRequest = async (amount: number, fromName: string, toName: string, upiId?: string) => {
    const amountStr = formatCurrency(amount);
    const text = `Hi ${fromName}, please settle ${amountStr} for our group expenses on BachatKaro. ${upiId ? `UPI: ${upiId}` : ""}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title: "Settlement Request", text, dialogTitle: "Share Request" });
      } else if (navigator.share) {
        await navigator.share({ title: "Settlement Request", text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Single Source of Truth for Member Names
  const memberMap = useMemo(() => {
    return members.reduce((acc: Record<string, string>, m) => {
      acc[String(m.id)] = m.full_name || "Member";
      return acc;
    }, {});
  }, [members]);

  // Resolve current user's member ID for intent creation
  const currentMemberId = useMemo(() => {
    return members.find(m => m.user_id === currentUserId)?.id;
  }, [members, currentUserId]);

  // 🛡️ [BILATERAL_VERIFICATION_QUERY]
  const { data: incomingIntents = [], refetch: refetchIntents } = useQuery({
    queryKey: ['settlement-intents', groupId],
    enabled: !!groupId && !!currentUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlement_intents')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending_verification');
      if (error) throw error;
      return data || [];
    }
  });

  const myIncomingIntents = useMemo(() => {
    return incomingIntents.filter(i => i.receiver_id === currentMemberId);
  }, [incomingIntents, currentMemberId]);

  const handleConfirmReceipt = async (intent: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const fromName = memberMap[intent.sender_id] || "Member";
      const toName = memberMap[intent.receiver_id] || "Me";
      
      // 1. Commit to terminal state
      // 🛡️ [RULE_3] Idempotency: Check if updateStatus succeeds (it returns false if already success/VERIFIED)
      const success = await paymentOrchestrator.updateStatus(intent.id, 'ADMIN_VERIFIED', { verified_by: currentUserId });
      
      if (success) {
          // 2. Trigger ledger update (Handled by onSettle which is append-only)
          await onSettle(fromName, toName, intent.amount, intent.idempotency_key);
      } else {
          console.warn("[SETTLEMENT_DUPLICATE_BLOCK] Intent was already verified. Skipping ledger update.");
      }
      
      await refetchIntents();
    } catch (e) {
      console.error("Verification failed:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisputeReceipt = async (intent: any) => {
    if (!window.confirm("Mark this settlement as disputed? This will notify the payer and admin.")) return;
    setIsProcessing(true);
    try {
      await paymentOrchestrator.updateStatus(intent.id, 'DISPUTED');
      await refetchIntents();
    } finally {
      setIsProcessing(false);
    }
  };

  // 🛡️ [SCALABILITY STATE]
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🛡️ [FULL LEDGER STATE]
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const ledgerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[SETTLEMENT_STATE_UPDATE]", { isExpanded, isLedgerExpanded });
    }
  }, [isExpanded, isLedgerExpanded]);

  const allSettlements = useMemo(() => {
    const result = (debts || []).map(d => ({
      ...d,
      from: String(d.from),
      to: String(d.to),
      upi_id: d.upi_id || (members.find(m => m.user_id === d.to || m.id === d.to) as any)?.upi_id || null
    }));
    return result;
  }, [debts, members]);

  // 🛡️ LOCAL FILTERING LOGIC (Primary Settlements)
  const filteredSettlements = useMemo(() => {
    if (!searchQuery.trim()) return allSettlements;
    
    const query = searchQuery.toLowerCase();
    const filtered = allSettlements.filter(s => {
      const fromName = (memberMap[s.from] || "").toLowerCase();
      const toName = (memberMap[s.to] || "").toLowerCase();
      const upi = (s.upi_id || "").toLowerCase();
      return fromName.includes(query) || toName.includes(query) || upi.includes(query);
    });
    return filtered;
  }, [allSettlements, searchQuery, memberMap]);

  // 🛡️ SCALABLE VIEW LOGIC (Primary Settlements)
  const displayedSettlements = useMemo(() => {
    const result = isExpanded ? filteredSettlements : filteredSettlements.slice(0, 5);
    return result;
  }, [filteredSettlements, isExpanded]);

  // START PROTECTED FINTECH LEDGER REGION
  // 🛡️ FULL LEDGER DATA Derivation
  const filteredLedgerMembers = useMemo(() => {
    let result = members;
    if (ledgerSearchQuery.trim()) {
        const query = ledgerSearchQuery.toLowerCase();
        result = members.filter(m => 
            m.full_name.toLowerCase().includes(query) || 
            (m.upi_id || "").toLowerCase().includes(query)
        );
    }
    return result;
  }, [members, ledgerSearchQuery]);
  // END PROTECTED FINTECH LEDGER REGION

  const availableP2PTargets: PaymentTarget[] = useMemo(() => {
    return allSettlements
        .filter(s => s.from === currentMemberId)
        .map(s => ({
            id: s.to,
            name: memberMap[s.to] || "Member",
            type: 'p2p',
            amount: s.amount,
            upiId: s.upi_id,
            metadata: { from: s.from }
        }));
  }, [allSettlements, memberMap, currentMemberId]);

  if (!isDataReady || members.length === 0) return null;

  const handlePaymentReturn = async (success: boolean, target: PaymentTarget, idempotencyKey?: string) => {
    if (isProcessing) return;
    if (success && target.type === 'p2p') {
      setIsProcessing(true);
      try {
        // 🛡️ [RULE_4] "I have Paid" translates to USER_CONFIRMED.
        // It MUST NOT update ledger, mark VERIFIED, or trigger settlement completion.
        // We only show a toast and wait for receiver confirmation or SMS auto-verify.
        console.log(`[P2P_PAYMENT_RETURN] Payment intent launched/confirmed. Awaiting receiver verification.`);
      } finally {
        setIsProcessing(false);
      }
    }
    setPayTarget(null);
  };

  const getWhatsAppUrl = (amount: number, fromName: string, toName: string, isDebtor: boolean): string => {
    const text = isDebtor 
      ? `Hi ${toName}, I am settling ${formatCurrency(amount)} for our expenses on BachatKaro App. ✨`
      : `Hi ${fromName}, just a friendly reminder to settle ${formatCurrency(amount)} for our group expenses on BachatKaro. ✨`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // UI CONSTANTS
  const premiumCard = "bg-card rounded-xl border border-border/40 overflow-hidden mb-4 shadow-sm transition-all";
  const inputStyle = "w-full h-12 pl-10 pr-10 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/40 shadow-inner";
  const badgeStyle = "text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🛡️ [BILATERAL_VERIFICATION_SECTION] */}
      {myIncomingIntents.length > 0 && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center gap-2 px-1">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Action Required: Verify Incoming Funds</p>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myIncomingIntents.map((intent) => (
                <div key={intent.id} className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Incoming Handshake</p>
                      <p className="text-sm font-black truncate uppercase text-foreground">From: {memberMap[intent.sender_id] || "Member"}</p>
                    </div>
                    <p className="text-lg font-black font-mono tracking-tighter text-primary">{formatCurrency(intent.amount)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleConfirmReceipt(intent)}
                      disabled={isProcessing}
                      className="flex-1 h-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                      Confirm Receipt
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => handleDisputeReceipt(intent)}
                      disabled={isProcessing}
                      className="h-10 px-4 border border-border/40 text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className={cn("w-full", premiumCard)}>
        <SmartPaySheet 
          isOpen={isPaySheetOpen}
          onOpenChange={setIsPaySheetOpen}
          preselectedTarget={payTarget}
          availableP2PTargets={availableP2PTargets}
          onPaymentReturn={handlePaymentReturn}
          groupId={groupId}
          senderId={currentMemberId}
        />
        
        <div className="bg-background/50 border-b border-border/40 p-6 sm:p-8 flex justify-between items-center relative">
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
              <ArrowRightLeft className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-foreground font-black text-xl tracking-tight uppercase">
                {t("settlement.title", "Settlements")}
              </h3>
              <div className="flex items-center gap-2.5 mt-1.5">
                {!isAdmin && (
                  <span className={cn(badgeStyle, "bg-background text-muted-foreground border-border/40")}>
                    <Lock size={10} /> {t("settlement.view_only", "View Only")}
                  </span>
                )}
                {isBalanced ? (
                  <span className={cn(badgeStyle, "bg-background text-primary border-primary/20")}>
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className={cn(badgeStyle, "bg-background text-muted-foreground border-border/40 animate-pulse")}>
                    <AlertCircle size={10} /> Syncing
                  </span>
                )}
              </div>
            </div>
          </div>
          <Zap className="text-primary/10" size={24} />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {(isSyncing || isProcessing) && (
            <div className="p-5 bg-background border border-border/40 rounded-2xl flex items-start gap-4 mb-2 animate-pulse shadow-inner">
              <RefreshCw className="text-muted-foreground h-5 w-5 mt-0.5 shrink-0 animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {isProcessing ? t("settlement.finalizing", "Finalizing Ledger Commit...") : t("settlement.reconstructing", "Reconstructing Unified Data...")}
              </p>
            </div>
          )}

          {/* 🛡️ STICKY SEARCH BAR */}
          {allSettlements.length > 5 && (
            <div className={cn(
              "relative transition-all duration-300 mb-4",
              isExpanded ? "sticky top-0 z-20 bg-background/95 py-3 border-b border-border/40 -mx-8 px-8" : ""
            )}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
                <input 
                  type="text"
                  placeholder={t("settlement.search_placeholder", "Search members or credentials...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={inputStyle}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!debts || debts.length === 0 ? (
            <div className="text-center py-16 bg-background rounded-xl border border-dashed border-border/40 shadow-inner">
               <div className="h-16 w-16 bg-card rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <CheckCircle2 size={32} className="text-primary/10" />
               </div>
               <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em]">{t("settlement.zero_debt", "Zero Debt Load")}</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-16 bg-background rounded-xl border border-dashed border-border/40 shadow-inner">
               <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em]">
                  {t("settlement.no_match", "No matching data detected")}
               </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedSettlements.map((settlement, index) => {
                const isDebtor = settlement.from === currentMemberId;
                const isCreditor = settlement.to === currentMemberId;
                const fromName = memberMap[settlement.from] || "User";
                const toName = memberMap[settlement.to] || "User";

                return (
                  <div
                    key={`${settlement.from}-${settlement.to}-${index}`}
                    className="flex flex-col md:flex-row items-center justify-between p-5 sm:p-7 bg-card rounded-xl border border-border/40 gap-6 sm:gap-8 transition-all duration-700 ease-in-out hover:border-primary/20 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 group"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full min-w-0">
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl border shrink-0 transition-all duration-700 group-hover:scale-110",
                        isDebtor ? "bg-background text-foreground border-border/40 shadow-inner" : "bg-card text-foreground border-border/40 shadow-sm"
                      )}>
                        {fromName[0]}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            {settlement.amount > 0 ? t("settlement.pending", "Pending") : t("settlement.settled", "Settled")}
                          </p>
                          {isDebtor && <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-widest shadow-sm whitespace-nowrap">Debt</span>}
                          {isCreditor && <span className="bg-background text-primary text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-widest border border-primary/20 shadow-sm whitespace-nowrap">Get</span>}
                        </div>
                        <p className="text-foreground text-sm sm:text-base font-black truncate uppercase tracking-tight">
                          <span>{fromName}</span>{' '}
                          <span className="text-muted-foreground mx-1 lowercase italic opacity-60">to</span>{' '}
                          <span>{toName}</span>
                        </p>
                        <p className="text-[26px] sm:text-[34px] font-black text-foreground font-mono tracking-tighter leading-none mt-2 sm:mt-3 tabular-nums truncate">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-2 sm:gap-3 w-full md:w-auto md:flex-shrink-0">
                      {settlement.amount > 0 && isDebtor && (
                        <button
                          onClick={() => {
                            const target: PaymentTarget = {
                              id: settlement.to,
                              name: toName,
                              type: 'p2p',
                              amount: settlement.amount,
                              upiId: settlement.upi_id,
                              metadata: { from: settlement.from }
                            };
                            setPayTarget(target);
                            setIsPaySheetOpen(true);
                          }}
                          disabled={isSyncing || isProcessing}
                          className={cn(
                            "flex-1 md:flex-none h-11 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                            !isSyncing && !isProcessing
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95" 
                              : "bg-background text-muted-foreground cursor-not-allowed border border-border/40"
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            {isProcessing && payTarget?.id === settlement.to ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Smartphone size={16} className="sm:w-[18px] sm:h-[18px]" />
                            )}
                            <span>{isProcessing && payTarget?.id === settlement.to ? "Waiting..." : (!settlement.upi_id ? "Set UPI ID" : t("settlement.pay_now", "Settle"))}</span>
                          </div>
                        </button>
                      )}

                      {/* 🛡️ [UTILITY_ACTIONS] - Copy & Share Fallbacks */}
                      {settlement.amount > 0 && (
                        <div className="flex gap-2">
                           {settlement.upi_id && isDebtor && (
                             <button
                               onClick={() => handleCopyUPI(settlement.upi_id)}
                               className="h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center border border-border/40 rounded-xl sm:rounded-2xl bg-background text-muted-foreground hover:text-primary transition-all active:scale-95 shadow-sm shrink-0"
                               title="Copy UPI ID"
                             >
                               <Copy size={16} className="sm:w-5 sm:h-5" />
                             </button>
                           )}
                           <button
                             onClick={() => handleShareRequest(settlement.amount, isDebtor ? toName : fromName, isDebtor ? fromName : toName, settlement.upi_id)}
                             className="h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center border border-border/40 rounded-xl sm:rounded-2xl bg-background text-muted-foreground hover:text-primary transition-all active:scale-95 shadow-sm shrink-0"
                             title="Share Payment Request"
                           >
                             <Share2 size={16} className="sm:w-5 sm:h-5" />
                           </button>
                        </div>
                      )}
                      
                      {settlement.amount > 0 && !isDebtor && (
                        <a
                          href={getWhatsAppUrl(settlement.amount, fromName, toName, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex-1 md:flex-none h-11 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95",
                            isCreditor 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                              : "bg-background text-muted-foreground border border-border/40 hover:bg-card hover:text-foreground"
                          )}
                        >
                          <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                          {isCreditor ? t("settlement.nudge", "Nudge") : t("settlement.remind", "Remind")}
                        </a>
                      )}

                      <button
                        onClick={() => isAdmin && onSettle(fromName, toName, settlement.amount)}
                        disabled={!isAdmin || isProcessing}
                        className={cn(
                          "h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center border rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-sm shrink-0",
                          isAdmin && !isProcessing
                            ? 'bg-background text-muted-foreground border-border/40 hover:text-foreground hover:bg-card'
                            : 'bg-background text-muted-foreground/20 border-transparent cursor-not-allowed opacity-30'
                        )}
                        title={isAdmin ? t("settlement.mark_paid", "Mark as Paid") : t("settlement.admin_only", "Admin Only")}
                      >
                        {isAdmin ? <CheckCircle2 className="w-5 h-5 sm:w-[26px] sm:h-[26px]" /> : <Lock size={18} className="sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 🛡️ EXPAND / COLLAPSE BUTTON */}
              {filteredSettlements.length > 5 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-4 flex items-center justify-center gap-3 text-muted-foreground font-black text-[10px] uppercase tracking-widest border border-border/40 rounded-xl bg-background hover:bg-card transition-all active:scale-[0.99] shadow-sm"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={18} />
                      {t("settlement.show_less", "Consolidate View")}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={18} />
                      {t("settlement.expand_ledger", `Expand Ledger (${filteredSettlements.length})`)}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* START PROTECTED FINTECH LEDGER REGION */}
      <div 
        ref={ledgerRef}
        className="w-full bg-card rounded-xl border border-border/40 overflow-hidden transition-all shadow-sm group hover:border-primary/10"
      >
          <button 
              onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
              className="w-full p-8 flex items-center justify-between hover:bg-background/30 transition-all"
          >
              <div className="flex items-center gap-5">
                  <div className="p-3 bg-background rounded-2xl border border-border/40 group-hover:scale-105 transition-transform shadow-inner">
                      <Users className="text-primary" size={24} />
                  </div>
                  <div className="text-left">
                      <h4 className="text-foreground font-black text-lg uppercase tracking-tight">
                        {t("settlement.full_ledger", "Full Strategic Ledger")}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5">
                          {members.length} {t("settlement.entities", "Entities")} • {debts.length} {t("settlement.active_positions", "Active Positions")}
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-muted-foreground bg-background px-4 py-1.5 rounded-full uppercase tracking-widest border border-border/40 shadow-inner">
                  {isLedgerExpanded ? t("settlement.minimize", "Minimize") : t("settlement.explore", "Explore")}
                </span>
                {isLedgerExpanded ? <ChevronUp className="text-muted-foreground" size={20} /> : <ChevronDown className="text-muted-foreground" size={20} />}
              </div>
          </button>

          {isLedgerExpanded && (
              <div className="p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                      <input 
                          type="text"
                          placeholder={t("settlement.search_identity", "Search identity or credential...")}
                          value={ledgerSearchQuery}
                          onChange={(e) => setLedgerSearchQuery(e.target.value)}
                          className={inputStyle}
                      />
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredLedgerMembers.length === 0 ? (
                          <div className="py-20 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-[0.2em] bg-background rounded-xl border border-dashed border-border/40 shadow-inner">
                              {t("settlement.no_identity_match", "Zero identity matches found")}
                          </div>
                      ) : (
                          filteredLedgerMembers.map((member) => {
                              const balance = member.balance;
                              const isReceivable = balance > 0.01;
                              const isOwed = balance < -0.01;

                              return (
                                  <div 
                                      key={member.id}
                                      className="p-6 bg-background/[0.03] border border-border/40 rounded-xl flex items-center justify-between gap-8 group/row hover:border-border/80 hover:bg-background/80 transition-all duration-700 ease-in-out shadow-sm"
                                  >
                                      <div className="flex items-center gap-6">
                                          <div className={cn(
                                              "w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl border transition-all duration-700 group-hover/row:scale-110",
                                              isReceivable ? "bg-primary text-primary-foreground border-foreground shadow-md" : 
                                              isOwed ? "bg-card text-foreground border-border/40 shadow-inner" : 
                                              "bg-background text-muted-foreground border-border/40 opacity-60"
                                          )}>
                                              {member.full_name[0]}
                                          </div>
                                          <div className="min-w-0">
                                              <p className="text-foreground text-[16px] font-black truncate uppercase tracking-tight leading-tight">{member.full_name}</p>
                                              <div className="flex items-center gap-3 mt-2">
                                                  <span className={cn(
                                                      "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow-sm transition-all duration-500",
                                                      isReceivable ? "bg-background text-primary border border-primary/20" : 
                                                      isOwed ? "bg-primary text-primary-foreground" : 
                                                      "bg-background text-muted-foreground border border-border/40 opacity-50"
                                                  )}>
                                                      {isReceivable ? t("settlement.credit", "Credit") : isOwed ? t("settlement.debit", "Debit") : t("settlement.neutral", "Neutral")}
                                                  </span>
                                                  {member.upi_id && (
                                                      <span className="text-[10px] text-muted-foreground font-black truncate max-w-[140px] uppercase tracking-widest opacity-60">
                                                          {member.upi_id}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                          <div className="flex items-baseline justify-end gap-5 mb-2.5">
                                              <div className="text-[10px] text-muted-foreground font-black leading-none uppercase tracking-widest">
                                                  In: <span className="text-foreground font-mono tabular-nums">{formatCurrency(member.total_paid || 0)}</span>
                                              </div>
                                              <div className="text-[10px] text-muted-foreground font-black leading-none uppercase tracking-widest">
                                                  Out: <span className="text-foreground font-mono tabular-nums">{formatCurrency(member.total_owes || 0)}</span>
                                              </div>
                                          </div>
                                          <p className={cn(
                                              "text-2xl font-black font-mono tracking-tighter leading-none tabular-nums",
                                              isReceivable ? "text-foreground" : isOwed ? "text-foreground" : "text-muted-foreground opacity-40"
                                          )}>
                                              {isReceivable ? "+" : ""}{formatCurrency(balance)}
                                          </p>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          )}
      </div>
      {/* END PROTECTED FINTECH LEDGER REGION */}
    </div>
  );
});

// END PROTECTED REGION

export default SettlementSummary;
