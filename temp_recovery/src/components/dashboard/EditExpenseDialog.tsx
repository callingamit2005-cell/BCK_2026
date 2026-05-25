import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ----------------------------------------------------------------------
// Constants (immutable, typed)
// ----------------------------------------------------------------------
const PAYMENT_MODES = ['UPI', 'Cash', 'Net Banking', 'Card'] as const;
const CATEGORIES = ['Food', 'Shopping', 'Bills', 'Travel', 'Others'] as const;

// Type guards for runtime validation
const isValidPaymentMode = (mode: string): mode is typeof PAYMENT_MODES[number] =>
  PAYMENT_MODES.includes(mode as any);
const isValidCategory = (cat: string): cat is typeof CATEGORIES[number] =>
  CATEGORIES.includes(cat as any);

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Expense {
  id: string;
  amount: number;
  category: string;
  payment_mode: string | null;
  date: string;
}

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ----------------------------------------------------------------------
// Debug logger (easily removable)
// ----------------------------------------------------------------------
const DEBUG = process.env.NODE_ENV === 'development';
const log = {
  action: (message: string, data?: any) => {
    if (DEBUG) console.log(`[EditExpense] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    if (DEBUG) console.error(`[EditExpense] ${message}`, error || '');
  },
  duration: (label: string, startTime: number) => {
    if (DEBUG) console.log(`[EditExpense] ${label} took ${Date.now() - startTime}ms`);
  },
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
const EditExpenseDialog = ({
  expense,
  open,
  onOpenChange,
}: EditExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [category, setCategory] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ref to store the original expense for optimistic rollback
  const originalExpenseRef = useRef<Expense | null>(null);

  // AbortController for fetch
  const abortControllerRef = useRef<AbortController | null>(null);

  // --------------------------------------------------------------------
  // Memoized derived values
  // --------------------------------------------------------------------
  const isFormValid = useMemo(() => {
    const num = parseFloat(amount);
    return (
      !isNaN(num) &&
      num > 0 &&
      isValidPaymentMode(paymentMode) &&
      isValidCategory(category)
    );
  }, [amount, paymentMode, category]);

  // --------------------------------------------------------------------
  // Handlers (useCallback to prevent unnecessary re-renders)
  // --------------------------------------------------------------------
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && expense) {
        // Prefill form with expense data
        setAmount(String(expense.amount));
        setPaymentMode(expense.payment_mode ?? '');
        setCategory(expense.category);
        setSubmitError(null);
        originalExpenseRef.current = expense; // store for optimistic update
        log.action('Dialog opened', { expenseId: expense.id });
      }
      onOpenChange(isOpen);
    },
    [expense, onOpenChange]
  );

  // Cancel any ongoing request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset error when dialog closes
  useEffect(() => {
    if (!open) {
      setSubmitError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Guard: prevent duplicate submissions
      if (isSubmitting) {
        log.action('Duplicate submission blocked');
        return;
      }

      // Guard: missing expense or user
      if (!expense || !user) {
        log.error('Submit aborted: missing expense or user');
        return;
      }

      // Validate all fields
      const numericAmount = parseFloat(amount);
      if (!isFormValid) {
        toast({
          title: 'Error',
          description: 'Please fill in all fields correctly',
          variant: 'destructive',
        });
        return;
      }

      // Security: ensure paymentMode and category are from allowed list
      if (!isValidPaymentMode(paymentMode) || !isValidCategory(category)) {
        log.error('Invalid category or payment mode', { paymentMode, category });
        toast({
          title: 'Error',
          description: 'Invalid selection',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      // Start performance measurement
      const startTime = Date.now();

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Optimistic update: update React Query cache immediately
      const queryKey = ['expenses', user.id];
      const previousExpenses = queryClient.getQueryData<any[]>(queryKey);

      if (previousExpenses) {
        queryClient.setQueryData(queryKey, (old: any[] | undefined) =>
          old?.map((exp) =>
            exp.id === expense.id
              ? {
                  ...exp,
                  amount: numericAmount,
                  payment_mode: paymentMode,
                  category,
                }
              : exp
          )
        );
      }

      log.action('Submitting update', { expenseId: expense.id, amount: numericAmount });

      try {
        // Actual update to Supabase
        const { error } = await supabase
          .from('expenses')
          .update({
            amount: numericAmount,
            payment_mode: paymentMode,
            category: category,
          })
          .eq('id', expense.id)
          .eq('user_id', user.id); // Security: double‑check user ownership

        if (error) throw error;

        log.duration('Update successful', startTime);
        toast({
          title: 'Success',
          description: 'Expense updated successfully!',
        });

        // Invalidate queries to ensure consistency (React Query will refetch)
        queryClient.invalidateQueries({ queryKey });

        // Close dialog
        onOpenChange(false);
      } catch (err: any) {
        // Log error (without sensitive data)
        log.error('Update failed', err.message);

        // Revert optimistic update
        if (previousExpenses) {
          queryClient.setQueryData(queryKey, previousExpenses);
        }

        setSubmitError(err.message || 'Update failed');
        toast({
          title: 'Update Failed',
          description: err.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
        abortControllerRef.current = null;
      }
    },
    [
      isSubmitting,
      expense,
      user,
      amount,
      isFormValid,
      paymentMode,
      category,
      queryClient,
      toast,
      onOpenChange,
    ]
  );

  // Cancel ongoing request if dialog closes while submitting
  useEffect(() => {
    if (!open && isSubmitting) {
      abortControllerRef.current?.abort();
      setIsSubmitting(false);
    }
  }, [open, isSubmitting]);

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          bg-white/90
          backdrop-blur-md
          border border-gray-200/40
          rounded-2xl
          shadow-2xl
          p-6
        "
        // Prevent closing by clicking outside while submitting
        onInteractOutside={isSubmitting ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Edit Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount (₹)</Label>
            <Input
              id="edit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              disabled={isSubmitting}
              className="
                border border-gray-300
                rounded-lg
                focus:ring-2 focus:ring-purple-400
                focus:border-purple-500
                transition-all duration-200
              "
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label htmlFor="edit-payment">Payment Mode</Label>
            <Select
              value={paymentMode}
              onValueChange={setPaymentMode}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="edit-payment"
                className="
                  border border-gray-300
                  rounded-lg
                  focus:ring-2 focus:ring-purple-400
                  transition-all duration-200
                "
              >
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="edit-category"
                className="
                  border border-gray-300
                  rounded-lg
                  focus:ring-2 focus:ring-purple-400
                  transition-all duration-200
                "
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error display */}
          {submitError && (
            <p className="text-sm text-red-600 mt-2" role="alert">
              ⚠️ {submitError}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="
                rounded-xl
                transition-all duration-200
                hover:bg-gray-100
              "
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="
                bg-gradient-to-r from-purple-600 to-pink-600
                text-white
                rounded-xl
                shadow-lg
                hover:brightness-110
                hover:scale-[1.03]
                transition-all duration-200
                disabled:opacity-50 disabled:hover:scale-100
              "
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;