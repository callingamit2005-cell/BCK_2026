import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  ClipboardPaste,
  Sparkles,
  Loader2,
  Save,
  X,
  AlertCircle,
  IndianRupee,
  AlignLeft,
  Check,
  Wallet,
  Smartphone,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, convertToPaisa } from "@/utils/currencyFormatter";
import {
  createLedgerTransaction,
  mergeUnifiedLedgerEntries,
} from "@/features/transactions/ledger";
import { SmartPaySheet } from "./dashboard/SmartPaySheet";
import { parseMultilingualInput, ParsedTransaction } from "@/utils/smartParserEngine";

type TabType = "voice" | "paste" | "manual";

const CATEGORIES = ["Food", "Shopping", "Bills", "Travel", "Health", "Others"];
const PAYMENT_MODES = ["UPI", "Cash", "Card", "GPay", "Paytm", "PhonePe"];

export default function SmartUniversalInput() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("voice");
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);

  const [mAmount, setMAmount] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mCategory, setMCategory] = useState("Others");
  const [mType, setMType] = useState<"expense" | "income">("expense");
  const [mPaymentMode, setMPaymentMode] = useState("UPI");

  const recognitionRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ((activeTab === "voice" || activeTab === "paste") && inputText.trim()) {
      const data = parseMultilingualInput(inputText);
      setParsedData(data);

      if (activeTab === "voice" && data.amount && !isSaving) {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => {
          void handleSave(data);
        }, 1500);
      }
    } else {
      setParsedData(null);
    }

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [inputText, activeTab, isSaving]);

  const handleSave = async (data: any, isManual = false) => {
    if (!user || !data.amount) return;

    setIsSaving(true);
    try {
      // 🛡️ [NORMALIZATION_BOUNDARY_FIX]
      const rawRupees = Number(data.amount);
      const resolvedType = data.type || mType;
      const resolvedCategory = data.category || mCategory;
      const resolvedPaymentMode = data.paymentMode || mPaymentMode;
      const resolvedPayee =
        (data.description || data.title || mTitle || "Universal Entry").trim();
      const resolvedSource = isManual
        ? "manual"
        : activeTab === "voice"
          ? "voice"
          : "paste";

      const savedTransaction = await createLedgerTransaction({
        userId: user.id,
        amount: rawRupees, // Pass Rupees
        type: resolvedType,
        category: resolvedCategory,
        paymentMode: resolvedPaymentMode,
        description: resolvedPayee,
        source: resolvedSource,
        date: new Date().toISOString(),
      });

      // 🛡️ [UI_STATE_SYNCHRONIZATION]
      // Invalidate all financial queries and trigger global refresh for instant UI updates.
      await queryClient.invalidateQueries();
      window.dispatchEvent(new Event('newTransaction'));
      window.dispatchEvent(new Event('sync_queue_updated'));

      toast({
        title: "Safely Recorded",
        description: `${formatCurrency(savedTransaction.amount)} saved to your financial timeline via ${resolvedPaymentMode}.`,
        className: "bg-[#1a1a1a] text-white border border-[#333] shadow-[0_15px_40px_rgba(0,0,0,0.15)]",
      });

      if (isManual) {
        setMAmount("");
        setMTitle("");
        setMCategory("Others");
      } else {
        setInputText("");
        setParsedData(null);
      }
    } catch (err: any) {
      toast({ title: "System Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentReturn = (success: boolean) => {
    if (success) {
      if (activeTab === 'manual') {
        void handleSave({
          amount: mAmount,
          description: mTitle,
          category: mCategory,
          type: mType,
          paymentMode: "Smart Pay (UPI)",
        }, true);
      } else if (parsedData) {
        void handleSave({
          ...parsedData,
          paymentMode: "Smart Pay (UPI)",
        });
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (Capacitor.isNativePlatform()) {
        void SpeechRecognition.stop().catch(() => undefined);
        setIsListening(false);
      } else {
        recognitionRef.current?.stop();
      }
      return;
    }

    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          const permissionStatus = await SpeechRecognition.requestPermissions();
          if (permissionStatus.speechRecognition !== "granted") {
            toast({
              title: "Permission Required",
              description: "Allow microphone access to use voice entry.",
              variant: "destructive",
            });
            return;
          }

          setIsListening(true);
          const result = await SpeechRecognition.start({
            language: "en-IN",
            maxResults: 1,
            partialResults: false,
            popup: false,
          });
          const transcript = result.matches?.[0] ?? "";
          if (transcript) {
            setInputText(transcript);
          }
        } catch {
          toast({
            title: "Voice Error",
            description: "Unable to start microphone input.",
            variant: "destructive",
          });
        } finally {
          setIsListening(false);
        }
      })();
      return;
    }

    const BrowserSpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!BrowserSpeechRecognition) {
      toast({
        title: "Speech Not Supported",
        description: "Voice input is unavailable in this browser.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new BrowserSpeechRecognition();
    recognitionRef.current.lang = "en-IN";
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (e: any) => setInputText(e.results[0][0].transcript);
    recognitionRef.current.start();
  };

  const applePhysics = "transition-all duration-300 ease-butter-soft active:scale-[0.98] touch-action-manipulation";
  const mainCard = "bg-surface border border-border shadow-lg rounded-[28px]";
  const inputBase =
    "bg-background border border-border rounded-xl px-4 text-foreground placeholder:text-text-muted focus:outline-none focus:border-foreground transition-all font-mono";

  return (
    <div className="w-full relative">
      <SmartPaySheet 
        isOpen={isPaySheetOpen}
        onOpenChange={setIsPaySheetOpen}
        amount={convertToPaisa(activeTab === 'manual' ? mAmount : (parsedData?.amount || 0))}
        payeeName={activeTab === 'manual' ? mTitle : (parsedData?.description || "Merchant")}
        transactionNote={`BachatKaro: Pay to ${activeTab === 'manual' ? mTitle : (parsedData?.description || "Merchant")}`}
        onPaymentReturn={handlePaymentReturn}
      />
      <div className={cn("w-full max-w-xl mx-auto p-1.5", mainCard)}>
      <div className="flex bg-background rounded-[22px] p-1 mb-2 border border-border">
        {(["voice", "paste", "manual"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === tab
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-text-secondary hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "voice" && (
          <div className="flex flex-col items-center py-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-10">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-foreground/5 blur-2xl transition-all duration-700",
                  isListening ? "scale-150 opacity-100" : "scale-0 opacity-0",
                )}
              />
              <button
                onClick={toggleListening}
                className={cn(
                  "relative h-32 w-28 rounded-[48px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-700 ease-butter-soft group",
                  isListening
                    ? "bg-[#FEE2E2] border-2 border-[#FECACA] scale-110 shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                    : "bg-gradient-to-b from-[#444] via-[#1a1a1a] to-[#000] border-t border-white/10 text-[#e5e5e5] hover:brightness-110",
                  applePhysics,
                )}
              >
                {/* Metallic Reflection Overlay */}
                {!isListening && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 pointer-events-none" />
                )}
                
                {isListening ? (
                  <MicOff size={40} className="text-[#DC2626] animate-[pulse_2s_ease-in-out_infinite]" />
                ) : (
                  <Mic size={40} className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-110" />
                )}
              </button>
            </div>
            <h3 className="text-foreground text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
              {isListening ? "Listening..." : "Tap to Speak"}
            </h3>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest text-center max-w-[200px]">
              "Spent 500 on Petrol via Card"
            </p>
            {inputText && (
              <div className="mt-8 p-5 bg-background rounded-2xl border border-border w-full italic text-text-secondary text-center text-sm font-medium">
                "{inputText}"
              </div>
            )}
          </div>
        )}

        {activeTab === "paste" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste Bank SMS here..."
                className={cn("w-full min-h-[180px] pt-6", inputBase)}
              />
              <div className="absolute top-5 right-5 text-text-muted">
                <ClipboardPaste size={24} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-6 w-6" />
              <input
                type="number"
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
                placeholder="0.00"
                className={cn("w-full h-20 pl-14 text-4xl font-bold focus:border-foreground", inputBase)}
              />
            </div>

            <div className="relative">
              <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
              <input
                type="text"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                placeholder="Where did you spend?"
                className={cn("w-full h-14 pl-12 font-bold focus:border-foreground", inputBase)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest ml-1">
                  Payment
                </label>
                <select
                  value={mPaymentMode}
                  onChange={(e) => setMPaymentMode(e.target.value)}
                  className={cn("w-full h-12 text-xs font-bold appearance-none focus:border-foreground", inputBase)}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode} className="bg-surface text-foreground">
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest ml-1">
                  Category
                </label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value)}
                  className={cn("w-full h-12 text-xs font-bold appearance-none focus:border-foreground", inputBase)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-surface text-foreground">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  void handleSave(
                    {
                      amount: mAmount,
                      description: mTitle,
                      category: mCategory,
                      type: mType,
                      paymentMode: mPaymentMode,
                    },
                    true,
                  )
                }
                disabled={isSaving || !mAmount}
                className={cn(
                  "flex-1 h-16 bg-background border border-border rounded-xl flex items-center justify-center gap-3 text-foreground font-bold uppercase tracking-widest shadow-sm transition-all",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-30",
                )}
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Check size={20} /> Add</>}
              </button>

              <button
                onClick={() => setIsPaySheetOpen(true)}
                disabled={isSaving || !mAmount}
                className={cn(
                  "flex-[1.5] h-16 bg-foreground text-surface rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-lg transition-all",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-30",
                )}
              >
                <Smartphone size={22} /> Pay & Add
              </button>
            </div>
          </div>
        )}

        {parsedData && parsedData.amount && activeTab !== "manual" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-background border border-border rounded-2xl p-6 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles size={60} className="text-foreground" />
              </div>

              <div className="flex justify-between items-center border-b border-border pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                  <Sparkles size={14} /> AI EXTRACTION ACTIVE
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-border bg-surface text-text-secondary"
                  )}>
                    Accuracy: {Math.round(parsedData.confidence * 100)}%
                  </span>
                  <button
                    onClick={() => setInputText("")}
                    className="text-text-muted hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-1">
                    Detected
                  </p>
                  <p className="text-3xl font-bold text-foreground font-mono tracking-tighter">
                    {formatCurrency(parsedData.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-1">
                    Mode
                  </p>
                  <span className="px-3 py-1 rounded-lg bg-surface text-foreground text-[10px] font-bold uppercase border border-border">
                    {parsedData.paymentMode}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center p-4 bg-surface rounded-xl border border-border">
                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-text-secondary border border-border">
                  <Wallet size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight truncate">
                    {parsedData.description}
                  </p>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                    {parsedData.category}
                  </p>
                </div>
              </div>

              {activeTab === "voice" ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin h-3.5 w-3.5 text-text-secondary" />
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest animate-pulse">
                      Auto-saving record
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => void handleSave(parsedData)}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 h-14 bg-surface border border-border rounded-xl flex items-center justify-center gap-3 text-text-secondary font-bold uppercase tracking-widest shadow-sm transition-all",
                      applePhysics,
                      isSaving && "opacity-30",
                    )}
                  >
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save size={20} /> Save</>}
                  </button>

                  <button
                    onClick={() => setIsPaySheetOpen(true)}
                    disabled={isSaving}
                    className={cn(
                      "flex-[1.5] h-14 bg-foreground text-surface rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-lg transition-all",
                      applePhysics,
                      isSaving && "opacity-30",
                    )}
                  >
                    <Smartphone size={20} /> Pay & Save
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!parsedData && !isListening && activeTab !== "manual" && (
          <div className="mt-8 flex items-start gap-5 p-7 bg-background/50 rounded-[32px] border border-border/40 shadow-inner">
            <div className="h-10 w-10 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-sm">
               <AlertCircle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-[11px] text-[#1a1a1a] font-black uppercase tracking-[0.2em] mb-1.5">
                Forensic Trace Tip
              </p>
              <p className="text-[11px] text-fintech-graphite-muted leading-relaxed font-bold uppercase tracking-tight opacity-70">
                {activeTab === "voice"
                  ? "Speak naturally like describing a transaction. Logic will extract values instantly."
                  : "Insert your Bank SMS into this terminal. Forensic engine will reconstruct the record."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
