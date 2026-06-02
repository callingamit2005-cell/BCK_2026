import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  Mic, 
  Bell, 
  Lock, 
  EyeOff, 
  CheckCircle2,
  AlertCircle,
  Settings,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { requestSmsPermission, requestNotificationPermission, checkSmsPermission, openAppSettings } from "@/integrations/smsBridge";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PermissionEducationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type OnboardingStep = 'privacy' | 'sequencing' | 'sms_denied';

const PermissionEducation = ({ open, onOpenChange, onComplete }: PermissionEducationProps) => {
  const { t } = useLanguage();
  const { user, userProfile, refreshPreferences } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('privacy');
  const [loading, setLoading] = useState(false);
  const [currentPermissionLabel, setCurrentPermissionLabel] = useState("");

  const runPermissionSequence = useCallback(async () => {
    console.log("[PERMISSION_SEQUENCE_START]");
    setLoading(true);
    
    // 1. SMS Permission (MANDATORY)
    console.log("[SMS_STEP] Requesting...");
    setCurrentPermissionLabel("Requesting SMS Access...");
    try {
      const smsRes = await requestSmsPermission();
      console.log("[SMS_STEP] Result:", smsRes);
      if (smsRes.status !== 'granted') {
        setStep('sms_denied');
        setLoading(false);
        return; // HALT
      }
    } catch (e) {
      console.error("[SMS_STEP] Failed:", e);
      setStep('sms_denied');
      setLoading(false);
      return;
    }

    // 2. Audio Permission (OPTIONAL)
    console.log("[AUDIO_STEP] Requesting...");
    setCurrentPermissionLabel("Enabling Voice Engine...");
    try {
      const audioRes = await SpeechRecognition.requestPermissions();
      console.log("[AUDIO_STEP] Result:", audioRes);
    } catch (e) {
      console.warn("[AUDIO_STEP] Skipped/Failed:", e);
    }

    // 3. Notification Permission (OPTIONAL)
    console.log("[NOTIFICATION_STEP] Requesting...");
    setCurrentPermissionLabel("Configuring Smart Alerts...");
    try {
      const notifRes = await requestNotificationPermission();
      console.log("[NOTIFICATION_STEP] Result:", notifRes);
    } catch (e) {
      console.warn("[NOTIFICATION_STEP] Skipped/Failed:", e);
    }

    // FINALIZATION
    console.log("[SETUP_NAVIGATION] Triggering onComplete");
    setCurrentPermissionLabel("Finalizing...");
    onComplete();
    setLoading(false);
  }, [onComplete]);

  // Handle re-entry or state transition
  useEffect(() => {
    if (userProfile?.privacy_completed && step === 'privacy') {
      setStep('sequencing');
    }
  }, [userProfile?.privacy_completed, step]);

  // Auto-run sequence if we reach 'sequencing' state
  useEffect(() => {
    if (step === 'sequencing' && !loading) {
      runPermissionSequence();
    }
  }, [step, loading, runPermissionSequence]);

  const handlePrivacyAccept = async () => {
    if (!user) return;
    setLoading(true);
    console.log("[ONBOARDING] User accepted Privacy Policy");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          privacy_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // PERSIST SUCCESS - Now move to permissions
      await refreshPreferences();
      
      if (Capacitor.isNativePlatform()) {
        setStep('sequencing');
      } else {
        onComplete();
      }
    } catch (error: any) {
      console.error("[ONBOARDING] Privacy persistence failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySms = () => {
    setStep('sequencing');
  };

  const handleOpenSettings = async () => {
    await openAppSettings();
  };

  if (!open) return null;

  // VIEW 1: PRIVACY FIRST
  if (step === 'privacy') {
    return (
      <div className="w-[min(92vw,400px)] bg-surface rounded-modal overflow-hidden shadow-institutional animate-in zoom-in-95 duration-500 flex flex-col border border-border/40">
        <div className="bg-gradient-to-br from-institutional-blue to-institutional-indigo p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="h-28 w-24 text-surface" />
          </div>
          <div className="flex justify-center mb-6 relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-surface/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-surface/30">
              <ShieldCheck className="h-8 w-8 text-surface" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-surface uppercase tracking-tight relative z-10">
            {t('permission.education.title', 'Privacy First')}
          </h2>
          <p className="text-surface/80 text-[10px] font-black uppercase tracking-[0.2em] mt-2 relative z-10">
            {t('permission.education.subtitle', 'Institutional Grade Security')}
          </p>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="space-y-5">
            <p className="text-[12px] text-text-secondary font-medium leading-relaxed">
              We automate your finances with bank-grade encryption. Your data stays on your device and is never shared.
            </p>
            <div className="bg-background/40 rounded-2xl p-6 space-y-4 border border-border/40 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 rounded-full bg-background flex items-center justify-center border border-border/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.1em]">Zero OTP Monitoring</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 rounded-full bg-background flex items-center justify-center border border-border/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.1em]">Zero Private Chat Access</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handlePrivacyAccept}
            disabled={loading}
            className="w-full h-16 bg-institutional-blue hover:bg-institutional-blue/90 text-surface rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-institutional active:scale-[0.97] transition-all"
          >
            {loading ? 'Securing Profile...' : t('permission.grant.button', 'I Accept & Secure My Profile')}
          </Button>
        </div>
      </div>
    );
  }

  // VIEW 2: SEQUENCING LOADER (Active Dialogs)
  if (step === 'sequencing') {
    return (
      <div className="w-[min(92vw,400px)] bg-surface rounded-modal p-12 shadow-institutional animate-in zoom-in-95 border border-border/40 text-center">
        <div className="relative mb-10 flex justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-institutional-blue/10 border-t-institutional-blue animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="h-10 w-10 text-institutional-blue animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-3">Setting Up Security</h3>
        <p className="text-[10px] font-black text-institutional-blue uppercase tracking-[0.2em] mb-8 animate-pulse">
          {currentPermissionLabel}
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed max-w-[200px] mx-auto font-medium">
          Please respond to the system permission dialogs to continue.
        </p>
      </div>
    );
  }

  // VIEW 3: SMS DENIED RECOVERY
  if (step === 'sms_denied') {
    return (
      <div className="w-[min(92vw,400px)] bg-surface rounded-modal p-10 shadow-institutional animate-in zoom-in-95 border border-rose-500/20 text-center">
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
        </div>
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-3">SMS Access Required</h3>
        <p className="text-[12px] text-text-muted mb-10 leading-relaxed font-medium">
          BachatKaro cannot work without SMS access. This is how we automate your savings and track expenses.
        </p>
        <div className="space-y-4">
          <Button 
            onClick={handleRetrySms}
            className="w-full h-16 bg-institutional-blue hover:bg-institutional-blue/90 text-surface rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-institutional transition-all active:scale-[0.97]"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={handleOpenSettings}
            className="w-full h-14 rounded-xl border-border/60 text-text-secondary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-background/80 transition-all active:scale-[0.97]"
          >
            <Settings className="h-4 w-4 mr-2" />
            Open App Settings
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PermissionEducation;
