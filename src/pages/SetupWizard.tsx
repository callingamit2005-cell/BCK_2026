/**
 * SetupWizard.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Precision Onboarding Terminal.
 * 🚀 FIX: Synchronized 'profiles' and 'user_preferences' tables to stop infinite setup loop.
 * 🛡️ LOGIC LOCK: Routing, state machine, and permissions 100% untouched.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LANGUAGE_NAMES, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Globe, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare, 
  Mic, 
  Bell, 
  Settings,
  Shield,
  ArrowRight
} from 'lucide-react';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import { cn } from "@/lib/utils";
import { Capacitor } from '@capacitor/core';
import { 
  checkSmsPermission, 
  requestSmsPermission, 
  checkNotificationPermission, 
  requestNotificationPermission,
  openAppSettings
} from '@/integrations/smsBridge';

// Configuration Constants
const COUNTRIES = [
  { code: 'IN', name: 'India 🇮🇳', active: true },
  { code: 'US', name: 'United States 🇺🇸 (Coming Soon)', active: false },
  { code: 'GB', name: 'United Kingdom 🇬🇧 (Coming Soon)', active: false },
  { code: 'AE', name: 'UAE 🇦🇪 (Coming Soon)', active: false },
];

const SUPPORTED_LANGUAGES = ['en', 'hi', 'hinglish'];

const ALL_LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[])
  .map(code => ({
    code,
    name: LANGUAGE_NAMES[code].name,
    active: SUPPORTED_LANGUAGES.includes(code)
  }));

const DEFAULT_LANGUAGES = [{ code: 'en', name: 'English' }];

const SetupWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, userProfile, preferences, preferencesLoading, refreshPreferences } = useAuth();
  const { setLanguage, t } = useLanguage();

  const [step, setStep] = useState(0); 
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [saving, setSaving] = useState(false);
  const [permissionsStatus, setPermissionsStatus] = useState({
    sms: 'pending',
    mic: 'pending',
    notifications: 'pending'
  });

  // 🧪 [INSTRUMENTATION] SetupWizard Traces
  const effectCountRef = useRef(0);

  // --- RESUME LOGIC (The State Machine) (LOCKED) ---
  useEffect(() => {
    effectCountRef.current++;
    console.log(`🧪 [WIZARD_TRACE] Effect Run #${effectCountRef.current}`);
    console.log(`🧪 [WIZARD_STATE] userProfile.has_completed_setup: ${userProfile?.has_completed_setup}`);
    console.log(`🧪 [WIZARD_STATE] userProfile.privacy_completed: ${userProfile?.privacy_completed}`);
    console.log(`🧪 [WIZARD_STATE] preferences.country: ${preferences?.country}`);
    console.log(`🧪 [WIZARD_STATE] preferences.language: ${preferences?.language}`);

    if (loading || preferencesLoading || !user) {
      console.log(`🧪 [WIZARD_HOLD] Waiting for Auth/Prefs (loading=${loading}, prefLoading=${preferencesLoading})`);
      return;
    }

    if (userProfile?.has_completed_setup) {
      console.log(`🧪 [WIZARD_EXIT] Setup complete. Navigating to dashboard.`);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!preferences?.country) {
      console.log(`🧪 [WIZARD_STEP] Transitioning to Step 1 (Region)`);
      setStep(1); // Region
    } else if (!preferences?.language) {
      console.log(`🧪 [WIZARD_STEP] Transitioning to Step 2 (Language)`);
      setSelectedCountry(preferences.country);
      setStep(2); // Language
    } else if (!userProfile?.privacy_completed) {
      console.log(`🧪 [WIZARD_STEP] Transitioning to Step 3 (Privacy Window 1)`);
      setSelectedCountry(preferences.country);
      setSelectedLanguage(preferences.language);
      setStep(3); // Privacy Window 1
    } else {
      console.log(`🧪 [WIZARD_STEP] Transitioning to Step 5 (Permissions)`);
      setSelectedCountry(preferences.country);
      setSelectedLanguage(preferences.language);
      setStep(5); // Permissions
    }
  }, [loading, preferencesLoading, user, userProfile, preferences, navigate]);

  const availableLanguages = selectedCountry === 'IN' ? ALL_LANGUAGES : DEFAULT_LANGUAGES;

  const saveRegion = async (country: string) => {
    if (!country) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user?.id, 
          country,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSelectedCountry(country);
      setStep(2); // Direct — no refreshPreferences to avoid state machine re-trigger
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveLanguageStep = async () => {
    if (!selectedLanguage) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ 
          language: selectedLanguage,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      await setLanguage(selectedLanguage as any);
      await refreshPreferences();
      setStep(3);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const savePrivacyStep = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          privacy_completed: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user?.id);

      if (error) throw error;
      await refreshPreferences();
      setStep(5); // Move to Permissions after privacy accepted
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionRequest = async () => {
    if (Capacitor.getPlatform() !== 'android') {
      await finalizeSetup();
      return;
    }

    try {
      const smsRes = await requestSmsPermission();
      const notifRes = await requestNotificationPermission();

      // Mic permission via Web API (works on Android Capacitor + Browser)
      let micStatus = 'denied';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        micStatus = 'granted';
      } catch {
        micStatus = 'denied';
      }

      setPermissionsStatus({
        sms: smsRes.status,
        mic: micStatus,
        notifications: notifRes.status
      });

      if (smsRes.status === 'granted') {
        await finalizeSetup();
      } else {
        toast({
          title: t('common.permission_denied', 'SMS Permission Required'),
          description: t('onboarding.sms_mandatory', 'BachatKaro needs SMS access to track your expenses automatically.'),
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error("Permission request failed", err);
    }
  };

  const finalizeSetup = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('finalize_user_onboarding', {
        p_country: selectedCountry,
        p_language: selectedLanguage
      });

      if (error) throw error;

      await refreshPreferences();
      toast({
        title: t('onboarding.welcome', 'Welcome Aboard! 🚀'),
        description: t('onboarding.active_profile', 'Your BachatKaro profile is now active.'),
        className: "bg-surface border-primary text-foreground shadow-premium",
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: 'Setup Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || preferencesLoading || step === 0) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 pt-12 sm:pt-0 bg-background relative overflow-y-auto">
      
      <Card className="w-full max-w-md bg-surface border border-border/40 rounded-modal shadow-institutional overflow-hidden relative z-10 max-h-[92vh] flex flex-col transition-all duration-700 hover:shadow-2xl">
        <div className="h-1.5 w-full bg-primary" />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <CardHeader className="text-center pt-12 pb-4 px-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group transition-transform duration-700 hover:scale-105 relative">
                {step <= 2 && <Globe className="h-10 w-10 text-primary" />}
                {(step === 3 || step === 4) && <ShieldCheck className="h-10 w-10 text-primary" />}
                {step === 5 && <Sparkles className="h-10 w-10 text-primary" />}
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
                {t('app.name', 'BachatKaro')}
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.25em]">
                {step === 1 && t('onboarding.step_1', 'Step 1: Regional Identity')}
                {step === 2 && t('onboarding.step_2', 'Step 2: Communication')}
                {step === 3 && t('onboarding.step_3', 'Step 3: Privacy Policy')}
                {step === 4 && t('onboarding.step_4', 'Step 4: Your Rights')}
                {step === 5 && t('onboarding.step_5', 'Step 5: Intelligence Access')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-12">
            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('onboarding.selectRegion', 'Select Your Region')}</Label>
                  <Select value={selectedCountry} onValueChange={(val) => setSelectedCountry(val)}>
                    <SelectTrigger className="h-14 rounded-xl border border-border/50 bg-muted/20 text-base font-bold text-foreground focus:border-primary/50 focus:ring-primary shadow-sm px-5 transition-all">
                      <SelectValue placeholder={t('onboarding.whereAreYouFrom', 'Where are you from?')} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-xl border-border bg-surface text-foreground shadow-institutional max-h-[240px]">
                      {COUNTRIES.map(c => (
                        <SelectItem 
                          key={c.code} 
                          value={c.code} 
                          disabled={!c.active}
                          className={cn(
                            "h-12 rounded-lg focus:bg-primary/5 text-foreground font-bold uppercase text-[11px] tracking-wider cursor-pointer",
                            !c.active && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-center text-[10px] font-medium text-muted-foreground leading-relaxed italic">{t('onboarding.regionHelp', 'Region helps us optimize your local currency and split logic.')}</p>
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/auth', { replace: true })}
                    className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                  </Button>
                  <Button
                    onClick={() => saveRegion(selectedCountry)}
                    disabled={saving || !selectedCountry}
                    className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.next', 'Next Step')}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('onboarding.preferredLanguage', 'Preferred Language')}</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="h-14 rounded-xl border border-border/50 bg-muted/20 text-base font-bold text-foreground focus:border-primary/50 focus:ring-primary shadow-sm px-5 transition-all">
                      <SelectValue placeholder={t('onboarding.talkToUsIn', 'Talk to us in...')} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-xl border-border bg-surface text-foreground shadow-institutional max-h-[240px]">
                      {availableLanguages.map(l => (
                        <SelectItem 
                          key={l.code} 
                          value={l.code} 
                          disabled={!l.active}
                          className={cn(
                            "h-12 rounded-lg focus:bg-primary/5 text-foreground font-bold uppercase text-[11px] tracking-wider cursor-pointer",
                            !l.active && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {l.name} {!l.active && `(${t('dreams.comingSoon', 'Coming Soon')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)} 
                    className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                  </Button>
                  <Button 
                    onClick={saveLanguageStep} 
                    disabled={saving || !selectedLanguage} 
                    className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.next', 'Next Step')}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="bg-muted/20 rounded-2xl p-6 border border-border/40 space-y-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {t('onboarding.privacy_title', 'Bank-Grade Security')}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-1">
                        {t('onboarding.privacy_desc', 'Your financial data is processed locally on your device. We never sell or share your personal information.')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)} 
                    className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next', 'Next Step')}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="bg-muted/20 rounded-2xl p-6 border border-border/40 space-y-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {t('onboarding.privacy_title2', 'Your Data, Your Control')}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-1">
                        {t('onboarding.privacy_desc2', 'You can delete your data anytime. We use AES-256 encryption for all financial records. No third-party data sharing, ever.')}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-80 leading-relaxed">
                      {t('onboarding.privacy_legal', 'By continuing, you agree to our Privacy Policy and Terms of Service.')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(3)} 
                    className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                  </Button>
                  <Button 
                    onClick={savePrivacyStep} 
                    disabled={saving} 
                    className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('onboarding.accept_continue', 'I Accept & Continue')}
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-all">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">{t('onboarding.sms_access', 'SMS Intelligence')}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('onboarding.sms_access_desc', 'Auto-detect transactions for instant ledgers.')}</p>
                    </div>
                    {permissionsStatus.sms === 'granted' && <CheckCircle2 className="h-5 w-5 text-income" />}
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-all">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">{t('onboarding.mic_access', 'Voice Recording')}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('onboarding.mic_access_desc', 'Speak expenses naturally for instant capture.')}</p>
                    </div>
                    {permissionsStatus.mic === 'granted' && <CheckCircle2 className="h-5 w-5 text-income" />}
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-all">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">{t('onboarding.notifications', 'Smart Alerts')}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('onboarding.notifications_desc', 'Daily spending pulse and budget limits.')}</p>
                    </div>
                    {permissionsStatus.notifications === 'granted' && <CheckCircle2 className="h-5 w-5 text-income" />}
                  </div>
                </div>

                {permissionsStatus.sms === 'denied' && Capacitor.getPlatform() === 'android' && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-3 shadow-inner">
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-widest text-center leading-relaxed">
                      {t('onboarding.permission_denied_warning', 'SMS Permission is mandatory for auto-tracking. Please enable it in Settings.')}
                    </p>
                    <Button 
                      onClick={openAppSettings} 
                      className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm"
                    >
                      <Settings className="h-4 w-4 mr-2" /> {t('common.open_settings', 'Open App Settings')}
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(4)} 
                    className="w-full h-[52px] rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase text-[11px] tracking-widest border border-border/50 shadow-sm active:scale-[0.98]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', 'Back')}
                  </Button>
                  <Button 
                    onClick={handlePermissionRequest} 
                    disabled={saving} 
                    className="w-full h-[52px] mt-2 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-premium active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {t('onboarding.initialize_protocol', 'Initialize Protocol')}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default SetupWizard;
