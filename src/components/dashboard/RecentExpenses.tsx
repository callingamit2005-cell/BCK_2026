/**
 * ====================================================================
 * PRODUCTION LOCK
 * ====================================================================
 *
 * This component receives amounts in PAISA.
 *
 * Storage layer:
 *   Database     -> Paisa
 *   SQLite       -> Paisa
 *   Native       -> Paisa
 *   Supabase     -> Paisa
 *   Business     -> Paisa
 *
 * ONLY this component converts Paisa -> Rupees for display using
 * convertToRupees().
 *
 * DO NOT move this conversion into helpers, services, sync logic,
 * SQLite layer, or business logic.
 *
 * Breaking this rule will cause Android/Web amount inconsistencies.
 *
 * ====================================================================
 */

/**
 * RecentExpenses Component
 * 
 * Displays a list of recent expenses with month-based pagination.
 * Shows exactly 5 transactions per page for the selected month.
 * Month picker changes the displayed month.
 * 
 * @component
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from "date-fns";
import { 
  Wallet, CreditCard, Banknote, Pencil, Check, X, Loader2, Mic, 
  Trash2, ChevronLeft, ChevronRight,
  Shield, Lock, Scan,
  Store, UtensilsCrossed, Landmark, Smartphone, Mail, ArrowRightLeft, User, Car, Fuel, Activity, FileText, TrendingUp, Pill
} from "lucide-react";
import ExportMenu from "./ExportMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { convertToRupees, convertToPaisa, formatCurrency } from "@/utils/currencyFormatter";
import { StatusState } from "@/components/ui/StatusState";

interface Expense {
  id: string;
  amount: number;
  category: string;
  note?: string;
  payment_mode: string;
  date: string;
  sender?: string;
  type?: string;
}

const getCategoryIcon = (category: string, className: string = "h-5 w-5") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes('shop') || cat.includes('amazon') || cat.includes('flipkart') || cat.includes('myntra') || cat.includes('merchant')) return <Store className={className} />;
  if (cat.includes('travel') || cat.includes('uber') || cat.includes('ola') || cat.includes('irctc')) return <Car className={className} />;
  if (cat.includes('fuel') || cat.includes('petrol') || cat.includes('hp') || cat.includes('iocl') || cat.includes('indian oil')) return <Fuel className={className} />;
  if (cat.includes('food') || cat.includes('zomato') || cat.includes('swiggy') || cat.includes('restaurant')) return <UtensilsCrossed className={className} />;
  if (cat.includes('salary') || cat.includes('income')) return <Banknote className={className} />;
  if (cat.includes('bill') || cat.includes('electricity') || cat.includes('broadband')) return <FileText className={className} />;
  if (cat.includes('recharge') || cat.includes('jio') || cat.includes('airtel') || cat.includes('vi') || cat.includes('mobile')) return <Smartphone className={className} />;
  if (cat.includes('transfer') || cat.includes('self') || cat.includes('upi')) return <ArrowRightLeft className={className} />;
  if (cat.includes('invest') || cat.includes('mutual') || cat.includes('stock')) return <TrendingUp className={className} />;
  if (cat.includes('medic') || cat.includes('pharm') || cat.includes('doctor') || cat.includes('health')) return <Pill className={className} />;
  if (cat.includes('atm') || cat.includes('cash')) return <Banknote className={className} />;
  if (cat.includes('bank')) return <Landmark className={className} />;
  if (cat.includes('card')) return <CreditCard className={className} />;
  if (cat.includes('mail') || cat.includes('email') || cat.includes('gmail')) return <Mail className={className} />;
  if (cat.includes('user') || cat.includes('person')) return <User className={className} />;
  return <Activity className={className} />;
};

interface RecentExpensesProps {
  expenses: Expense[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  onScan?: () => void;
  userId?: string;
  dateFilter?: any;
}

// 🛡️ [PERFORMANCE_STABILIZATION] Memoized Transaction Row Component
const TransactionRow = React.memo(({ 
  expense, 
  isEditing, 
  isDeleting,
  isSaving,
  isListening,
  editAmount,
  editNote,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onVoiceEdit,
  setEditAmount,
  setEditNote,
  t 
}: {
  expense: Expense;
  isEditing: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isListening: boolean;
  editAmount: string;
  editNote: string;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onVoiceEdit: () => void;
  setEditAmount: (val: string) => void;
  setEditNote: (val: string) => void;
  t: any;
}) => {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-3 hover:shadow-md transition-shadow">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={editNote} 
              onChange={(e) => setEditNote(e.target.value)} 
              placeholder={t('expense.note')}
              className="flex-1 h-11 text-sm rounded-xl"
              disabled={isSaving}
            />
            <Input 
              value={editAmount} 
              onChange={(e) => setEditAmount(e.target.value)} 
              placeholder="₹"
              className="w-24 h-11 text-lg font-bold rounded-xl"
              disabled={isSaving}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onVoiceEdit} 
              disabled={isSaving}
              className={`rounded-full h-9 px-3 text-xs ${
                isListening ? "animate-pulse border-red-500 text-red-500 bg-red-50" : ""
              }`}
            >
              <Mic className="h-3.5 w-3.5 mr-1.5" />
              {isListening ? t('voice.listening') : t('voice.smartVoice')}
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="h-9 w-9 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                onClick={onSave} 
                disabled={isSaving || !editAmount}
                className="bg-purple-600 text-white h-9 px-4 rounded-full hover:bg-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full group relative">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-3 overflow-hidden pr-3">
              <div className="h-10 w-10 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all text-muted-foreground group-hover:text-primary">
                {getCategoryIcon(expense.category)}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-foreground text-sm sm:text-base tracking-tight uppercase truncate">
                  {expense.sender || expense.category}
                </h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                  {expense.payment_mode || 'Institutional Transfer'}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-mono text-base sm:text-lg font-bold tabular-nums tracking-tighter ${expense.type === 'income' ? 'text-income' : 'text-primary'}`}>
                {expense.type === 'income' ? '+' : '-'} {formatCurrency(expense.amount)}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {format(new Date(expense.date), 'dd MMM • hh:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="default" 
              onClick={() => onEdit(expense)} 
              className="h-11 px-4 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/20 transition-all gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('common.edit', 'Edit')}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="default" 
              onClick={() => onDelete(expense.id)} 
              className="h-11 px-4 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-all gap-2"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('common.delete', 'Delete')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

const RecentExpenses = ({ 
  expenses, 
  loading, 
  onDelete, 
  onClearAll, 
  onScan,
  userId,
  dateFilter 
}: RecentExpensesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // State management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMicrophoneMessage, setShowMicrophoneMessage] = useState(false);
  
  // ============= PAGINATION STATE =============
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const ITEMS_PER_PAGE = 5;

  // Memoized Callbacks for Row Optimization
  const handleEditClick = useCallback((expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(typeof expense.amount === 'number' ? convertToRupees(expense.amount).toString() : expense.amount.toString());
    setEditNote(expense.note || "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditAmount("");
    setEditNote("");
  }, []);

  const handleSaveWrapper = useCallback(() => {
    handleSave();
  }, [editingId, editAmount, editNote]);

  const handleDeleteWrapper = useCallback((id: string) => {
    handleDelete(id);
  }, []);

  const handleVoiceEditWrapper = useCallback(() => {
    handleSmartVoiceEdit();
  }, []);
  // ============================================

  // Refs
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ============= MONTH PICKER & FILTER LOGIC =============
  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(prev => subMonths(prev, 1));
    setCurrentPage(1); // Reset to first page when month changes
  }, []);
  
  const handleNextMonth = useCallback(() => {
    setSelectedMonth(prev => addMonths(prev, 1));
    setCurrentPage(1);
  }, []);

  // Filter expenses for selected month
  const filteredExpenses = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first
  }, [expenses, selectedMonth]);

  // Pagination calculations
  const totalItems = useMemo(() => filteredExpenses.length, [filteredExpenses]);
  const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
  const startIndex = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);
  
  const paginatedExpenses = useMemo(() => 
    filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE),
  [filteredExpenses, startIndex]);

  const getCurrentRange = useCallback(() => {
    if (totalItems === 0) return "";
    const start = startIndex + 1;
    const end = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    return `${start}-${end} ${t('common.of')} ${totalItems}`;
  }, [startIndex, totalItems, t]);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  }, [currentPage, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  }, [currentPage]);
  // ========================================================

  // ============= VOICE / EDIT / DELETE HANDLERS =============
  const handleSmartVoiceEdit = () => {
    setShowMicrophoneMessage(true);
    
    setTimeout(() => {
      setShowMicrophoneMessage(false);
    }, 5000);

    if (isListening) {
      toast({
        title: t('voice.alreadyListening'),
        description: t('voice.waitForCurrent'),
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ 
        title: t('common.notSupported'), 
        description: t('voice.browserNotSupported'),
        variant: "destructive" 
      });
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const amountMatch = transcript.match(/\d+/);
      
      if (amountMatch) {
        const detectedAmount = amountMatch[0];
        let note = transcript
          .replace(detectedAmount, '')
          .replace(/\b(rs|rupees|rupee|ka|ke|ki|for|and|with|paid)\b/gi, '')
          .replace(/[^\w\s]/gi, '')
          .trim();
        
        if (note) {
          note = note.charAt(0).toUpperCase() + note.slice(1);
        }
        
        setEditAmount(detectedAmount);
        setEditNote(note);
        
        toast({ 
          title: t('voice.smartCapture'), 
          description: `${t('voice.detected')}: ₹${detectedAmount} for ${note || 'expense'}`,
          className: "bg-blue-600 text-white",
          duration: 2000,
        });
      } else {
        toast({ 
          title: t('voice.noAmountDetected'), 
          description: t('voice.includeNumber'),
          variant: "destructive" 
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast({ 
          title: t('voice.noSpeech'), 
          description: t('voice.tryAgain'),
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: t('voice.voiceError'), 
          description: event.error,
          variant: "destructive" 
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setShowMicrophoneMessage(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      toast({ 
        title: t('common.error'), 
        description: t('voice.couldNotStart'),
        variant: "destructive" 
      });
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setIsListening(false);
        setShowMicrophoneMessage(false);
        toast({ 
          title: t('voice.timeout'), 
          description: t('voice.noSpeechDetected'),
          variant: "destructive" 
        });
      }
    }, 10000);
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    if (!editAmount || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      toast({ 
        title: t('expense.invalidAmount'), 
        description: t('expense.enterValidAmount'),
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          amount: convertToPaisa(parseFloat(editAmount)), 
          note: editNote || null
        })
        .eq('id', editingId);
      
      if (error) throw error;
      
      toast({ 
        title: t('expense.updated'), 
        description: t('expense.updateSuccess'),
        className: "bg-green-600 text-white" 
      });
      
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      setEditingId(null);
      setEditAmount("");
      setEditNote("");
      
    } catch (error: any) {
      console.error('Update error:', error);
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    
    const confirmDelete = window.confirm(t('expense.confirmDelete'));
    if (!confirmDelete) return;

    setDeletingId(id);
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ 
        title: t('expense.deleted'), 
        description: t('expense.deleteSuccess'),
        className: "bg-red-600 text-white",
        duration: 3000,
      });
      
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      if (editingId === id) {
        setEditingId(null);
        setEditAmount("");
        setEditNote("");
      }
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getPaymentIcon = (mode: string) => {
    switch(mode?.toLowerCase()) {
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'upi':
        return <Wallet className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };
  // ==========================================================

  if (loading) {
    return (
      <Card className="bg-card rounded-2xl shadow-md border-none overflow-hidden">
        <CardHeader className="px-4 py-4 sm:px-6">
          <CardTitle className="text-base font-bold text-[#333333]">{t('recentExpenses.shortTitle', 'Recent')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse p-3 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-3 rounded-full h-10 w-10"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card rounded-2xl shadow-md border-none overflow-hidden">
      <CardHeader className="px-4 py-4 sm:px-6 border-b border-border/40">
        {/* Title + Month Picker + Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-[#333333]">
              {t('recentExpenses.shortTitle', 'Recent')}
              {totalItems > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({totalItems} {t('common.total')})
                </span>
              )}
            </CardTitle>
          </div>

          {/* Month picker and action hub */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* 🚀 [RESTORED] Scan Button */}
            {onScan && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScan}
                className="h-10 px-3 rounded-xl bg-surface border-border/50 text-foreground font-bold shadow-sm hover:border-primary/30 transition-all active:scale-95 gap-2"
                title="Scan SMS for new transactions"
              >
                <Scan className="h-4 w-4 text-primary" />
                <span className="hidden md:inline text-[10px] uppercase tracking-widest">Scan</span>
              </Button>
            )}

            <div className="flex items-center bg-muted/20 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0 rounded-md"
                title={t('common.prevMonth')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[120px] text-center">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0 rounded-md"
                title={t('common.nextMonth')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 🚀 [RESTORED] Clear All Button */}
            {onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-10 px-3 rounded-xl text-muted-foreground hover:text-expense hover:bg-expense/5 transition-all border border-border/40 hover:border-expense/20 gap-2"
                title="Clear all transactions"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline text-[10px] uppercase tracking-widest">Clear All</span>
              </Button>
            )}

            {/* Export Menu - exports current month's data */}
            <ExportMenu data={filteredExpenses} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Microphone Trust Message */}
        {showMicrophoneMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  {t('voice.microphoneMessage')}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                  <Lock className="h-3 w-3" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalItems === 0 ? (
          <StatusState 
            type="empty" 
            title={t('recentExpenses.noTransactions', 'No Transactions')}
            message={t('recentExpenses.addFirst', 'Record your first transaction to get started.')}
            variant="inline"
            className="py-12"
          />
        ) : (
          <>
            {/* Transactions List */}
            <div className="space-y-3">
              {paginatedExpenses.map((expense) => (
                <TransactionRow
                  key={expense.id}
                  expense={expense}
                  isEditing={editingId === expense.id}
                  isDeleting={deletingId === expense.id}
                  isSaving={isSaving}
                  isListening={isListening}
                  editAmount={editAmount}
                  editNote={editNote}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteWrapper}
                  onSave={handleSaveWrapper}
                  onCancel={handleCancelEdit}
                  onVoiceEdit={handleVoiceEditWrapper}
                  setEditAmount={setEditAmount}
                  setEditNote={setEditNote}
                  t={t}
                />
              ))}
            </div>

            {/* Pagination Controls - Mobile Optimized */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-border/40 gap-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-12 px-6 text-sm font-medium text-muted-foreground hover:text-purple-600 rounded-2xl disabled:opacity-30 w-full sm:w-auto order-2 sm:order-1 border-border/60"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  {t('common.previous')}
                </Button>
                
                <div className="flex items-center gap-3 order-1 sm:order-2">
                  {/* Page range indicator (for small screens) */}
                  <span className="text-sm font-semibold text-purple-600 sm:hidden bg-purple-50 px-4 py-1.5 rounded-full border border-purple-100">
                    {t('common.page')} {currentPage} / {totalPages}
                  </span>
                  
                  {/* Page Numbers (hidden on mobile, visible on sm+) */}
                  <div className="hidden sm:flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages <= 7 ||
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handlePageClick(pageNum)}
                            className={`h-10 w-10 p-0 text-sm font-medium rounded-xl transition-all ${
                              pageNum === currentPage 
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200 hover:bg-purple-700' 
                                : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-50'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return <span key={pageNum} className="text-muted-foreground font-bold px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-12 px-6 text-sm font-medium text-muted-foreground hover:text-purple-600 rounded-2xl disabled:opacity-30 w-full sm:w-auto order-3 border-border/60"
                >
                  {t('common.next')}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Page info (for larger screens) */}
            {totalPages > 1 && (
              <div className="text-center text-xs text-muted-foreground mt-2 hidden sm:block">
                {getCurrentRange()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentExpenses;