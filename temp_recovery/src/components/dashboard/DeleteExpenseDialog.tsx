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
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ----------------------------------------------------------------------
// Debug logger (easily removable)
// ----------------------------------------------------------------------
const DEBUG = process.env.NODE_ENV === 'development';
const log = {
  action: (message: string, data?: any) => {
    if (DEBUG) console.log(`[DeleteExpense] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    if (DEBUG) console.error(`[DeleteExpense] ${message}`, error || '');
  },
  duration: (label: string, startTime: number) => {
    if (DEBUG) console.log(`[DeleteExpense] ${label} took ${Date.now() - startTime}ms`);
  },
};

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface DeleteExpenseDialogProps {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
const DeleteExpenseDialog = ({
  expenseId,
  open,
  onOpenChange,
}: DeleteExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // AbortController for fetch
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to store the original expense list for optimistic rollback
  const previousExpensesRef = useRef<any[] | null>(null);

  // --------------------------------------------------------------------
  // Helper: clear error when dialog opens/closes
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!open) {
      setDeleteError(null);
    }
  }, [open]);

  // --------------------------------------------------------------------
  // Cancel any ongoing request on unmount
  // --------------------------------------------------------------------
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // --------------------------------------------------------------------
  // Handle delete
  // --------------------------------------------------------------------
  const handleDelete = useCallback(async () => {
    // Guard: prevent duplicate submissions
    if (isDeleting) {
      log.action('Duplicate delete blocked');
      return;
    }

    // Guard: missing expenseId or user
    if (!expenseId || !user) {
      log.error('Delete aborted: missing expenseId or user');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    // Store current cache for optimistic rollback
    const queryKey = ['expenses', user.id];
    const previousExpenses = queryClient.getQueryData<any[]>(queryKey);
    previousExpensesRef.current = previousExpenses || null;

    // Optimistic update: remove the expense from cache immediately
    if (previousExpenses) {
      queryClient.setQueryData(
        queryKey,
        previousExpenses.filter((exp) => exp.id !== expenseId)
      );
    }

    const startTime = Date.now();
    log.action('Deleting expense', { expenseId });

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // Perform delete with user ownership check (security)
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id); // 🔒 security: ensure ownership

      if (error) throw error;

      log.duration('Delete successful', startTime);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully.',
      });

      // Invalidate queries to ensure consistency (React Query will refetch)
      queryClient.invalidateQueries({ queryKey });

      // Close dialog
      onOpenChange(false);
    } catch (err: any) {
      log.error('Delete failed', err.message);

      // Revert optimistic update
      if (previousExpensesRef.current) {
        queryClient.setQueryData(queryKey, previousExpensesRef.current);
      }

      setDeleteError(err.message || 'Delete failed');
      toast({
        title: 'Delete Failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      abortControllerRef.current = null;
    }
  }, [isDeleting, expenseId, user, queryClient, toast, onOpenChange]);

  // --------------------------------------------------------------------
  // Cancel ongoing request if dialog closes while deleting
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!open && isDeleting) {
      abortControllerRef.current?.abort();
      setIsDeleting(false);
    }
  }, [open, isDeleting]);

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this expense? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteError && (
          <p className="text-sm text-red-600 mt-2" role="alert">
            ⚠️ {deleteError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExpenseDialog;