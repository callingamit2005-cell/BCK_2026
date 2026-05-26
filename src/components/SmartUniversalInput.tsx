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
        title: "Saved Successfully!",
        description: `${formatCurrency(savedTransaction.amount)} recorded via ${resolvedPaymentMode}`,
        className: "bg-emerald-600 text-white border-none shadow-lg",
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
  const mainCard = "bg-surface border border-border shadow-lg rounded-[24px]";
  const inputBase =
    "bg-white/5 border border-white/5 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all font-mono";

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
      <div className={cn("w-full max-w-xl mx-auto p-1", mainCard)}>
      <div className="flex bg-background/50 rounded-[20px] p-1 mb-2 border border-white/5">
        {(["voice", "paste", "manual"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all",
              activeTab === tab
                ? "bg-white text-background shadow-sm"
                : "text-text-muted hover:text-white hover:bg-white/5",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "voice" && (
          <div className="flex flex-col items-center py-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-10">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-white/5 blur-2xl transition-all duration-700",
                  isListening ? "scale-150 opacity-100" : "scale-0 opacity-0",
                )}
              />
              <button
                onClick={toggleListening}
                className={cn(
                  "relative h-28 w-24 rounded-[32px] flex items-center justify-center shadow-lg overflow-hidden",
                  isListening
                    ? "bg-white text-background animate-pulse"
                    : "bg-surface border border-white/10 text-white",
                  applePhysics,
                )}
              >
                {isListening ? (
                  <MicOff size={36} />
                ) : (
                  <Mic size={36} />
                )}
              </button>
            </div>
            <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-60">
              {isListening ? "Listening..." : "Tap to Speak"}
            </h3>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest text-center">
              "Spent 500 on Petrol via Card"
            </p>
            {inputText && (
              <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10 w-full italic text-white/60 text-center text-sm font-medium">
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
              <div className="absolute top-5 right-5 text-white/20">
                <ClipboardPaste size={24} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 h-6 w-6" />
              <input
                type="number"
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
                placeholder="0.00"
                className={cn("w-full h-20 pl-14 text-4xl font-black focus:border-white/20", inputBase)}
              />
            </div>

            <div className="relative">
              <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 h-5 w-5" />
              <input
                type="text"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                placeholder="Where did you spend?"
                className={cn("w-full h-14 pl-12 font-bold focus:border-white/20", inputBase)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-white/20 tracking-widest ml-1">
                  Payment
                </label>
                <select
                  value={mPaymentMode}
                  onChange={(e) => setMPaymentMode(e.target.value)}
                  className={cn("w-full h-12 text-xs font-bold appearance-none focus:border-white/20", inputBase)}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode} className="bg-surface">
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-white/20 tracking-widest ml-1">
                  Category
                </label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value)}
                  className={cn("w-full h-12 text-xs font-bold appearance-none focus:border-white/20", inputBase)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-surface">
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
                  "flex-1 h-16 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-3 text-white/60 font-bold uppercase tracking-widest shadow-lg",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-20",
                )}
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Check size={20} /> Add</>}
              </button>

              <button
                onClick={() => setIsPaySheetOpen(true)}
                disabled={isSaving || !mAmount}
                className={cn(
                  "flex-[1.5] h-16 bg-white text-background rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-xl",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-20",
                )}
              >
                <Smartphone size={22} /> Pay & Add
              </button>
            </div>
          </div>
        )}

        {parsedData && parsedData.amount && activeTab !== "manual" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={60} className="text-white" />
              </div>

              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <Sparkles size={14} /> Intelligence Active
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border",
                    parsedData.confidence > 0.8 ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                    parsedData.confidence > 0.5 ? "text-amber-400 border-amber-400/20 bg-amber-400/5" :
                    "text-rose-400 border-rose-400/20 bg-rose-400/5"
                  )}>
                    Accuracy: {Math.round(parsedData.confidence * 100)}%
                  </span>
                  <button
                    onClick={() => setInputText("")}
                    className="text-white/20 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">
                    Detected
                  </p>
                  <p className="text-3xl font-black text-white font-mono tracking-tighter">
                    {formatCurrency(parsedData.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">
                    Mode
                  </p>
                  <span className="px-3 py-1 rounded-lg bg-white/5 text-white/60 text-[9px] font-bold uppercase border border-white/10">
                    {parsedData.paymentMode}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 border border-white/5">
                  <Wallet size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white uppercase tracking-wide truncate">
                    {parsedData.description}
                  </p>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    {parsedData.category}
                  </p>
                </div>
              </div>

              {activeTab === "voice" ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin h-3.5 w-3.5 text-white/40" />
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                      Auto-saving in 1.5s
                    </span>
                  </div>
                  {parsedData.confidence < 0.6 && (
                    <p className="text-[8px] text-amber-400/40 font-bold uppercase tracking-widest text-center">
                      Low confidence. Verify details or edit.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => void handleSave(parsedData)}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 h-14 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-3 text-white/60 font-bold uppercase tracking-widest shadow-lg",
                      applePhysics,
                      isSaving && "opacity-20",
                    )}
                  >
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save size={20} /> Save</>}
                  </button>

                  <button
                    onClick={() => setIsPaySheetOpen(true)}
                    disabled={isSaving}
                    className={cn(
                      "flex-[1.5] h-14 bg-white text-background rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-xl",
                      applePhysics,
                      isSaving && "opacity-20",
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
          <div className="mt-8 flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <AlertCircle className="h-5 w-5 text-white/20 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
                Pro Tip
              </p>
              <p className="text-[9px] text-white/20 leading-relaxed font-bold uppercase tracking-wide">
                {activeTab === "voice"
                  ? "Talk naturally like you're telling a friend. We'll extract amount and merchant instantly."
                  : "Copy your Bank SMS and paste it here. We'll do the rest."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
