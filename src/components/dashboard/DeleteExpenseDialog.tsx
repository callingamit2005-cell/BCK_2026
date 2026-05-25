/**
 * DeleteExpenseDialog.tsx - BachatKaro Neon Enterprise Edition
 * UI: Deep Purple/Pink Gradient Background with High-Contrast White Text.
 * 🛡️ LOGIC LOCK: Optimistic Updates, AbortController & Supabase Logic 100% untouched.
 * ✅ FEATURES: Fixed Text Readability, Neon Warning Accents, Glassmorphic Dialog.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------
// Types & Debug Logger
// ----------------------------------------------------------------------
const DEBUG = process.env.NODE_ENV === 'development';
const log = {
  action: (message: string, data?: any) => { if (DEBUG) console.log(`[DeleteExpense] ${message}`, data || ''); },
  error: (message: string, error?: any) => { if (DEBUG) console.error(`[DeleteExpense] ${message}`, error || ''); },
};

interface DeleteExpenseDialogProps {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteExpenseDialog = ({ expenseId, open, onOpenChange }: DeleteExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousExpensesRef = useRef<any[] | null>(null);

  useEffect(() => { if (!open) setDeleteError(null); }, [open]);
  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  const handleDelete = useCallback(async () => {
    if (isDeleting || !expenseId || !user) return;

    setIsDeleting(true);
    setDeleteError(null);

    const queryKey = ['expenses', user.id];
    const previousExpenses = queryClient.getQueryData<any[]>(queryKey);
    previousExpensesRef.current = previousExpenses || null;

    if (previousExpenses) {
      queryClient.setQueryData(queryKey, previousExpenses.filter((exp) => exp.id !== expenseId));
    }

    abortControllerRef.current = new AbortController();
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ 
        title: 'Deleted Successfully', 
        description: 'Transaction has been removed.',
        className: 'bg-emerald-600 text-white border-none shadow-lg' 
      });
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
    } catch (err: any) {
      log.error('Delete failed', err.message);
      if (previousExpensesRef.current) queryClient.setQueryData(queryKey, previousExpensesRef.current);
      setDeleteError(err.message || 'Action failed');
    } finally {
      setIsDeleting(false);
      abortControllerRef.current = null;
    }
  }, [isDeleting, expenseId, user, queryClient, toast, onOpenChange]);

  // ==================== VISIBILITY SYSTEM (NO TEXT LEFT BEHIND) ====================
  const deepGradientBg = "bg-gradient-to-br from-[#1E1B4B] via-[#701A75] to-[#EC4899]/90 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(236,72,153,0.3)]";
  
  // 🛠️ The visibility anchors
  const clearWhiteText = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"; 
  const brightDescription = "text-white/90 font-medium tracking-wide leading-relaxed drop-shadow-sm";
  const neonWarningBox = "bg-rose-500/20 border border-rose-500/40 rounded-[20px] p-4 flex items-start gap-3 backdrop-blur-md";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("rounded-[32px] overflow-hidden p-6 sm:p-8 max-w-md mx-auto transition-all duration-500", deepGradientBg)}>
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />

        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className={cn("text-2xl font-black tracking-tighter flex items-center gap-4", clearWhiteText)}>
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 shadow-inner backdrop-blur-md">
              <Trash2 className="h-6 w-6 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
            Delete Expense?
          </AlertDialogTitle>
          <AlertDialogDescription className={cn("mt-2 text-[15px]", brightDescription)}>
            This will permanently erase this transaction from your records. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Visibility-Fixed Error Display */}
        {deleteError && (
          <div className={neonWarningBox} role="alert">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <p className={cn("text-sm font-black uppercase tracking-wider", clearWhiteText)}>
              {deleteError}
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
          <AlertDialogCancel
            disabled={isDeleting}
            className="h-12 px-6 rounded-[20px] border border-white/20 bg-white/5 text-white font-black hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-[11px]"
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-12 px-8 rounded-[20px] bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] border-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center uppercase tracking-widest text-[11px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExpenseDialog;