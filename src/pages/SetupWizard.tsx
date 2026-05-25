/**
 * SetupWizard.tsx - BachatKaro Premium Onboarding
 * UI: Neon Gradient Masterpiece with Robust Error Handling
 * 🚀 FIX: Synchronized 'profiles' and 'user_preferences' tables to stop infinite setup loop.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LANGUAGE_NAMES, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// Configuration Constants
const COUNTRIES = [
  { code: 'IN', name: 'India 🇮🇳' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'AE', name: 'UAE 🇦🇪' },
];

const ALL_LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[]).map(code => ({
  code,
  name: LANGUAGE_NAMES[code].name,
}));

const DEFAULT_LANGUAGES = [{ code: 'en', name: 'English' }];
const primaryGradient = 'bg-gradient-to-br from-[#7C3AED] to-[#EC4899]';

const SetupWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, userProfile, preferencesLoading, refreshPreferences } = useAuth();
  const { setLanguage } = useLanguage();

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Logic: Filter languages based on country selection
  const availableLanguages = selectedCountry === 'IN' ? ALL_LANGUAGES : DEFAULT_LANGUAGES;

  // Effect: Auto-select English for non-IN countries to speed up UX
  useEffect(() => {
    if (selectedCountry && selectedCountry !== 'IN') {
      setSelectedLanguage('en');
    }
  }, [selectedCountry]);

  // Guard: Redirect if already setup or not logged in
  useEffect(() => {
    if (!preferencesLoading && userProfile?.has_completed_setup) {
      navigate('/dashboard', { replace: true });
    }
  }, [preferencesLoading, userProfile, navigate]);

  // 🛡️ ZERO FLICKER AUTH GUARD
  if (loading || preferencesLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async () => {
    if (!selectedCountry || !selectedLanguage) {
      toast({ title: "Required", description: "Please select both region and language.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Step 1: Update Supabase Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          country: selectedCountry,
          preferred_language: selectedLanguage,
          has_completed_setup: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 🚀 NEW CRITICAL FIX: Update user_preferences table!
      // Iske bina AuthContext wapas Setup page par bhej raha tha.
      const { error: prefError } = await supabase
        .from('user_preferences')
        .update({
          country: selectedCountry,
          language: selectedLanguage,
          is_new_user: true, // YE LINE INFINITE LOOP ROKTI HAI
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (prefError) throw prefError;

      // Step 2: Update Local App State
      await setLanguage(selectedLanguage as any);
      await refreshPreferences();

      toast({
        title: 'Welcome Aboard! 🚀',
        description: 'Your BachatKaro profile is now active.',
        className: `${primaryGradient} text-white border-none shadow-2xl`,
      });

      // Step 3: Final Handshake to Dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error("Setup Error:", err);
      toast({
        title: 'Setup Failed',
        description: err.message || 'Something went wrong while saving your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8FAFC] relative overflow-hidden">
      {/* Decorative Neon Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-[100px]" />
      
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/60 overflow-hidden relative z-10">
        <div className={`h-2 w-full ${primaryGradient}`} />
        
        <CardHeader className="text-center pt-10 pb-4 px-8 space-y-4">
          <div className="flex justify-center">
            <div className={`w-20 h-20 flex items-center justify-center rounded-[28px] ${primaryGradient} shadow-xl shadow-purple-500/20 transform hover:scale-110 transition-transform duration-300`}>
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className={`text-3xl font-black bg-clip-text text-transparent ${primaryGradient}`}>
              BachatKaro
            </CardTitle>
            <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
              Premium Onboarding Experience
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Your Region</Label>
                <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setStep(2); }}>
                  <SelectTrigger className="h-16 rounded-2xl border-2 border-slate-100 hover:border-purple-200 transition-colors bg-white/50 text-lg font-bold text-slate-900">
                    <SelectValue placeholder="Where are you from?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl bg-white text-slate-900">
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code} className="h-12 rounded-xl focus:bg-purple-50 text-slate-900 font-bold">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-center text-xs text-slate-400">Region helps us optimize your local currency and split logic.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-16 rounded-2xl border-2 border-slate-100 hover:border-purple-200 transition-colors bg-white/50 text-lg font-bold text-slate-900">
                    <SelectValue placeholder="Talk to us in..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl bg-white text-slate-900">
                    {availableLanguages.map(l => (
                      <SelectItem key={l.code} value={l.code} className="h-12 rounded-xl focus:bg-purple-50 text-slate-900 font-bold">{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)} 
                  className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={saving || !selectedLanguage} 
                  className={`flex-[2] h-14 ${primaryGradient} text-white rounded-2xl font-black shadow-xl shadow-purple-200 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50`}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Finish Setup
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupWizard;
