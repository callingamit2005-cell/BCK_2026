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
  AlertCircle, Info, Users, Sparkles, CreditCard, ArrowRight, ShieldCheck, X, Loader2 
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

// --- FORENSIC INSTRUMENTATION HELPERS ---
let parentRenderCount = 0;
let inputRenderCount = 0;

// Unified Payment Target Types
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
 * 🛡️ [ARCHITECTURAL_FIX] Extracted IdentitySetupView
 * Defining components inside parent render functions causes full remounts on every state change.
 * This extraction ensures focus persistence and stable typing.
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
    inputRenderCount++;
    
    useEffect(() => {
        if (import.meta.env.DEV) console.log("[IDENTITY_SETUP_MOUNT]");
        
        const logInputPos = () => {
            if (import.meta.env.DEV && inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                console.log("[INPUT_POSITION]", { top: rect.top, bottom: rect.bottom, height: rect.height });
            }
        };

        const handleResize = () => {
            if (import.meta.env.DEV) {
              console.log("[VIEWPORT_RESIZE]", { 
                  innerHeight: window.innerHeight, 
                  visualHeight: window.visualViewport?.height 
              });
            }
            logInputPos();
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        logInputPos();

        return () => {
            if (import.meta.env.DEV) console.log("[IDENTITY_SETUP_UNMOUNT]");
            window.visualViewport?.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-left space-y-2">
                <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">Setup Payment ID</h2>
                <p className="text-text-secondary text-[11px] font-bold uppercase tracking-[0.1em] leading-relaxed">
                    {selectedTarget?.name} needs a validated UPI ID to receive payments.
                </p>
            </div>
            <div className="p-6 rounded-[24px] bg-surface border border-border space-y-5 shadow-sm">
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest ml-1">Enter UPI ID (VPA)</Label>
                    <Input 
                        ref={inputRef}
                        value={upiInput} 
                        onChange={(e) => { 
                            setUpiInput(e.target.value); 
                            setSetupError(null); 
                        }} 
                        placeholder="e.g. name@oksbi" 
                        className="h-14 bg-background border-border text-foreground placeholder:text-text-muted font-bold focus:ring-foreground rounded-xl" 
                    />
                    <div className="flex items-center gap-2 px-1">
                        <Info className="h-3.5 w-3.5 text-text-muted" />
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Format: user@handle</p>
                    </div>
                </div>
                {setupError && (
                    <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center gap-3 animate-in fade-in zoom-in-95">
                        <AlertCircle className="h-4 w-4 text-foreground shrink-0" />
                        <p className="text-[11px] font-bold text-foreground uppercase tracking-tight">{setupError}</p>
                    </div>
                )}
                <button onClick={handleSaveIdentity} disabled={isSavingIdentity || !isValidUPI(upiInput)} className="w-full h-14 bg-foreground text-surface font-bold uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-30 hover:bg-foreground/90">
                    {isSavingIdentity ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Save ID"}
                </button>
            </div>
            {!isSelf && (
                <div className="flex flex-col gap-3">
                    <Button variant="ghost" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${selectedTarget?.name}, please add your UPI ID on BachatKaro so I can settle our debts! ✨`)}`, "_blank")} className="h-14 text-text-secondary font-bold uppercase text-[10px] tracking-widest border border-border rounded-xl hover:text-foreground hover:bg-background">
                        Request via WhatsApp
                    </Button>
                    <button onClick={() => setView('selector')} className="text-[10px] font-bold text-text-muted hover:text-foreground uppercase tracking-widest text-center py-2 transition-colors">Cancel & Go Back</button>
                </div>
            )}
        </div>
    );
};

interface SmartPaySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTarget?: PaymentTarget | null;
  availableP2PTargets?: PaymentTarget[]; // List of debts user can settle
  onPaymentReturn: (success: boolean, target: PaymentTarget, idempotencyKey?: string) => void;
  groupId?: string; // Required for P2P intent creation
  senderId?: string; // Current member ID
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
  parentRenderCount++;
  console.log(`[UPI_PARENT_RERENDER] count: ${parentRenderCount}, time: ${Date.now()}`);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🛡️ [KEYBOARD_STABILIZATION_STATE]
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 1. Unified State Management
  // 🛡️ [RENDER_STORM_KILLSWITCH] Memoize initialTarget to prevent reference changes on every parent render
  const initialTarget = useMemo(() => preselectedTarget, [preselectedTarget?.id, preselectedTarget?.amount]);
  const [selectedTarget, setSelectedTarget] = useState<PaymentTarget | null>(initialTarget);
  
  // 🛡️ [RENDER_STORM_KILLSWITCH] Only update state if ID actually changes, avoiding reference loops
  useEffect(() => {
    if (initialTarget && initialTarget.id !== selectedTarget?.id) {
      setSelectedTarget(initialTarget);
    }
  }, [initialTarget?.id]); // Strictly depend on primitive ID, not the object

  useEffect(() => {
    if (selectedTarget) {
      console.log("[selectedTarget_CHANGE]", selectedTarget.id);
    }
  }, [selectedTarget?.id]);

  const [activeIntent, setActiveIntent] = useState<SettlementIntent | null>(null);
  
  const [view, setView] = useState<'selector' | 'pay_apps' | 'verifying' | 'identity_setup'>(preselectedTarget ? 'pay_apps' : 'selector');
  
  useEffect(() => {
      console.log("[VIEW_TRANSITION]", view);
  }, [view]);

  // 🛡️ [VIEWPORT_STABILIZATION_LOGIC]
  useEffect(() => {
    if (!isOpen || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      
      const diff = window.innerHeight - vv.height;
      // If viewport shrinks by more than 150px, assume keyboard is open
      const currentKHeight = diff > 150 ? diff : 0;
      setKeyboardHeight(currentKHeight);
      
      console.log("[VIEWPORT_STABILIZED]", { 
        visualHeight: vv.height, 
        keyboardBuffer: currentKHeight 
      });
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, [isOpen]);

  const [isConfirming, setIsConfirming] = useState(false);
  const [installedApps, setInstalledApps] = useState<PaymentAppConfig[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [lastUsedAppId, setLastUsedAppId] = useState<string | null>(localStorage.getItem(LAST_USED_PAY_APP_KEY));

  // Identity Setup State
  const [upiInput, setUpiInput] = useState("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // 🛡️ [HARDWARE_BACK_BUTTON] Android Support
  useEffect(() => {
    if (!isOpen) return;

    const handleBack = async () => {
        if (view === 'selector' || preselectedTarget) {
            onOpenChange(false);
        } else if (view === 'identity_setup') {
            setView('selector');
        } else {
            setView('selector');
        }
    };

    const listener = App.addListener('backButton', () => {
        handleBack();
    });

    return () => {
        listener.then(l => l.remove());
    };
  }, [isOpen, view, preselectedTarget, onOpenChange]);

  // Sync state when sheet opens with preselected target
  useEffect(() => {
    if (isOpen) {
      if (view === 'verifying') return;

      if (preselectedTarget) {
        setSelectedTarget(preselectedTarget);
        // [NULL_UPI_ROUTING]
        const isTargetValid = typeof isValidUPI === 'function' ? isValidUPI(preselectedTarget.upiId) : false;
        
        if (preselectedTarget.type === 'p2p' && !isTargetValid) {
            console.log("[FLOW_ROUTE] Preselected target lacks valid UPI. Routing to identity_setup.");
            setUpiInput(preselectedTarget.upiId || "");
            setView('identity_setup');
        } else {
            setView('pay_apps');
        }
      } else {
        setSelectedTarget(null);
        setView('selector');
      }
      setIsConfirming(false);
      setSetupError(null);
    }
  }, [isOpen, preselectedTarget]);

  // 🛡️ RECOVERY LISTENER
  useEffect(() => {
    const handleRecovery = (e: any) => {
        const intent = e.detail as SettlementIntent;
        if (intent.status === 'success' || intent.status === 'failed') return;

        console.log("[SETTLEMENT_RECOVERY_RESTORED]", intent.id);

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

  // 🕵️ [PHASE_3_HYBRID_FLOW] Return Detection
  useEffect(() => {
    if (!isOpen || view !== 'verifying' || !activeIntent) return;
    
    const handleAppResume = () => {
        console.log("[UPI_RETURN_DETECTED]", activeIntent.id);
    };

    const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) handleAppResume();
    });

    return () => {
        listener.then(l => l.remove());
    };
  }, [isOpen, view, activeIntent]);

  // 2. Detect Installed Apps
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
      } else {
        setInstalledApps(filteredApps as any);
      }
      setIsDetecting(false);
    };

    initDetection();
  }, [view, isOpen]);

  // 3. App Selection Logic
  const recommendedApp = useMemo(() => {
    if (installedApps.length === 0) return null;
    return installedApps.find(app => app.id === lastUsedAppId) || installedApps[0];
  }, [lastUsedAppId, installedApps]);

  const otherApps = useMemo(() => {
    if (!recommendedApp) return installedApps;
    return installedApps.filter(app => app.id !== recommendedApp.id);
  }, [recommendedApp, installedApps]);

  // 4. Execution Handlers
  const handleTargetSelect = (target: PaymentTarget) => {
    console.log("[CLICK_1] handleTargetSelect (Member Tapped)", { targetId: target.id, targetName: target.name });
    setSelectedTarget(target);
    setSetupError(null);

    if (target.type === 'merchant') {
      handleMerchantPayment(target);
    } else {
      const isTargetValid = typeof isValidUPI === 'function' ? isValidUPI(target.upiId) : false;
      if (!isTargetValid) {
        console.log("[FLOW_ROUTE] Selected target lacks valid UPI. Routing to identity_setup.");
        setUpiInput(target.upiId || "");
        setView('identity_setup');
      } else {
        console.log("[CLICK_2] View switching to pay_apps");
        setView('pay_apps');
      }
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
    } catch (err: any) {
        setSetupError(`Save Failed: ${err.message}`);
    } finally {
        setIsSavingIdentity(false);
    }
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
          toast({ title: "Upgrade Successful!", description: "Welcome to VIP.", className: "bg-emerald-600 text-white" });
          onPaymentReturn(true, target);
        },
        onError: (err) => {
          toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
        }
      });
    } catch (err) {
      console.error("Razorpay Error:", err);
    }
  };

  // START PROTECTED FINTECH PAYMENT REGION
  // DO NOT MODIFY WITHOUT PAYMENT SYSTEM REVIEW.

  const launchUPITransport = async (app: PaymentAppConfig, target: PaymentTarget, intentId: string) => {
    // 🛡️ [AMOUNT_NORMALIZATION_FIX]
    const normalizedRupees = (target.amount / 100).toFixed(2);
    const upiId = normalizeUPI(target.upiId!);
    const sanitizedPn = target.name.replace(/[^\w\s]/gi, '').substring(0, 20).trim() || 'Recipient';
    const noteRaw = "Settlement Payment";
    
    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(sanitizedPn)}&am=${normalizedRupees}&cu=INR&tr=${intentId}&tn=${encodeURIComponent(noteRaw)}`;

    console.log("[UPI_APP_LAUNCHED]", { intentId, appName: app.name });
    
    try {
        if (Capacitor.getPlatform() === 'android') {
            const { completed } = await AppLauncher.openUrl({ url: link });
            if (!completed) window.location.href = link;
        } else {
            window.open(link, '_self');
        }
    } catch (err: any) {
        window.location.href = link;
    }
  };

  const handleUPILaunch = async (app: PaymentAppConfig) => {
    console.log("[CLICK_1] handleUPILaunch (Payment App Tapped)", { appName: app.name });
    
    if (!selectedTarget) {
        toast({ title: "Configuration Error", description: "Target not selected", variant: "destructive" });
        return;
    }

    const isValid = typeof isValidUPI === 'function' ? isValidUPI(selectedTarget.upiId) : false;
    if (!isValid) {
        setSetupError("Invalid UPI address. Please fix it in Identity Setup.");
        setUpiInput(selectedTarget.upiId || "");
        setView('identity_setup');
        return;
    }

    // 🚀 [PAYMENT_LAUNCH]
    console.log("[PAYMENT_LAUNCH] Preparing transport...");
    
    localStorage.setItem(LAST_USED_PAY_APP_KEY, app.id);
    setLastUsedAppId(app.id);

    // Initial background tracking
    if (groupId && senderId) {
        try {
            const intent = await paymentOrchestrator.createIntent(groupId, senderId, selectedTarget);
            if (intent) {
                console.log("[SETTLEMENT_INTENT_CREATED]", intent.id);
                setActiveIntent(intent);
                
                // Mark as PROCESSING logically (redirected in DB)
                await paymentOrchestrator.updateStatus(intent.id, 'PROCESSING');
                
                await launchUPITransport(app, selectedTarget, intent.id);
            }
        } catch (err) {
            console.error("[PAYMENT_LAUNCH_FAIL]", err);
            // Fallback for UI if intent creation fails (legacy behavior)
            const tempId = `bk${Math.random().toString(36).substring(7).toUpperCase()}`;
            await launchUPITransport(app, selectedTarget, tempId);
        }
    }

    setTimeout(() => {
      console.log("[AWAITING_CONFIRMATION]");
      setView('verifying');
    }, 2500);
  };

  const handleFinalVerification = async (success: boolean) => {
    if (!selectedTarget) return;

    if (activeIntent) {
        // Mark as COMPLETED or PENDING (Return to state for later)
        const finalStatus = success ? 'COMPLETED' : 'PENDING';
        await paymentOrchestrator.updateStatus(activeIntent.id, finalStatus);
        
        if (success) console.log("[SETTLEMENT_CONFIRMED]", activeIntent.id);
        else console.log("[SETTLEMENT_CANCELLED]", activeIntent.id);
    }

    onPaymentReturn(success, selectedTarget, activeIntent?.idempotency_key);
    onOpenChange(false);
    setActiveIntent(null);
  };

  const handleRetryPayment = async () => {
      if (activeIntent && selectedTarget) {
          console.log("[SETTLEMENT_RETRY]", activeIntent.id);
          
          // Re-mark as PROCESSING
          await paymentOrchestrator.updateStatus(activeIntent.id, 'PROCESSING');
          
          // Use recommended or last used app
          const app = PAYMENT_APPS.find(a => a.id === lastUsedAppId) || RECOMMENDED_PAY_APP;
          await launchUPITransport(app, selectedTarget, activeIntent.id);
          
          // Reset view timeout
          setTimeout(() => {
            console.log("[AWAITING_CONFIRMATION]");
            setView('verifying');
          }, 1500);
      } else {
          setView('pay_apps');
      }
  };
  // END PROTECTED FINTECH PAYMENT REGION

  // 5. Render Fragments
  const SelectorView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-text-secondary" />
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Settlement Engine</p>
        </div>
        {availableP2PTargets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {availableP2PTargets.map((target) => (
              <button 
                key={target.id}
                onClick={() => {
                    handleTargetSelect(target);
                }}
                className="w-full group flex items-center justify-between p-5 rounded-[22px] bg-surface border border-border hover:border-foreground active:scale-[0.98] transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-foreground font-bold text-sm">
                    {target.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-foreground text-sm font-bold uppercase tracking-tight">{target.name}</p>
                    <p className="text-text-secondary text-[11px] font-bold font-mono">{formatCurrency(target.amount)}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-[24px] bg-background border border-dashed border-border text-center">
             <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">No pending settlements detected</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-text-secondary" />
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Platform Intelligence</p>
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
          className="w-full group relative overflow-hidden p-5 rounded-[24px] bg-foreground text-surface border border-foreground active:scale-[0.98] transition-all shadow-lg"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface/10 border border-surface/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-surface" />
              </div>
              <div className="text-left">
                <p className="text-surface text-sm font-bold uppercase tracking-wider">Founder VIP Upgrade</p>
                <p className="text-surface/60 text-[10px] font-bold uppercase tracking-tight">Unlock AI Power • Lifetime access</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-surface font-bold text-lg font-mono tracking-tighter">₹1</p>
                <ArrowRight className="h-4 w-4 text-surface/40 ml-auto" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const PayAppsView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isDetecting ? (
             <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-foreground animate-spin" />
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] animate-pulse">Detecting Secure Transports</p>
             </div>
        ) : (
            <div className="space-y-6">
                {recommendedApp && (
                    <button 
                        onClick={() => {
                            console.log("[CLICK_1] Recommended App Tapped:", recommendedApp.name);
                            handleUPILaunch(recommendedApp);
                        }}
                        className="w-full flex items-center justify-between p-5 rounded-[22px] bg-surface border border-foreground/20 hover:border-foreground active:scale-[0.98] transition-all shadow-md"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="text-foreground text-sm font-bold uppercase tracking-wider">{recommendedApp.name}</p>
                                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">Recommended App</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-text-muted" />
                    </button>
                )}
                {otherApps.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                        {otherApps.map(app => (
                            <button 
                                key={app.id} 
                                onClick={() => {
                                    console.log("[CLICK_1] Other App Tapped:", app.name);
                                    handleUPILaunch(app);
                                }} 
                                className="flex flex-col items-center gap-3 p-5 rounded-[22px] bg-surface border border-border hover:border-foreground active:scale-[0.98] transition-all shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                                    <Smartphone className="h-5 w-5 text-text-secondary" />
                                </div>
                                <p className="text-foreground text-[10px] font-bold uppercase tracking-[0.2em]">{app.name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
        <div className="bg-background rounded-2xl p-5 border border-border flex items-start gap-4 shadow-inner">
            <ShieldCheck className="h-5 w-5 text-foreground/40 shrink-0 mt-0.5" />
            <p className="text-text-secondary text-[10px] font-bold leading-relaxed uppercase tracking-widest">Safe & Secure Settlement via NPCI-regulated UPI protocols.</p>
        </div>
    </div>
  );

  const VerificationView = () => (
    <div className="flex flex-col items-center text-center space-y-8 py-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center border border-border shadow-inner">
          <CheckCircle2 className="h-12 w-12 text-foreground" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">Payment Sent?</h2>
          <p className="text-text-secondary text-[12px] font-bold uppercase tracking-[0.15em] leading-relaxed max-w-[280px]">
            Please confirm the transfer of <br/>
            <span className="text-foreground text-2xl block mt-2 font-mono tracking-tighter">{formatCurrency(selectedTarget?.amount || 0)}</span>
          </p>
        </div>

        <div className="flex flex-col w-full gap-4 pt-6 px-4">
          <Button 
            onClick={() => handleFinalVerification(true)}
            className="h-16 bg-foreground text-surface rounded-[20px] font-bold uppercase text-xs tracking-[0.25em] shadow-xl active:scale-95 transition-transform hover:bg-foreground/90"
          >
            Yes, Mark as Paid
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="ghost"
                onClick={handleRetryPayment}
                className="h-14 bg-surface border border-border text-text-secondary hover:text-foreground font-bold uppercase text-[10px] tracking-[0.2em] rounded-[18px] shadow-sm transition-all"
              >
                Retry App
              </Button>
              <Button 
                variant="ghost"
                onClick={() => handleFinalVerification(false)}
                className="h-14 bg-surface border border-border text-text-secondary hover:text-foreground font-bold uppercase text-[10px] tracking-[0.2em] rounded-[18px] shadow-sm transition-all"
              >
                Cancel
              </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-background rounded-[22px] border border-border">
            <ShieldCheck className="h-5 w-5 text-foreground/20 shrink-0" />
            <p className="text-text-muted text-[10px] font-bold leading-relaxed uppercase tracking-widest text-left">
                Your balances will update instantly after confirmation. Integrity guaranteed.
            </p>
        </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-1 w-full bg-border shrink-0" />
      <div className="px-6 pt-8 pb-4 flex justify-between items-center shrink-0">
        <div className="text-left">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">
            {view === 'selector' ? 'Choose Payment' : view === 'identity_setup' ? 'Identity Setup' : view === 'pay_apps' ? 'Settle Up' : 'Verification'}
          </h2>
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.15em] mt-1">
            {view === 'selector' ? 'Settle Member or Upgrade' : selectedTarget?.name}
          </p>
        </div>
        <button onClick={() => onOpenChange(false)} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary active:scale-90 transition-all hover:text-foreground shadow-sm">
          <X size={20} />
        </button>
      </div>
      
      {/* 🛡️ [STABILIZED_SCROLL_HIERARCHY] */}
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
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-surface p-6 rounded-[24px] border border-border shadow-sm">
                <div className="text-left">
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total to Settle</p>
                  <p className="text-foreground text-3xl font-bold font-mono tracking-tighter">{formatCurrency(selectedTarget?.amount || 0)}</p>
                </div>
                <button onClick={() => {
                    console.log("[VIEW_TRANSITION] Changing target from pay_apps");
                    setView('selector');
                }} className="px-4 py-2 rounded-xl bg-background text-[10px] font-bold text-text-secondary hover:text-foreground uppercase tracking-widest border border-border transition-all shadow-sm">Change</button>
              </div>
              <PayAppsView />
            </div>
          )}
          {view === 'verifying' && <VerificationView />}
          
          {/* 🛡️ [KEYBOARD_SAFE_BUFFER] Dynamically pushes content up when keyboard is detected */}
          <div style={{ height: keyboardHeight }} className="transition-all duration-300" />
      </div>
      
      {/* Android Safe Bottom Indicator Area */}
      <div className="h-[max(20px,env(safe-area-inset-bottom))] bg-background shrink-0" />
    </div>
  );
});

export default SmartPaySheet;
