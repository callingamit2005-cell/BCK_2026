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
        console.log("[IDENTITY_SETUP_MOUNT]");
        
        const logInputPos = () => {
            if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                console.log("[INPUT_POSITION]", { top: rect.top, bottom: rect.bottom, height: rect.height });
            }
        };

        const handleResize = () => {
            console.log("[VIEWPORT_RESIZE]", { 
                innerHeight: window.innerHeight, 
                visualHeight: window.visualViewport?.height 
            });
            logInputPos();
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        logInputPos();

        return () => {
            console.log("[IDENTITY_SETUP_UNMOUNT]");
            window.visualViewport?.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-left space-y-2">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Missing Payment ID</h2>
                <p className="text-[#b3b3b3] text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed">
                    {selectedTarget?.name} hasn’t added a validated UPI ID yet.
                </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Enter UPI ID (VPA)</Label>
                    <Input 
                        ref={inputRef}
                        value={upiInput} 
                        onChange={(e) => { 
                            console.log("[UPI_INPUT_CHANGE]", { len: e.target.value.length, val: e.target.value });
                            setUpiInput(e.target.value); 
                            setSetupError(null); 
                        }} 
                        onFocus={() => {
                            console.log("[UPI_INPUT_FOCUS]");
                            if (window.visualViewport) {
                                console.log("[KEYBOARD_OPEN_PROBABLE] height:", window.visualViewport.height);
                            }
                        }}
                        onBlur={() => console.log("[UPI_INPUT_BLUR]")}
                        placeholder="e.g. name@oksbi" 
                        className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/10 font-bold focus:ring-purple-500/50" 
                    />
                    <div className="flex items-center gap-2 px-1">
                        <Info className="h-3 w-3 text-purple-400" />
                        <p className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Must match format: user@handle (No emails)</p>
                    </div>
                </div>
                {setupError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-in fade-in zoom-in-95">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{setupError}</p>
                    </div>
                )}
                <Button onClick={handleSaveIdentity} disabled={isSavingIdentity || !isValidUPI(upiInput)} className="w-full h-12 bg-gradient-to-r from-purple-600 to-[#ff0f7b] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-30">
                    {isSavingIdentity ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Save UPI ID"}
                </Button>
            </div>
            {!isSelf && (
                <div className="flex flex-col gap-3">
                    <Button variant="ghost" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${selectedTarget?.name}, please add your UPI ID on BachatKaro so I can settle our debts! ✨`)}`, "_blank")} className="h-12 text-purple-400 font-bold uppercase text-[9px] tracking-widest border border-purple-500/20 rounded-xl">
                        Request Payment Setup via WhatsApp
                    </Button>
                    <button onClick={() => setView('selector')} className="text-[8px] font-black text-white/20 hover:text-white uppercase tracking-widest text-center">Cancel & Pick Someone Else</button>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            <p className="text-[#b3b3b3] text-[9px] font-black uppercase tracking-[0.2em]">Group Settlements</p>
        </div>
        {availableP2PTargets.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {availableP2PTargets.map((target) => (
              <button 
                key={target.id}
                onClick={() => {
                    console.log("[CLICK_1] Member Button Tapped:", target.name);
                    handleTargetSelect(target);
                }}
                className="w-full group flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 active:bg-purple-500/10 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xs">
                    {target.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-xs font-bold">{target.name}</p>
                    <p className="text-[#ff0f7b] text-[10px] font-black font-mono">{formatCurrency(target.amount)}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-purple-400" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
             <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">No pending settlements</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[#b3b3b3] text-[9px] font-black uppercase tracking-[0.2em]">Platform Options</p>
        </div>
        <button 
          onClick={() => {
            console.log("[CLICK_1] Merchant Button Tapped");
            handleTargetSelect({
                id: 'vip_membership',
                name: 'VIP Membership',
                type: 'merchant',
                amount: 100 
            });
          }}
          className="w-full group relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-600/15 border border-amber-500/30 active:border-amber-400/50 transition-all"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-xs font-black uppercase italic">Founder VIP Membership</p>
                <p className="text-amber-200/60 text-[8px] font-bold uppercase">Unlock AI Power • Lifetime Access</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-white font-black text-base font-mono">₹1</p>
                <ArrowRight className="h-4 w-4 text-amber-400 ml-auto" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const PayAppsView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isDetecting ? (
             <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Detecting payment apps...</p>
             </div>
        ) : (
            <div className="space-y-5">
                {recommendedApp && (
                    <button 
                        onClick={() => {
                            console.log("[CLICK_1] Recommended App Tapped:", recommendedApp.name);
                            handleUPILaunch(recommendedApp);
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 active:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Smartphone className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-white text-xs font-bold uppercase">{recommendedApp.name}</p>
                                <p className="text-text-muted text-[8px] font-bold uppercase">Recommended</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                    </button>
                )}
                {otherApps.length > 0 && (
                    <div className="grid grid-cols-2 gap-3.5">
                        {otherApps.map(app => (
                            <button 
                                key={app.id} 
                                onClick={() => {
                                    console.log("[CLICK_1] Other App Tapped:", app.name);
                                    handleUPILaunch(app);
                                }} 
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 active:bg-white/10 transition-all"
                            >
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Smartphone className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-white text-[9px] font-bold uppercase tracking-widest">{app.name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-start gap-3.5">
            <ShieldCheck className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" />
            <p className="text-text-muted text-[7px] font-bold leading-relaxed uppercase tracking-widest">Safe & Secure Settlement via NPCI-regulated UPI apps.</p>
        </div>
    </div>
  );

  const VerificationView = () => (
    <div className="flex flex-col items-center text-center space-y-6 py-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Payment Sent?</h2>
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px]">
            Please confirm if you completed the transfer of <br/>
            <span className="text-white text-base block mt-1 font-mono">{formatCurrency(selectedTarget?.amount || 0)}</span>
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 pt-4 px-4">
          <Button 
            onClick={() => handleFinalVerification(true)}
            className="h-14 bg-white text-background rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-sm active:scale-95 transition-transform hover:bg-white/90"
          >
            Yes, Mark as Paid
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="ghost"
                onClick={handleRetryPayment}
                className="h-12 bg-white/5 border border-white/10 text-text-muted hover:text-white font-bold uppercase text-[9px] tracking-[0.2em] rounded-xl"
              >
                Retry
              </Button>
              <Button 
                variant="ghost"
                onClick={() => handleFinalVerification(false)}
                className="h-12 bg-white/5 border border-white/10 text-text-secondary hover:text-white font-bold uppercase text-[9px] tracking-[0.2em] rounded-xl"
              >
                Cancel
              </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-8 py-3 bg-white/5 rounded-2xl border border-white/5">
            <ShieldCheck className="h-4 w-4 text-white/40 shrink-0" />
            <p className="text-text-muted text-[8px] font-bold leading-relaxed uppercase tracking-widest text-left">
                Your balances will update instantly after you confirm. Ledger integrity is guaranteed.
            </p>
        </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="h-1 w-full bg-white/5 shrink-0" />
      <div className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0">
        <div className="text-left">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">
            {view === 'selector' ? 'Choose Payment' : view === 'identity_setup' ? 'Identity Setup' : view === 'pay_apps' ? 'Settle Up' : 'Verification'}
          </h2>
          <p className="text-text-muted text-[8px] font-bold uppercase tracking-[0.15em] mt-0.5">
            {view === 'selector' ? 'Settle Member or Upgrade' : selectedTarget?.name}
          </p>
        </div>
        <button onClick={() => onOpenChange(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-text-muted active:bg-white/10 active:scale-90 transition-all hover:text-white"><X size={18} /></button>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-left">
                  <p className="text-text-muted text-[7px] font-bold uppercase tracking-widest">Amount to Pay</p>
                  <p className="text-white text-xl font-bold font-mono">{formatCurrency(selectedTarget?.amount || 0)}</p>
                </div>
                <button onClick={() => {
                    console.log("[VIEW_TRANSITION] Changing target from pay_apps");
                    setView('selector');
                }} className="px-3 py-1.5 rounded-lg bg-white/5 text-[7px] font-bold text-text-muted hover:text-white uppercase tracking-widest border border-white/5 transition-all">Change</button>
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
