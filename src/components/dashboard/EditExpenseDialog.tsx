/**
 * EditExpenseDialog.tsx - BachatKaro Neon Enterprise Edition
 * UI: High-Contrast Light Mode with Signature Purple/Pink Gradients.
 * 🛡️ LOGIC LOCK: Validation, Optimistic Updates, & Supabase Logic 100% untouched.
 * ✅ FEATURES: Responsive Inputs, Action Feedback, Enterprise Styling.
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
import { Loader2, Pencil, Check } from 'lucide-react';
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
      // Display amount in Rupees (convert PAISA via convertToRupees)
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

    // Optimistic Cache Update
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

      toast({ title: 'Updated Successfully', description: 'Transaction details saved.', className: "bg-emerald-600 text-white border-none shadow-lg" });
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
    } catch (err: any) {
      if (previousExpenses) queryClient.setQueryData(queryKey, previousExpenses);
      setSubmitError(err.message || 'Update failed');
      toast({ title: 'Error', description: 'Failed to update transaction.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [isSubmitting, expense, user, amount, isFormValid, paymentMode, category, queryClient, toast, onOpenChange]);

  // ==================== PREMIUM LIGHT UI SYSTEM ====================
  const gradientHeader = "bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#D946EF]";
  const inputStyle = "h-14 rounded-[16px] bg-slate-50 border-slate-200 text-slate-900 focus:border-[#EC4899] focus:ring-[#EC4899]/10 font-bold transition-all";
  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] bg-white rounded-[32px] overflow-hidden p-0 border-none shadow-2xl">
        <DialogDescription className="sr-only">Edit details of your transaction, including amount, payment mode, and category.</DialogDescription>
        {/* Accent Top Bar */}
        <div className={cn("h-2 w-full", gradientHeader)} />
        
        <div className="p-6 sm:p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
              <div className="p-2.5 rounded-[14px] bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                <Pencil className="h-5 w-5" />
              </div>
              Edit Transaction
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-amount" className={labelStyle}>Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn("text-xl tracking-tight", inputStyle)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Select */}
              <div className="space-y-2">
                <Label className={labelStyle}>Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode} disabled={isSubmitting}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-white border-slate-200 shadow-xl text-slate-900">
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="font-bold py-3 cursor-pointer text-slate-900 focus:text-purple-700">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label className={labelStyle}>Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-white border-slate-200 shadow-xl text-slate-900">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-bold py-3 cursor-pointer text-slate-900 focus:text-purple-700">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider animate-in fade-in">
                ⚠️ {submitError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-14 rounded-[20px] font-black uppercase tracking-widest text-[11px] text-slate-400 hover:bg-slate-50 transition-all"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={cn("flex-1 h-14 rounded-[20px] font-black uppercase tracking-widest text-[11px] transition-all active:scale-95", gradientHeader)}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" /> Save Changes</>
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
