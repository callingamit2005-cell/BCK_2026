/**
 * DeleteExpenseDialog.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Security Deletion Terminal.
 * 🛡️ LOGIC LOCK: Optimistic Updates, AbortController & Supabase Logic 100% untouched.
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
import { Loader2, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
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
        title: 'Verified Deletion', 
        description: 'Transaction permanently erased from ledger.',
        className: 'bg-surface border-destructive text-foreground shadow-premium' 
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 max-w-md mx-auto transition-all duration-500 bg-surface border border-border shadow-institutional rounded-modal overflow-hidden">
        
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-destructive" />

        <div className="p-6 sm:p-8 space-y-8">
          <AlertDialogHeader className="space-y-4 text-left">
            <AlertDialogTitle className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-sm shrink-0">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest leading-none">Security Protocol</p>
                <span className="text-xl font-bold tracking-tight text-foreground mt-1 block">Confirm Deletion</span>
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
              This will permanently erase this transaction from your financial ledger and all synchronized cloud instances. <strong className="text-foreground">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 shadow-inner" role="alert">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-destructive mt-0.5">
                {deleteError}
              </p>
            </div>
          )}

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-surface border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-bold text-[11px] uppercase tracking-widest shadow-sm transition-all active:scale-95"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none font-bold text-[11px] uppercase tracking-widest shadow-premium flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wiping...
                </>
              ) : (
                'Erase Record'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExpenseDialog;
