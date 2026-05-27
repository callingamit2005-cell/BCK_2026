// src/features/split-expense/SettlementSummary.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// 🛡️ SECURITY: Enhanced Read-Only mode for non-admins with visual cues.

import React, { useMemo, useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, Zap, ArrowRightLeft, Lock, Smartphone, AlertCircle, RefreshCw, Loader2, Search, ChevronDown, ChevronUp, X, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { SmartPaySheet, PaymentTarget } from '@/components/dashboard/SmartPaySheet';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [payTarget, setPayTarget] = useState<PaymentTarget | null>(null);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        const fromName = memberMap[target.metadata.from] || "Sender";
        const toName = target.name;
        await onSettle(fromName, toName, target.amount, idempotencyKey);
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
  const premiumCard = "bg-surface rounded-[32px] border border-border overflow-hidden mb-4 shadow-sm transition-all";
  const inputStyle = "w-full h-12 pl-10 pr-10 bg-background border border-border rounded-2xl text-sm font-bold focus:outline-none focus:border-foreground transition-all text-foreground placeholder:text-text-muted shadow-inner";
  const badgeStyle = "text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1.5 border shadow-sm";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        
        <div className="bg-background/50 border-b border-border p-6 sm:p-8 flex justify-between items-center relative">
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-surface p-3 rounded-2xl border border-border shadow-sm">
              <ArrowRightLeft className="text-text-secondary" size={24} />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-xl tracking-tight uppercase">
                {t("settlements", "Settlements")}
              </h3>
              <div className="flex items-center gap-2.5 mt-1.5">
                {!isAdmin && (
                  <span className={cn(badgeStyle, "bg-background text-text-muted border-border")}>
                    <Lock size={10} /> {t("view_only", "View Only")}
                  </span>
                )}
                {isBalanced ? (
                  <span className={cn(badgeStyle, "bg-fintech-emerald-muted text-fintech-emerald-dark border-fintech-emerald/20")}>
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className={cn(badgeStyle, "bg-fintech-rose-muted text-fintech-rose-dark border-fintech-rose/20 animate-pulse")}>
                    <AlertCircle size={10} /> Syncing
                  </span>
                )}
              </div>
            </div>
          </div>
          <Zap className="text-text-muted/20" size={24} />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {(isSyncing || isProcessing) && (
            <div className="p-5 bg-background border border-border rounded-2xl flex items-start gap-4 mb-2 animate-pulse shadow-inner">
              <RefreshCw className="text-text-muted h-5 w-5 mt-0.5 shrink-0 animate-spin" />
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                {isProcessing ? "Finalizing Ledger Commit..." : "Reconstructing Unified Data..."}
              </p>
            </div>
          )}

          {/* 🛡️ STICKY SEARCH BAR */}
          {allSettlements.length > 5 && (
            <div className={cn(
              "relative transition-all duration-300 mb-4",
              isExpanded ? "sticky top-0 z-20 bg-background/95 py-3 border-b border-border -mx-8 px-8" : ""
            )}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 transition-colors group-focus-within:text-foreground" />
                <input 
                  type="text"
                  placeholder={t("search_settlements", "Search members or credentials...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={inputStyle}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!debts || debts.length === 0 ? (
            <div className="text-center py-16 bg-background rounded-[32px] border border-dashed border-border shadow-inner">
               <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <CheckCircle2 size={32} className="text-text-muted/10" />
               </div>
               <p className="text-text-muted font-bold text-base uppercase tracking-[0.2em]">{t("all_settled", "Zero Debt Load")}</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-16 bg-background rounded-[32px] border border-dashed border-border shadow-inner">
               <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
                  No matching data detected
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
                    className="flex flex-col md:flex-row items-center justify-between p-5 sm:p-7 bg-surface rounded-[24px] sm:rounded-[32px] border border-border/60 gap-6 sm:gap-8 transition-all duration-700 ease-butter-soft hover:border-border hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-2 group"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full min-w-0">
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[24px] flex items-center justify-center font-black text-xl sm:text-2xl border shrink-0 transition-all duration-700 group-hover:scale-110",
                        isDebtor ? "bg-background text-[#1a1a1a] border-border/80 shadow-inner" : "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xl"
                      )}>
                        {fromName[0]}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <p className="text-[9px] sm:text-[10px] font-black text-fintech-graphite-muted uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                            {settlement.amount > 0 ? "Pending" : "Settled"}
                          </p>
                          {isDebtor && <span className="bg-fintech-rose text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-widest sm:tracking-[0.2em] shadow-md shadow-fintech-rose/20 whitespace-nowrap">Debt</span>}
                          {isCreditor && <span className="bg-fintech-emerald-muted text-fintech-emerald-dark text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-widest sm:tracking-[0.2em] border border-fintech-emerald/20 shadow-sm whitespace-nowrap">Get</span>}
                        </div>
                        <p className="text-[#525252] text-[13px] sm:text-[15px] font-bold truncate uppercase tracking-tight">
                          <span className="font-black text-[#1a1a1a]">{fromName}</span>{' '}
                          <span className="text-fintech-graphite-muted mx-1 lowercase italic opacity-60">to</span>{' '}
                          <span className="font-black text-[#1a1a1a]">{toName}</span>
                        </p>
                        <p className="text-[26px] sm:text-[34px] font-black text-[#1a1a1a] font-mono tracking-tighter leading-none mt-2 sm:mt-3 tabular-nums truncate">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 w-full md:w-auto md:flex-shrink-0">
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
                            "flex-1 md:flex-none h-11 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-[11px] uppercase tracking-widest transition-all",
                            !isSyncing && !isProcessing
                              ? "bg-foreground text-surface hover:bg-foreground/90 shadow-xl active:scale-95" 
                              : "bg-background text-text-muted cursor-not-allowed border border-border"
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            {isProcessing && payTarget?.id === settlement.to ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Smartphone size={16} className="sm:w-[18px] sm:h-[18px]" />
                            )}
                            <span>{isProcessing && payTarget?.id === settlement.to ? "Witing..." : t("pay_now", "Settle")}</span>
                          </div>
                        </button>
                      )}
                      
                      {settlement.amount > 0 && !isDebtor && (
                        <a
                          href={getWhatsAppUrl(settlement.amount, fromName, toName, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex-1 md:flex-none h-11 sm:h-14 px-6 sm:px-8 flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95",
                            isCreditor 
                              ? "bg-foreground text-surface hover:bg-foreground/90 shadow-xl"
                              : "bg-background text-text-secondary border border-border hover:bg-surface hover:text-foreground"
                          )}
                        >
                          <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                          {isCreditor ? t("nudge", "Nudge") : t("remind", "Remind")}
                        </a>
                      )}

                      <button
                        onClick={() => isAdmin && onSettle(fromName, toName, settlement.amount)}
                        disabled={!isAdmin || isProcessing}
                        className={cn(
                          "h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center border rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-sm shrink-0",
                          isAdmin && !isProcessing
                            ? 'bg-background text-text-muted border-border hover:text-foreground hover:border-foreground hover:bg-surface'
                            : 'bg-background text-text-muted/20 border-transparent cursor-not-allowed opacity-30'
                        )}
                        title={isAdmin ? t("mark_as_paid", "Mark as Paid") : t("admin_only", "Admin Only")}
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
                  className="w-full py-4 flex items-center justify-center gap-3 text-text-secondary font-bold text-[11px] uppercase tracking-[0.3em] border border-border rounded-2xl bg-background hover:bg-surface transition-all active:scale-[0.99] shadow-sm"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={18} />
                      {t("show_less", "Consolidate View")}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={18} />
                      {t("view_all_settlements", `Expand Ledger (${filteredSettlements.length})`)}
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
        className="w-full bg-surface rounded-[32px] border border-border overflow-hidden transition-all shadow-sm group hover:border-foreground/10"
      >
          <button 
              onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
              className="w-full p-8 flex items-center justify-between hover:bg-background/30 transition-all"
          >
              <div className="flex items-center gap-5">
                  <div className="p-3 bg-background rounded-2xl border border-border group-hover:scale-105 transition-transform shadow-inner">
                      <Users className="text-text-secondary" size={24} />
                  </div>
                  <div className="text-left">
                      <h4 className="text-foreground font-bold text-lg uppercase tracking-tight">Full Strategic Ledger</h4>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] mt-1.5">
                          {members.length} Entities • {debts.length} Active Positions
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-bold text-text-secondary bg-background px-4 py-1.5 rounded-full uppercase tracking-widest border border-border shadow-sm">
                  {isLedgerExpanded ? "Minimize" : "Explore"}
                </span>
                {isLedgerExpanded ? <ChevronUp className="text-text-muted" size={20} /> : <ChevronDown className="text-text-muted" size={20} />}
              </div>
          </button>

          {isLedgerExpanded && (
              <div className="p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 group-focus-within:text-foreground transition-colors" />
                      <input 
                          type="text"
                          placeholder="Search identity or credential..."
                          value={ledgerSearchQuery}
                          onChange={(e) => setLedgerSearchQuery(e.target.value)}
                          className={inputStyle}
                      />
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredLedgerMembers.length === 0 ? (
                          <div className="py-20 text-center text-text-muted/30 text-[11px] font-bold uppercase tracking-widest bg-background rounded-[24px] border border-dashed border-border shadow-inner">
                              Zero identity matches found
                          </div>
                      ) : (
                          filteredLedgerMembers.map((member) => {
                              const balance = member.balance;
                              const isReceivable = balance > 0.01;
                              const isOwed = balance < -0.01;

                              return (
                                  <div 
                                      key={member.id}
                                      className="p-6 bg-background/[0.03] border border-border/40 rounded-[28px] flex items-center justify-between gap-8 group/row hover:border-border/80 hover:bg-background/80 transition-all duration-700 ease-butter-soft shadow-sm"
                                  >
                                      <div className="flex items-center gap-6">
                                          <div className={cn(
                                              "w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-xl border transition-all duration-700 group-hover/row:scale-110",
                                              isReceivable ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xl" : 
                                              isOwed ? "bg-white text-[#1a1a1a] border-border/80 shadow-inner" : 
                                              "bg-background text-fintech-graphite-muted border-border/40 opacity-60"
                                          )}>
                                              {member.full_name[0]}
                                          </div>
                                          <div className="min-w-0">
                                              <p className="text-[#1a1a1a] text-[16px] font-black truncate uppercase tracking-tight leading-tight">{member.full_name}</p>
                                              <div className="flex items-center gap-3 mt-2">
                                                  <span className={cn(
                                                      "text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-[0.2em] shadow-sm transition-all duration-500",
                                                      isReceivable ? "bg-fintech-emerald text-white" : 
                                                      isOwed ? "bg-fintech-rose-muted text-fintech-rose-dark border border-fintech-rose/10" : 
                                                      "bg-background text-fintech-graphite-muted border border-border/40 opacity-50"
                                                  )}>
                                                      {isReceivable ? "Credit" : isOwed ? "Debit" : "Neutral"}
                                                  </span>
                                                  {member.upi_id && (
                                                      <span className="text-[10px] text-fintech-graphite-muted font-black truncate max-w-[140px] uppercase tracking-widest opacity-60">
                                                          {member.upi_id}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                          <div className="flex items-baseline justify-end gap-5 mb-2.5">
                                              <div className="text-[10px] text-fintech-graphite-muted font-black leading-none uppercase tracking-[0.2em]">
                                                  In: <span className="text-[#1a1a1a] font-mono tabular-nums">{formatCurrency(member.total_paid || 0)}</span>
                                              </div>
                                              <div className="text-[10px] text-fintech-graphite-muted font-black leading-none uppercase tracking-[0.2em]">
                                                  Out: <span className="text-[#1a1a1a] font-mono tabular-nums">{formatCurrency(member.total_owes || 0)}</span>
                                              </div>
                                          </div>
                                          <p className={cn(
                                              "text-2xl font-black font-mono tracking-tighter leading-none tabular-nums",
                                              isReceivable ? "text-fintech-emerald-dark" : isOwed ? "text-fintech-rose-dark" : "text-fintech-graphite-muted opacity-40"
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
