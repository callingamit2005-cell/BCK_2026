import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// List of countries (can be expanded)
const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'UAE' },
  { code: 'SG', name: 'Singapore' },
  // add more as needed
];

// Build language list from LANGUAGE_NAMES (all Indian languages + English)
const ALL_LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[]).map(code => ({
  code,
  name: LANGUAGE_NAMES[code].name,
}));

// For non-India countries, only English is shown
const DEFAULT_LANGUAGES = [{ code: 'en', name: 'English' }];

const SetupWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, preferences, preferencesLoading, refreshPreferences } = useAuth();
  const { setLanguage } = useLanguage();

  const [step, setStep] = useState(1); // 1: country, 2: language
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Determine available languages based on selected country
  const availableLanguages = selectedCountry === 'IN' ? ALL_LANGUAGES : DEFAULT_LANGUAGES;

  // Auto‑select English if only one option (non‑India countries)
  useEffect(() => {
    if (selectedCountry && selectedCountry !== 'IN' && availableLanguages.length === 1) {
      setSelectedLanguage(availableLanguages[0].code);
    } else {
      // Reset language when country changes (especially when switching to India)
      setSelectedLanguage('');
    }
  }, [selectedCountry, availableLanguages]);

  // If user already has country and language set, redirect to dashboard
  useEffect(() => {
    if (!preferencesLoading && preferences?.country && preferences?.language) {
      navigate('/dashboard', { replace: true });
    }
  }, [preferencesLoading, preferences, navigate]);

  if (preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setStep(2);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleSubmit = async () => {
    if (!selectedCountry || !selectedLanguage) {
      toast({
        title: 'Error',
        description: 'Please select both country and language.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update user preferences in Supabase
      const { error } = await supabase
        .from('user_preferences')
        .update({
          country: selectedCountry,
          language: selectedLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update language in context
      await setLanguage(selectedLanguage as any);

      // Refresh preferences in AuthContext
      await refreshPreferences();

      toast({
        title: 'Setup Complete!',
        description: 'Your preferences have been saved.',
        className: 'bg-green-600 text-white',
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save preferences.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/40 p-8">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg ring-4 ring-white/40">
              <span className="text-2xl text-white">🌍</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to BachatKaro!
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Let’s set up your preferences.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="country-select">Select your country</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country-select" className="w-full">
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center text-sm text-gray-500">
                Your country determines available languages.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language-select">Select your preferred language</Label>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={availableLanguages.length === 1}>
                  <SelectTrigger id="language-select" className="w-full">
                    <SelectValue placeholder="Choose a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountry !== 'IN' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only English is available for your selected country.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl border-gray-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !selectedLanguage}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-70"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Complete Setup'}
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