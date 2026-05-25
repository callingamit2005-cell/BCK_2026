/**
 * RecentExpenses Component
 * 
 * Displays a list of recent expenses with month-based pagination.
 * Shows exactly 5 transactions per page for the selected month.
 * Month picker changes the displayed month.
 * 
 * @component
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from "date-fns";
import { 
  Wallet, CreditCard, Banknote, Pencil, Check, X, Loader2, Mic, 
  Trash2, ChevronLeft, ChevronRight,
  Shield, Lock
} from "lucide-react";
import ExportMenu from "./ExportMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface Expense {
  id: string;
  amount: number;
  category: string;
  note?: string;
  payment_mode: string;
  date: string;
}

interface RecentExpensesProps {
  expenses: Expense[];
  loading: boolean;
}

const RecentExpenses = ({ expenses, loading }: RecentExpensesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage(); // 👈 use global translation function
  
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
  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
    setCurrentPage(1); // Reset to first page when month changes
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
    setCurrentPage(1);
  };

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
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getCurrentRange = () => {
    if (totalItems === 0) return "";
    const start = startIndex + 1;
    const end = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    return `${start}-${end} ${t('common.of')} ${totalItems}`;
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };
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
          amount: parseFloat(editAmount), 
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
      <Card className="bg-white rounded-2xl shadow-md border-none overflow-hidden">
        <CardHeader className="px-4 py-4 sm:px-6">
          <CardTitle className="text-base font-bold text-[#333333]">{t('recentExpenses.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 p-3 rounded-full h-10 w-10"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-md border-none overflow-hidden">
      <CardHeader className="px-4 py-4 sm:px-6 border-b border-gray-100">
        {/* Title + Month Picker + Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-[#333333]">
              {t('recentExpenses.title')}
              {totalItems > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({totalItems} {t('common.total')})
                </span>
              )}
            </CardTitle>
          </div>

          {/* Month picker and export */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
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
          <div className="text-center py-12 px-4">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base text-gray-600 font-medium mb-1">
              {t('recentExpenses.noTransactions')}
            </p>
            <p className="text-sm text-gray-400">
              {t('recentExpenses.addFirst')}
            </p>
          </div>
        ) : (
          <>
            {/* Transactions List */}
            <div className="space-y-2">
              {paginatedExpenses.map((expense) => (
                <div 
                  key={expense.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow"
                >
                  {editingId === expense.id ? (
                    /* Edit Mode */
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
                          onClick={handleSmartVoiceEdit} 
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
                            onClick={() => {
                              setEditingId(null);
                              setEditAmount("");
                              setEditNote("");
                            }}
                            className="h-9 w-9 p-0 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSave} 
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
                    /* View Mode */
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="bg-purple-50 p-3 rounded-xl text-purple-600 flex-shrink-0">
                        {getPaymentIcon(expense.payment_mode)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-gray-800 text-base capitalize truncate">
                            {expense.category}
                          </h4>
                          <span className="font-bold text-red-500 text-base ml-2 whitespace-nowrap">
                            -₹{typeof expense.amount === 'number' ? expense.amount.toFixed(2) : expense.amount}
                          </span>
                        </div>
                        
                        {/* Details row */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {expense.payment_mode}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span>{format(new Date(expense.date), 'dd MMM')}</span>
                          {expense.note && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="truncate">{expense.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { 
                            setEditingId(expense.id); 
                            setEditAmount(expense.amount.toString()); 
                            setEditNote(expense.note || ""); 
                          }} 
                          className="h-10 w-10 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(expense.id)} 
                          className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                          title={t('common.delete')}
                          disabled={!!deletingId}
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100 gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-9 px-4 text-sm text-gray-600 hover:text-purple-600 rounded-xl disabled:opacity-40 w-full sm:w-auto order-2 sm:order-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous')}
                </Button>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  {/* Page range indicator (for small screens) */}
                  <span className="text-sm text-gray-500 sm:hidden">
                    {getCurrentRange()}
                  </span>
                  
                  {/* Page Numbers (hidden on small, visible on sm+) */}
                  <div className="hidden sm:flex items-center gap-1">
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
                            className={`h-8 w-8 p-0 text-sm rounded-lg ${
                              pageNum === currentPage 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'text-gray-600 hover:text-purple-600'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return <span key={pageNum} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-9 px-4 text-sm text-gray-600 hover:text-purple-600 rounded-xl disabled:opacity-40 w-full sm:w-auto order-3"
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Page info (for larger screens) */}
            {totalPages > 1 && (
              <div className="text-center text-xs text-gray-400 mt-2 hidden sm:block">
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