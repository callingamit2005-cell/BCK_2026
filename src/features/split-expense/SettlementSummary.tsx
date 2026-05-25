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

  // 🛡️ [RUNTIME_OPTIMIZATION] Render Reason Logging
  if (import.meta.env.DEV) {
    console.log("[FULL_LEDGER_RERENDER_REASON]", { 
        memberCount: members.length, 
        debtCount: debts.length,
        timestamp: Date.now() 
    });
  }

  // 🛡️ SCALABILITY STATE
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🛡️ FULL LEDGER STATE
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const ledgerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[SETTLEMENT_EXPAND_STATE]", isExpanded);
      console.log("[FULL_LEDGER_EXPAND_STATE]", isLedgerExpanded);
      console.log("[LEDGER_TOGGLE_VISIBLE] True");
      console.log("[LEDGER_COLLAPSED_STATE]", !isLedgerExpanded);
      if (ledgerRef.current) {
        console.log("[LEDGER_PARENT_HEIGHT]", ledgerRef.current.offsetHeight);
      }
    }
  }, [isExpanded, isLedgerExpanded]);

  useEffect(() => {
    if (import.meta.env.DEV && searchQuery) {
      console.log("[SETTLEMENT_SEARCH_QUERY]", searchQuery);
    }
    if (import.meta.env.DEV && ledgerSearchQuery) {
        console.log("[FULL_LEDGER_SEARCH_QUERY]", ledgerSearchQuery);
    }
  }, [searchQuery, ledgerSearchQuery]);

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
    const startTime = performance.now();
    const result = (debts || []).map(d => ({
      ...d,
      from: String(d.from),
      to: String(d.to),
      upi_id: d.upi_id || (members.find(m => m.user_id === d.to || m.id === d.to) as any)?.upi_id || null
    }));
    
    if (import.meta.env.DEV) {
      console.log("[SETTLEMENT_RENDER_TIME]", `${(performance.now() - startTime).toFixed(2)}ms`);
    }
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

    if (import.meta.env.DEV) {
      console.log("[SETTLEMENT_FILTER_RESULT_COUNT]", filtered.length);
    }
    return filtered;
  }, [allSettlements, searchQuery, memberMap]);

  // 🛡️ SCALABLE VIEW LOGIC (Primary Settlements)
  const displayedSettlements = useMemo(() => {
    const result = isExpanded ? filteredSettlements : filteredSettlements.slice(0, 5);
    
    if (import.meta.env.DEV) {
      console.log("[SETTLEMENT_VISIBLE_COUNT]", result.length);
    }
    return result;
  }, [filteredSettlements, isExpanded]);

  // START PROTECTED FINTECH LEDGER REGION
  // DO NOT MODIFY WITHOUT FINTECH LEDGER REVIEW.

  // 🛡️ FULL LEDGER DATA Derivation
  const filteredLedgerMembers = useMemo(() => {
    if (import.meta.env.DEV) console.log("[FULL_LEDGER_RENDER]", { timestamp: Date.now() });

    let result = members;
    
    if (ledgerSearchQuery.trim()) {
        const query = ledgerSearchQuery.toLowerCase();
        result = members.filter(m => 
            m.full_name.toLowerCase().includes(query) || 
            (m.upi_id || "").toLowerCase().includes(query)
        );
    }

    if (import.meta.env.DEV) {
        console.log("[FULL_LEDGER_MEMBER_COUNT]", members.length);
        console.log("[FULL_LEDGER_FILTERED_COUNT]", result.length);
    }

    return result;
  }, [members, ledgerSearchQuery]);

  // END PROTECTED FINTECH LEDGER REGION

  // Map settlements to PaymentTarget format for the unified sheet
  const availableP2PTargets: PaymentTarget[] = useMemo(() => {
    // Only show debts where the current user is the sender (from)
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

  const allSettled = useMemo(() => {
    if (!isDataReady || members.length === 0) return false;
    return members.every(m => Math.abs(m.balance) === 0);
  }, [members, isDataReady]);

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

  return (
    <div className="space-y-6">
      <div className="w-full bg-white rounded-3xl shadow-xl shadow-purple-100/20 border border-slate-100 overflow-hidden mb-2 transition-all hover:shadow-purple-200/40">
        <SmartPaySheet 
          isOpen={isPaySheetOpen}
          onOpenChange={setIsPaySheetOpen}
          preselectedTarget={payTarget}
          availableP2PTargets={availableP2PTargets}
          onPaymentReturn={handlePaymentReturn}
          groupId={groupId}
          senderId={currentMemberId}
        />
        
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-5 flex justify-between items-center relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <ArrowRightLeft className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-lg tracking-tight drop-shadow-sm">
                Paisa Vasool (Settlements)
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {!isAdmin && (
                  <p className="text-[10px] text-purple-100 font-bold flex items-center gap-1 uppercase tracking-tighter opacity-90">
                    <Lock size={10} /> View Only
                  </p>
                )}
                {isBalanced ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Ledger Verified
                  </span>
                ) : (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-rose-500/30 flex items-center gap-1 animate-pulse">
                    <AlertCircle size={10} /> Calculation Error
                  </span>
                )}
              </div>
            </div>
          </div>
          <Zap className="text-yellow-300 animate-pulse drop-shadow-md" size={20} fill="currentColor" />
        </div>

        <div className="p-4 space-y-3">
          {(isSyncing || isProcessing) && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 mb-2 animate-pulse">
              <RefreshCw className="text-blue-500 h-4 w-4 mt-0.5 shrink-0 animate-spin" />
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                {isProcessing ? "Processing settlement..." : "Syncing latest transactions... Please wait."}
              </p>
            </div>
          )}

          {/* 🛡️ STICKY SEARCH BAR */}
          {allSettlements.length > 5 && (
            <div className={cn(
              "relative transition-all duration-300 mb-2",
              isExpanded ? "sticky top-0 z-20 bg-white/80 backdrop-blur-md py-2" : ""
            )}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 transition-colors group-focus-within:text-purple-500" />
                <input 
                  type="text"
                  placeholder={t("search_settlements", "Search members or UPI ID...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!debts || debts.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-dashed border-emerald-200">
               <p className="text-emerald-600 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> All Settled! 🎉
               </p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                  No matching settlements
               </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedSettlements.map((settlement, index) => {
                const isDebtor = settlement.from === currentMemberId;
                const isCreditor = settlement.to === currentMemberId;
                const fromName = memberMap[settlement.from] || "User";
                const toName = memberMap[settlement.to] || "User";

                return (
                  <div
                    key={`${settlement.from}-${settlement.to}-${index}`}
                    className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 gap-4 transition-all hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border shadow-sm shrink-0",
                        isDebtor ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-purple-50 text-purple-600 border-purple-100"
                      )}>
                        {fromName[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {settlement.amount > 0 ? "Pending Settle" : "Settled"}
                          </p>
                          {isDebtor && <span className="bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{t("you_owe", "You Owe")}</span>}
                          {isCreditor && <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{t("you_get", "You Get")}</span>}
                        </div>
                        <p className="text-slate-700 text-sm font-medium truncate">
                          <span className="font-bold text-[#EC4899]">{fromName}</span>{' '}
                          <span className="text-slate-400 mx-1">owes</span>{' '}
                          <span className="font-bold text-[#8B5CF6]">{toName}</span>
                        </p>
                        <p className="text-2xl font-black text-slate-900 leading-tight mt-1">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto md:flex-shrink-0">
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
                            "flex-1 md:flex-none h-12 px-5 flex items-center justify-center gap-2 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-all",
                            !isSyncing && !isProcessing
                              ? "bg-[#ff0f7b] shadow-pink-200/60 hover:bg-[#d40d6b]" 
                              : "bg-slate-300 cursor-not-allowed shadow-none"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isProcessing && payTarget?.id === settlement.to ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Smartphone size={18} />
                            )}
                            <span>{isProcessing && payTarget?.id === settlement.to ? t("saving", "Saving...") : t("pay_now", "Pay Now")}</span>
                          </div>
                        </button>
                      )}
                      
                      {settlement.amount > 0 && !isDebtor && (
                        <a
                          href={getWhatsAppUrl(settlement.amount, fromName, toName, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex-1 md:flex-none h-12 px-5 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-all",
                            isCreditor 
                              ? "bg-emerald-500 text-white shadow-emerald-200/60 hover:bg-emerald-600 hover:shadow-emerald-300/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 shadow-none"
                          )}
                        >
                          <MessageCircle size={18} />
                          {isCreditor ? t("nudge", "Nudge") : t("remind", "Remind")}
                        </a>
                      )}

                      <button
                        onClick={() => isAdmin && onSettle(fromName, toName, settlement.amount)}
                        disabled={!isAdmin || isProcessing}
                        className={`h-12 w-12 flex items-center justify-center border rounded-xl transition-all active:scale-95 ${
                          isAdmin && !isProcessing
                            ? 'bg-white text-slate-400 border-slate-200 hover:text-[#8B5CF6] hover:border-[#8B5CF6] hover:bg-purple-50/50 shadow-sm'
                            : 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed'
                        }`}
                        title={isAdmin ? t("mark_as_paid", "Mark as Paid") : t("admin_only", "Admin Only")}
                      >
                        {isAdmin ? <CheckCircle2 size={24} /> : <Lock size={20} />}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 🛡️ EXPAND / COLLAPSE BUTTON */}
              {filteredSettlements.length > 5 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-[0.2em] border border-purple-100 rounded-xl bg-purple-50/30 hover:bg-purple-50 transition-all active:scale-[0.98]"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      {t("show_less", "Show Less")}
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      {t("view_all_settlements", `View All Settlements (${filteredSettlements.length})`)}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* START PROTECTED FINTECH LEDGER REGION */}
      {/* DO NOT MODIFY WITHOUT FINTECH LEDGER REVIEW. */}
      <div 
        ref={ledgerRef}
        className={cn(
          "w-full bg-slate-50/80 rounded-3xl border border-slate-200 overflow-hidden transition-all shadow-sm",
          import.meta.env.DEV ? "border-purple-300/30" : ""
        )}
      >
          <button 
              onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-100/80 transition-all group"
          >
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-purple-200 transition-colors">
                      <Users className="text-purple-500" size={20} />
                  </div>
                  <div className="text-left">
                      <h4 className="text-slate-900 font-extrabold text-sm uppercase tracking-tight">Full Member Ledger</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                          {members.length} Members Total • {debts.length} Pending
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                  {isLedgerExpanded ? "Hide" : "View"}
                </span>
                {isLedgerExpanded ? <ChevronUp className="text-slate-400 group-hover:text-purple-500" size={20} /> : <ChevronDown className="text-slate-400 group-hover:text-purple-500" size={20} />}
              </div>
          </button>

          {isLedgerExpanded && (
              <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input 
                          type="text"
                          placeholder="Search full ledger..."
                          value={ledgerSearchQuery}
                          onChange={(e) => setLedgerSearchQuery(e.target.value)}
                          className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                      {filteredLedgerMembers.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                              No matching members
                          </div>
                      ) : (
                          filteredLedgerMembers.map((member) => {
                              const balance = member.balance;
                              const isSettled = Math.abs(balance) < 0.01;
                              const isReceivable = balance > 0.01;
                              const isOwed = balance < -0.01;

                              return (
                                  <div 
                                      key={member.id}
                                      className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={cn(
                                              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm",
                                              isReceivable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                              isOwed ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                              "bg-slate-50 text-slate-400 border-slate-100"
                                          )}>
                                              {member.full_name[0]}
                                          </div>
                                          <div className="min-w-0">
                                              <p className="text-slate-800 text-sm font-black truncate">{member.full_name}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                  <span className={cn(
                                                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-tighter",
                                                      isReceivable ? "bg-emerald-500/10 text-emerald-600" : 
                                                      isOwed ? "bg-rose-500/10 text-rose-600" : 
                                                      "bg-slate-100 text-slate-400"
                                                  )}>
                                                      {isReceivable ? "Will Receive" : isOwed ? "Will Pay" : "Settled"}
                                                  </span>
                                                  {member.upi_id && (
                                                      <span className="text-[8px] text-slate-300 font-bold truncate max-w-[80px]">
                                                          {member.upi_id}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                          <div className="flex items-baseline justify-end gap-2 mb-1">
                                              <div className="text-[9px] text-slate-400 font-bold leading-none">
                                                  Paid: <span className="text-slate-600">{formatCurrency(member.total_paid || 0)}</span>
                                              </div>
                                              <div className="text-[9px] text-slate-400 font-bold leading-none">
                                                  Owes: <span className="text-slate-600">{formatCurrency(member.total_owes || 0)}</span>
                                              </div>
                                          </div>
                                          <p className={cn(
                                              "text-sm font-black font-mono leading-none",
                                              isReceivable ? "text-emerald-600" : isOwed ? "text-rose-600" : "text-slate-400"
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
