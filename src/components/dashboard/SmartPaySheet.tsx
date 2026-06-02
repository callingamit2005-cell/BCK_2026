/**
 * SmartPaySheet.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Security Institutional Payment Terminal.
 * 🛡️ LOGIC LOCK: Payment orchestrator, UPI transport, and settlement state machine 100% untouched.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  PAYMENT_APPS, 
  PaymentAppConfig, 
  LAST_USED_PAY_APP_KEY
} from "@/config/paymentAppsConfig";
import { cn } from "@/lib/utils";
import { 
  Smartphone, ChevronRight, CheckCircle2, IndianRupee, Landmark, 
  AlertCircle, Info, Users, Sparkles, CreditCard, ArrowRight, ShieldCheck, X, Loader2,
  Wallet, Zap
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { isValidUPI, normalizeUPI } from '@/utils/upiValidator'; 
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app'; 
import { AppLauncher } from '@capacitor/app-launcher'; 
import { useToast } from '@/hooks/use-toast';
import { checkIsAppInstalled } from '@/integrations/smsBridge';
import { startVipWaitlistCheckout } from '@/services/vipWaitlistCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { paymentOrchestrator, SettlementIntent } from '@/services/paymentOrchestrator';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Unified Payment Target Types (Locked)
export type PaymentTargetType = 'p2p' | 'merchant';

export interface PaymentTarget {
  id: string;
  name: string;
  type: PaymentTargetType;
  amount: number; // in Paisa
  upiId?: string;
  metadata?: any;
}

interface IdentitySetupViewProps {
    selectedTarget: PaymentTarget | null;
    senderId?: string;
    upiInput: string;
    setUpiInput: (val: string) => void;
    isSavingIdentity: boolean;
    setupError: string | null;
    setSetupError: (err: string | null) => void;
    handleSaveIdentity: () => void;
    setView: (view: any) => void;
}

/**
 * 🛡️ [ARCHITECTURAL_LOCK] IdentitySetupView
 * Logic preserved exactly as extracted.
 */
const IdentitySetupView: React.FC<IdentitySetupViewProps> = ({
    selectedTarget,
    senderId,
    upiInput,
    setUpiInput,
    isSavingIdentity,
    setupError,
    setSetupError,
    handleSaveIdentity,
    setView
}) => {
    const isSelf = selectedTarget?.id === senderId;
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Set Payment Address</h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {selectedTarget?.name} requires a validated UPI ID to receive institutional settlements.
                </p>
            </div>
            
            <div className="fintech-card p-6 space-y-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">UPI ID (VPA)</Label>
                    <div className="relative">
                      <Input 
                          ref={inputRef}
                          value={upiInput} 
                          onChange={(e) => { 
                              setUpiInput(e.target.value); 
                              setSetupError(null); 
                          }} 
                          placeholder="e.g. name@oksbi" 
                          className="h-14 bg-muted/20 border-border/50 text-foreground font-semibold focus:ring-primary focus:border-primary/50 rounded-xl px-12" 
                      />
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center gap-2 px-1">
                        <Info className="h-3.5 w-3.5 text-primary/60" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Format Requirement: user@handle</p>
                    </div>
                </div>

                {setupError && (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 flex items-center gap-3 animate-in fade-in zoom-in-95">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs font-semibold text-destructive">{setupError}</p>
                    </div>
                )}

                <Button 
                  onClick={handleSaveIdentity} 
                  disabled={isSavingIdentity || !isValidUPI(upiInput)} 
                  className="w-full h-14 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-widest rounded-xl shadow-premium active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSavingIdentity ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Verify & Save Identity
                </Button>
            </div>

            {!isSelf && (
                <div className="flex flex-col gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${selectedTarget?.name}, please add your UPI ID on BachatKaro so I can settle our debts! ✨`)}`, "_blank")} 
                      className="h-14 text-muted-foreground font-bold uppercase text-[11px] tracking-widest border border-border rounded-xl hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                        Request via WhatsApp
                    </Button>
                    <button 
                      onClick={() => setView('selector')} 
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-[0.2em] text-center py-2 transition-colors"
                    >
                      Cancel & Go Back
                    </button>
                </div>
            )}
        </div>
    );
};

interface SmartPaySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTarget?: PaymentTarget | null;
  availableP2PTargets?: PaymentTarget[];
  onPaymentReturn: (success: boolean, target: PaymentTarget, idempotencyKey?: string) => void;
  groupId?: string;
  senderId?: string;
  onIdentityUpdated?: () => void;
}

export const SmartPaySheet: React.FC<SmartPaySheetProps> = React.memo(({
  isOpen,
  onOpenChange,
  preselectedTarget = null,
  availableP2PTargets = [],
  onPaymentReturn,
  groupId,
  senderId,
  onIdentityUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 1. Unified State Management (Logic Locked)
  const initialTarget = useMemo(() => preselectedTarget, [preselectedTarget?.id, preselectedTarget?.amount]);
  const [selectedTarget, setSelectedTarget] = useState<PaymentTarget | null>(initialTarget);
  
  useEffect(() => {
    if (initialTarget && initialTarget.id !== selectedTarget?.id) {
      setSelectedTarget(initialTarget);
    }
  }, [initialTarget?.id]);

  const [activeIntent, setActiveIntent] = useState<SettlementIntent | null>(null);
  const [view, setView] = useState<'selector' | 'pay_apps' | 'verifying' | 'identity_setup'>(preselectedTarget ? 'pay_apps' : 'selector');
  
  // 🛡️ [VIEWPORT_STABILIZATION_LOGIC] (Locked)
  useEffect(() => {
    if (!isOpen || !window.visualViewport) return;
    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const diff = window.innerHeight - vv.height;
      setKeyboardHeight(diff > 150 ? diff : 0);
    };
    window.visualViewport.addEventListener('resize', handleViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  }, [isOpen]);

  const [installedApps, setInstalledApps] = useState<PaymentAppConfig[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [lastUsedAppId, setLastUsedAppId] = useState<string | null>(localStorage.getItem(LAST_USED_PAY_APP_KEY));

  // Identity Setup State (Locked)
  const [upiInput, setUpiInput] = useState("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // 🛡️ [HARDWARE_BACK_BUTTON] (Locked)
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = async () => {
        if (view === 'selector' || preselectedTarget) onOpenChange(false);
        else setView('selector');
    };
    const listener = App.addListener('backButton', () => handleBack());
    return () => { listener.then(l => l.remove()); };
  }, [isOpen, view, preselectedTarget, onOpenChange]);

  // Sync state when sheet opens (Locked)
  useEffect(() => {
    if (isOpen) {
      if (view === 'verifying') return;
      if (preselectedTarget) {
        setSelectedTarget(preselectedTarget);
        const isTargetValid = typeof isValidUPI === 'function' ? isValidUPI(preselectedTarget.upiId) : false;
        if (preselectedTarget.type === 'p2p' && !isTargetValid) {
            setUpiInput(preselectedTarget.upiId || "");
            setView('identity_setup');
        } else setView('pay_apps');
      } else {
        setSelectedTarget(null);
        setView('selector');
      }
      setSetupError(null);
    }
  }, [isOpen, preselectedTarget]);

  // 🛡️ RECOVERY LISTENER (Locked)
  useEffect(() => {
    const handleRecovery = (e: any) => {
        const intent = e.detail as SettlementIntent;
        if (intent.status === 'success' || intent.status === 'failed') return;
        const target: PaymentTarget = {
            id: intent.receiver_id,
            name: intent.metadata?.receiver_name || "Member",
            type: 'p2p',
            amount: intent.amount,
            metadata: intent.metadata
        };
        setSelectedTarget(target);
        setActiveIntent(intent);
        setView('verifying');
        onOpenChange(true);
    };
    window.addEventListener('payment_recovery_triggered', handleRecovery);
    return () => window.removeEventListener('payment_recovery_triggered', handleRecovery);
  }, [onOpenChange]);

  // 2. Detect Installed Apps (Locked)
  useEffect(() => {
    if (view !== 'pay_apps' || !isOpen) return;
    const initDetection = async () => {
      setIsDetecting(true);
      const whitelist = ['gpay', 'phonepe', 'paytm', 'bhim', 'amazonpay'];
      const filteredApps = PAYMENT_APPS.filter(app => whitelist.includes(app.id));
      if (Capacitor.getPlatform() === 'android') {
        const detectionResults = await Promise.all(
          filteredApps.map(async (app) => {
            if (!app.packageName) return { ...app, installed: true };
            const installed = await checkIsAppInstalled(app.packageName);
            return { ...app, installed };
          })
        );
        setInstalledApps(detectionResults.filter(app => (app as any).installed) as any);
      } else setInstalledApps(filteredApps as any);
      setIsDetecting(false);
    };
    initDetection();
  }, [view, isOpen]);

  const recommendedApp = useMemo(() => {
    if (installedApps.length === 0) return null;
    return installedApps.find(app => app.id === lastUsedAppId) || installedApps[0];
  }, [lastUsedAppId, installedApps]);

  const otherApps = useMemo(() => {
    if (!recommendedApp) return installedApps;
    return installedApps.filter(app => app.id !== recommendedApp.id);
  }, [recommendedApp, installedApps]);

  // 4. Execution Handlers (Locked)
  const handleTargetSelect = (target: PaymentTarget) => {
    setSelectedTarget(target);
    setSetupError(null);
    if (target.type === 'merchant') handleMerchantPayment(target);
    else {
      const isTargetValid = typeof isValidUPI === 'function' ? isValidUPI(target.upiId) : false;
      if (!isTargetValid) {
        setUpiInput(target.upiId || "");
        setView('identity_setup');
      } else setView('pay_apps');
    }
  };

  const handleSaveIdentity = async () => {
    if (!selectedTarget) return;
    setSetupError(null);
    const normalized = normalizeUPI(upiInput);
    if (!isValidUPI(normalized)) {
        setSetupError("Please enter a valid UPI ID (e.g. user@bank)");
        return;
    }
    setIsSavingIdentity(true);
    try {
        await supabase.from('group_members').update({ upi_id: normalized }).eq('id', selectedTarget.id);
        if (selectedTarget.id === senderId && user?.id) {
            await supabase.from('profiles').update({ upi_id: normalized, updated_at: new Date().toISOString() }).eq('id', user.id);
        }
        setSelectedTarget({ ...selectedTarget, upiId: normalized });
        if (groupId) queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        onIdentityUpdated?.();
        setView('pay_apps');
    } catch (err: any) { setSetupError(`Save Failed: ${err.message}`); } 
    finally { setIsSavingIdentity(false); }
  };

  const handleMerchantPayment = async (target: PaymentTarget) => {
    if (!user?.email) {
      toast({ title: "Email Required", description: "Please login to continue.", variant: "destructive" });
      return;
    }
    try {
      onOpenChange(false);
      await startVipWaitlistCheckout({
        email: user.email,
        onSuccess: () => {
          toast({ title: "Upgrade Successful!", description: "Welcome to VIP.", className: "bg-primary text-primary-foreground shadow-premium" });
          onPaymentReturn(true, target);
        },
        onError: (err) => { toast({ title: "Payment Failed", description: err.message, variant: "destructive" }); }
      });
    } catch (err) { console.error("Razorpay Error:", err); }
  };

  // START PROTECTED FINTECH PAYMENT REGION (Locked)
  const launchUPITransport = async (app: PaymentAppConfig, target: PaymentTarget, intentId: string) => {
    const normalizedRupees = (target.amount / 100).toFixed(2);
    const upiId = normalizeUPI(target.upiId!);
    const sanitizedPn = target.name.replace(/[^\w\s]/gi, '').substring(0, 20).trim() || 'Recipient';
    const noteRaw = "Settlement Payment";
    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(sanitizedPn)}&am=${normalizedRupees}&cu=INR&tr=${intentId}&tn=${encodeURIComponent(noteRaw)}`;
    try {
        if (Capacitor.getPlatform() === 'android') {
            const { completed } = await AppLauncher.openUrl({ url: link });
            if (!completed) window.location.href = link;
        } else window.open(link, '_self');
    } catch (err: any) { window.location.href = link; }
  };

  const handleUPILaunch = async (app: PaymentAppConfig) => {
    if (!selectedTarget) return;
    const isValid = typeof isValidUPI === 'function' ? isValidUPI(selectedTarget.upiId) : false;
    if (!isValid) {
        setSetupError("Invalid UPI address.");
        setUpiInput(selectedTarget.upiId || "");
        setView('identity_setup');
        return;
    }
    localStorage.setItem(LAST_USED_PAY_APP_KEY, app.id);
    setLastUsedAppId(app.id);
    if (groupId && senderId) {
        try {
            const intent = await paymentOrchestrator.createIntent(groupId, senderId, selectedTarget);
            if (intent) {
                setActiveIntent(intent);
                await paymentOrchestrator.updateStatus(intent.id, 'PROCESSING');
                await launchUPITransport(app, selectedTarget, intent.id);
            }
        } catch (err) {
            const tempId = `bk${Math.random().toString(36).substring(7).toUpperCase()}`;
            await launchUPITransport(app, selectedTarget, tempId);
        }
    }
    setTimeout(() => { setView('verifying'); }, 2500);
  };

  const handleFinalVerification = async (success: boolean) => {
    if (!selectedTarget) return;
    if (activeIntent) {
        const finalStatus = success ? 'COMPLETED' : 'PENDING';
        await paymentOrchestrator.updateStatus(activeIntent.id, finalStatus);
    }
    onPaymentReturn(success, selectedTarget, activeIntent?.idempotency_key);
    onOpenChange(false);
    setActiveIntent(null);
  };

  const handleRetryPayment = async () => {
      if (activeIntent && selectedTarget) {
          await paymentOrchestrator.updateStatus(activeIntent.id, 'PROCESSING');
          const app = PAYMENT_APPS.find(a => a.id === lastUsedAppId) || RECOMMENDED_PAY_APP;
          await launchUPITransport(app, selectedTarget, activeIntent.id);
          setTimeout(() => { setView('verifying'); }, 1500);
      } else setView('pay_apps');
  };
  // END PROTECTED FINTECH PAYMENT REGION

  // 5. Render Fragments
  const SelectorView = () => (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Active Settlement Targets</p>
        </div>
        {availableP2PTargets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {availableP2PTargets.map((target) => (
              <button 
                key={target.id}
                onClick={() => handleTargetSelect(target)}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-primary font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                    {target.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-foreground text-sm font-bold tracking-tight">{target.name}</p>
                    <p className="text-muted-foreground text-[10px] font-bold font-mono tracking-tight">{formatCurrency(target.amount)}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-muted/10 border border-dashed border-border/50 text-center">
             <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
             <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">No Pending Settlements</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-investment" />
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Platform Intelligence</p>
        </div>
        <button 
          onClick={() => {
            handleTargetSelect({
                id: 'vip_membership',
                name: 'VIP Membership',
                type: 'merchant',
                amount: 100 
            });
          }}
          className="w-full group relative overflow-hidden p-6 rounded-2xl bg-primary text-primary-foreground shadow-institutional active:scale-[0.98] transition-all"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-bold uppercase tracking-widest">Founder VIP Upgrade</p>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-tight mt-0.5">Unlock AI Power • Full Control</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-white font-bold text-xl font-mono tracking-tighter">₹1</p>
                <ArrowRight className="h-4 w-4 text-white/50 ml-auto mt-1" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const PayAppsView = () => (
    <div className="space-y-8 animate-fade-in-up">
        {isDetecting ? (
             <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Initializing Secure Channels</p>
             </div>
        ) : (
            <div className="space-y-6">
                {recommendedApp && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Fast Track</p>
                        <button 
                            onClick={() => handleUPILaunch(recommendedApp)}
                            className="w-full flex items-center justify-between p-5 rounded-2xl bg-surface border border-primary/20 hover:border-primary/50 active:scale-[0.98] transition-all shadow-premium group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-foreground text-sm font-bold tracking-tight">{recommendedApp.name}</p>
                                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Last Used Channel</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-primary opacity-40 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                )}
                
                {otherApps.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Other Verified Apps</p>
                        <div className="grid grid-cols-2 gap-3">
                            {otherApps.map(app => (
                                <button 
                                    key={app.id} 
                                    onClick={() => handleUPILaunch(app)} 
                                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/40 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Smartphone className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <p className="text-foreground text-[11px] font-bold uppercase tracking-wide truncate">{app.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        <div className="bg-muted/20 rounded-xl p-5 border border-border/40 flex items-start gap-4 shadow-inner">
            <ShieldCheck className="h-5 w-5 text-primary/40 shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-[10px] font-bold leading-relaxed uppercase tracking-[0.15em]">Safe & Secure Settlement via NPCI-regulated UPI protocols. Integrity guaranteed.</p>
        </div>
    </div>
  );

  const VerificationView = () => (
    <div className="flex flex-col items-center text-center space-y-10 py-10 animate-fade-in-up">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border border-primary/20 shadow-inner relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-20" />
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Payment Dispatched?</h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
            Please confirm the transfer of <br/>
            <span className="text-foreground text-3xl block mt-2 font-bold font-mono tracking-tighter tabular-nums">{formatCurrency(selectedTarget?.amount || 0)}</span>
          </p>
        </div>

        <div className="flex flex-col w-full gap-4 pt-6 px-4">
          <Button 
            onClick={() => handleFinalVerification(true)}
            className="h-16 bg-primary text-primary-foreground rounded-2xl font-bold uppercase text-[12px] tracking-widest shadow-institutional active:scale-95 transition-transform hover:opacity-95"
          >
            Mark as Paid Successfully
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="ghost"
                onClick={handleRetryPayment}
                className="h-14 bg-surface border border-border/50 text-muted-foreground hover:text-primary font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-sm transition-all"
              >
                Retry App
              </Button>
              <Button 
                variant="ghost"
                onClick={() => handleFinalVerification(false)}
                className="h-14 bg-surface border border-border/50 text-muted-foreground hover:text-destructive font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-sm transition-all"
              >
                Cancel
              </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-5 bg-muted/20 rounded-2xl border border-border/40">
            <Info className="h-5 w-5 text-primary/40 shrink-0" />
            <p className="text-muted-foreground text-[10px] font-bold leading-relaxed uppercase tracking-widest text-left">
                Your financial timeline will update instantly after confirmation.
            </p>
        </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-1.5 w-full bg-primary/20 shrink-0" />
      <div className="px-6 pt-8 pb-4 flex justify-between items-center shrink-0">
        <div className="text-left">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {view === 'selector' ? 'Institutional Settlement' : view === 'identity_setup' ? 'Identity Verification' : view === 'pay_apps' ? 'Secure Transport' : 'Confirmation Audit'}
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-0.5">
            {view === 'selector' ? 'Select Member or Service' : selectedTarget?.name}
          </p>
        </div>
        <button onClick={() => onOpenChange(false)} className="w-10 h-10 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground active:scale-90 transition-all hover:text-foreground shadow-sm hover:border-primary/20">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-12 custom-scrollbar">
          {view === 'selector' && <SelectorView />}
          {view === 'identity_setup' && (
              <IdentitySetupView 
                selectedTarget={selectedTarget}
                senderId={senderId}
                upiInput={upiInput}
                setUpiInput={setUpiInput}
                isSavingIdentity={isSavingIdentity}
                setupError={setupError}
                setSetupError={setSetupError}
                handleSaveIdentity={handleSaveIdentity}
                setView={setView}
              />
          )}
          {view === 'pay_apps' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex items-center justify-between bg-muted/20 p-6 rounded-2xl border border-border/40 shadow-inner">
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">Total Settlement Volume</p>
                  <p className="text-foreground text-3xl font-bold font-mono tracking-tighter tabular-nums">{formatCurrency(selectedTarget?.amount || 0)}</p>
                </div>
                <button onClick={() => setView('selector')} className="px-4 py-2 rounded-xl bg-surface text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-widest border border-border transition-all shadow-sm">Change</button>
              </div>
              <PayAppsView />
            </div>
          )}
          {view === 'verifying' && <VerificationView />}
          
          <div style={{ height: keyboardHeight }} className="transition-all duration-300" />
      </div>
      
      <div className="h-[max(20px,env(safe-area-inset-bottom))] bg-background shrink-0" />
    </div>
  );
});

SmartPaySheet.displayName = 'SmartPaySheet';

export default SmartPaySheet;
