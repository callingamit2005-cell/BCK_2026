/**
 * EditExpenseDialog.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Transaction Edit Terminal.
 * 🛡️ LOGIC LOCK: Validation, Optimistic Updates, & Supabase Logic 100% untouched.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, Pencil, Check, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { convertToPaisa, convertToRupees } from '@/utils/currencyFormatter';

// ----------------------------------------------------------------------
// Constants & Logic Helpers (LOCKED)
// ----------------------------------------------------------------------
const PAYMENT_MODES = ['UPI', 'Cash', 'Net Banking', 'Card'] as const;
const CATEGORIES = ['Food', 'Shopping', 'Bills', 'Travel', 'Others'] as const;

const isValidPaymentMode = (mode: string): mode is typeof PAYMENT_MODES[number] =>
  PAYMENT_MODES.includes(mode as any);
const isValidCategory = (cat: string): cat is typeof CATEGORIES[number] =>
  CATEGORIES.includes(cat as any);

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

const EditExpenseDialog = ({ expense, open, onOpenChange }: EditExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // --------------------------------------------------------------------
  // Logic Engine (UNTOUCHED)
  // --------------------------------------------------------------------
  const isFormValid = useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isValidPaymentMode(paymentMode) && isValidCategory(category);
  }, [amount, paymentMode, category]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && expense) {
      setAmount(String(convertToRupees(expense.amount)));
      setPaymentMode(expense.payment_mode ?? '');
      setCategory(expense.category);
      setSubmitError(null);
    }
    onOpenChange(isOpen);
  }, [expense, onOpenChange]);

  useEffect(() => { return () => abortControllerRef.current?.abort(); }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !expense || !user || !isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    abortControllerRef.current = new AbortController();

    const amountInPaisa = convertToPaisa(amount);
    const queryKey = ['expenses', user.id];
    const previousExpenses = queryClient.getQueryData<any[]>(queryKey);

    if (previousExpenses) {
      queryClient.setQueryData(queryKey, (old: any[] | undefined) =>
        old?.map((exp) => exp.id === expense.id ? { ...exp, amount: amountInPaisa, payment_mode: paymentMode, category } : exp)
      );
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ amount: amountInPaisa, payment_mode: paymentMode, category })
        .eq('id', expense.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ 
        title: 'Verified Update', 
        description: 'Transaction details secured in ledger.', 
        className: "bg-surface border-primary text-foreground shadow-premium" 
      });
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
    } catch (err: any) {
      if (previousExpenses) queryClient.setQueryData(queryKey, previousExpenses);
      setSubmitError(err.message || 'Update failed');
      toast({ title: 'Sync Error', description: 'Failed to update transaction.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [isSubmitting, expense, user, amount, isFormValid, paymentMode, category, queryClient, toast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] bg-surface border border-border rounded-modal overflow-hidden p-0 shadow-institutional">
        <DialogDescription className="sr-only">Edit details of your transaction, including amount, payment mode, and category.</DialogDescription>
        
        <div className="h-1.5 w-full bg-primary" />
        
        <div className="p-6 sm:p-8 space-y-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Record Audit</p>
                <span className="text-xl font-bold tracking-tight text-foreground mt-1 block">Modify Entry</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Volume (₹)</Label>
              <div className="relative group">
                <Input
                  id="edit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 rounded-xl bg-muted/20 border-border/50 text-xl font-bold text-foreground font-mono tabular-nums tracking-tighter focus:ring-primary focus:border-primary/50 transition-all pl-10 shadow-sm"
                  disabled={isSubmitting}
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground group-focus-within:text-primary">₹</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Transport</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode} disabled={isSubmitting}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-semibold text-foreground focus:ring-primary focus:border-primary/50 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-surface shadow-institutional">
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="font-bold text-sm py-2.5 focus:bg-primary/5">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Sector</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/50 text-sm font-semibold text-foreground focus:ring-primary focus:border-primary/50 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-surface shadow-institutional">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-bold text-sm py-2.5 focus:bg-primary/5">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {submitError && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 shadow-inner" role="alert">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-destructive">
                  {submitError}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-xl bg-surface border-border text-muted-foreground hover:bg-muted font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                disabled={isSubmitting}
              >
                Abort
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-widest shadow-premium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" /> Save Record</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
