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

type TabType = "voice" | "paste" | "manual";

interface ParsedData {
  amount: number | null;
  type: "expense" | "income";
  description: string;
  category: string;
  paymentMode: string;
}

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
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const [mAmount, setMAmount] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mCategory, setMCategory] = useState("Others");
  const [mType, setMType] = useState<"expense" | "income">("expense");
  const [mPaymentMode, setMPaymentMode] = useState("UPI");

  const recognitionRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseIndianAmountText = (text: string): number | null => {
    const lower = text.toLowerCase();

    let multiplier = 1;
    if (lower.includes("lakh") || lower.includes("lac")) multiplier = 100000;
    else if (lower.includes("crore") || lower.includes("cr")) multiplier = 10000000;

    if (multiplier > 1) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|crore|cr)/);
      if (match) {
        return parseFloat(match[1]) * multiplier;
      }
    }

    return null;
  };

  const parseLogic = (text: string): ParsedData => {
    const cleanText = text.replace(/,/g, "");

    let amount: number | null = parseIndianAmountText(cleanText);

    if (!amount) {
      const amountMatch =
        cleanText.match(/(?:INR|RS|₹)\.?\s*([\d]+(?:\.\d{1,2})?)/i) ||
        cleanText.match(/\b([\d]+(?:\.\d{1,2})?)\b/);
      amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    }

    const isCredit = /received|credited|added|refunded|deposit|kamayi|paisa aaya/i.test(cleanText);
    const type = isCredit ? "income" : "expense";

    const merchantMatch = cleanText.match(
      /(?:at|to|for|paid to|vpa)\s+([A-Z0-9\s*&.-]{3,20})(?=\s+on|ref|link|\.|\s|$)/i,
    );
    const description = merchantMatch ? merchantMatch[1].trim() : "Smart Entry";

    let category = "Others";
    if (/zomato|swiggy|food|khana|restaurant|lunch|dinner/i.test(cleanText)) category = "Food";
    if (/amazon|flipkart|shopping|myntra|clothes/i.test(cleanText)) category = "Shopping";
    if (/airtel|jio|vi|recharge|bill|bijli|water|gas/i.test(cleanText)) category = "Bills";
    if (/uber|ola|petrol|fuel|taxi|auto|metro/i.test(cleanText)) category = "Travel";

    let paymentMode = "UPI";
    if (/cash|nagad/i.test(cleanText)) paymentMode = "Cash";
    else if (/card|swipe|debit|credit/i.test(cleanText)) paymentMode = "Card";
    else if (/gpay|google pay/i.test(cleanText)) paymentMode = "GPay";
    else if (/paytm/i.test(cleanText)) paymentMode = "Paytm";
    else if (/phonepe/i.test(cleanText)) paymentMode = "PhonePe";

    return { amount, type, description, category, paymentMode };
  };

  useEffect(() => {
    if ((activeTab === "voice" || activeTab === "paste") && inputText.trim()) {
      const data = parseLogic(inputText);
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
      // UI now passes raw numeric RUPEES to the service layer.
      // createLedgerTransaction is the sole authority for convertToPaisa.
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
        payee: resolvedPayee,
        source: resolvedSource,
      });

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
          title: mTitle,
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

  const applePhysics =
    "transition-all duration-300 ease-butter-soft active:scale-[0.98] touch-action-manipulation";
  const mainCard = "bg-[#0a0014] border border-[#ff0f7b]/40 shadow-2xl rounded-[32px]";
  const inputBase =
    "bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff0f7b]/50 focus:ring-1 focus:ring-[#ff0f7b]/50 transition-all font-mono";

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
      <div className="flex bg-black/40 rounded-[28px] p-1.5 mb-2">
        {(["voice", "paste", "manual"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3.5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.25em] transition-all",
              activeTab === tab
                ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg"
                : "text-slate-400 hover:text-white",
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
                  "absolute inset-0 rounded-full bg-[#ff0f7b]/30 blur-2xl transition-all duration-700",
                  isListening ? "scale-150 opacity-100" : "scale-0 opacity-0",
                )}
              />
              <button
                onClick={toggleListening}
                className={cn(
                  "relative h-28 w-24 rounded-[32px] flex items-center justify-center shadow-2xl overflow-hidden",
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : "bg-gradient-to-br from-[#7C3AED] to-[#EC4899]",
                  applePhysics,
                )}
              >
                {isListening ? (
                  <MicOff size={36} className="text-white" />
                ) : (
                  <Mic size={36} className="text-white" />
                )}
              </button>
            </div>
            <h3 className="text-white text-sm font-black uppercase tracking-[0.3em] mb-2">
              {isListening ? "Listening..." : "Tap to Speak"}
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
              "Spent 500 on Petrol via Card"
            </p>
            {inputText && (
              <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10 w-full italic text-pink-200 text-center text-sm font-mono">
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
              <div className="absolute top-5 right-5 text-[#ff0f7b]/60">
                <ClipboardPaste size={24} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff0f7b] h-6 w-6" />
              <input
                type="number"
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
                placeholder="0.00"
                className={cn("w-full h-20 pl-14 text-4xl font-black", inputBase)}
              />
            </div>

            <div className="relative">
              <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 h-5 w-5" />
              <input
                type="text"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                placeholder="Where did you spend?"
                className={cn("w-full h-14 pl-12 font-bold", inputBase)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">
                  Payment
                </label>
                <select
                  value={mPaymentMode}
                  onChange={(e) => setMPaymentMode(e.target.value)}
                  className={cn("w-full h-12", inputBase)}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode} className="bg-[#0a0014]">
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">
                  Category
                </label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value)}
                  className={cn("w-full h-12", inputBase)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0014]">
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
                      title: mTitle,
                      category: mCategory,
                      type: mType,
                      paymentMode: mPaymentMode,
                    },
                    true,
                  )
                }
                disabled={isSaving || !mAmount}
                className={cn(
                  "flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] shadow-xl",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-50 grayscale",
                )}
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Check size={20} /> Add</>}
              </button>

              <button
                onClick={() => setIsPaySheetOpen(true)}
                disabled={isSaving || !mAmount}
                className={cn(
                  "flex-[1.5] h-16 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] shadow-xl",
                  applePhysics,
                  (isSaving || !mAmount) && "opacity-50 grayscale",
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
                <Sparkles size={60} className="text-[#ff0f7b]" />
              </div>

              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff0f7b] flex items-center gap-2">
                  <Sparkles size={14} /> Intelligence Active
                </span>
                <button
                  onClick={() => setInputText("")}
                  className="text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
                    Detected
                  </p>
                  <p className="text-3xl font-black text-white font-mono tracking-tighter">
                    {formatCurrency(parsedData.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
                    Mode
                  </p>
                  <span className="px-3 py-1 rounded-lg bg-[#ff0f7b]/20 text-[#ff0f7b] text-[10px] font-black uppercase border border-[#ff0f7b]/30">
                    {parsedData.paymentMode}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">
                    {parsedData.description}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    {parsedData.category}
                  </p>
                </div>
              </div>

              {activeTab === "voice" ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <Loader2 className="animate-spin h-4 w-4 text-[#ff0f7b]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest animate-pulse">
                    Auto-saving in 1.5s...
                  </span>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => void handleSave(parsedData)}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] shadow-lg",
                      applePhysics,
                      isSaving && "opacity-50",
                    )}
                  >
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save size={20} /> Save</>}
                  </button>

                  <button
                    onClick={() => setIsPaySheetOpen(true)}
                    disabled={isSaving}
                    className={cn(
                      "flex-[1.5] h-14 bg-[#ff0f7b] rounded-xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] shadow-lg",
                      applePhysics,
                      isSaving && "opacity-50",
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
          <div className="mt-8 flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <AlertCircle className="h-5 w-5 text-[#ff0f7b] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-1">
                Pro Tip
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
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
