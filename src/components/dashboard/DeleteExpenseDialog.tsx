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
        className: 'bg-foreground text-surface border-none shadow-lg' 
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

  // ==================== PREMIUM LIGHT UI SYSTEM ====================
  const premiumCard = "bg-surface border border-border shadow-2xl rounded-[32px] overflow-hidden transform-gpu";
  
  // 🛠️ The visibility anchors
  const clearText = "text-foreground"; 
  const secondaryText = "text-text-secondary font-medium tracking-tight leading-relaxed";
  const alertBox = "bg-background border border-border rounded-[24px] p-5 flex items-start gap-4 shadow-inner";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("p-0 max-w-md mx-auto transition-all duration-500", premiumCard)}>
        
        {/* Top Accent Bar */}
        <div className="h-2 w-full bg-foreground opacity-5" />

        <div className="p-8 sm:p-10 space-y-8">
          <AlertDialogHeader className="space-y-5">
            <AlertDialogTitle className={cn("text-2xl font-bold tracking-tight flex items-center gap-4 uppercase", clearText)}>
              <div className="p-3 rounded-2xl bg-background border border-border shadow-sm">
                <Trash2 className="h-6 w-6 text-text-secondary" />
              </div>
              Delete Record?
            </AlertDialogTitle>
            <AlertDialogDescription className={cn("mt-2 text-base", secondaryText)}>
              This will permanently erase this transaction from your records and cloud synchronization. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Visibility-Fixed Error Display */}
          {deleteError && (
            <div className={alertBox} role="alert">
              <AlertTriangle className="h-5 w-5 text-text-muted shrink-0 mt-0.5" />
              <p className={cn("text-sm font-bold uppercase tracking-widest", clearText)}>
                {deleteError}
              </p>
            </div>
          )}

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4 pt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-14 px-8 rounded-2xl border border-border bg-background text-text-secondary font-bold hover:bg-surface hover:text-foreground transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-[11px] shadow-sm"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-14 px-8 rounded-2xl bg-foreground text-surface font-bold shadow-xl hover:bg-foreground/90 border-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center uppercase tracking-widest text-[11px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wiping...
                </>
              ) : (
                'Confirm Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExpenseDialog;