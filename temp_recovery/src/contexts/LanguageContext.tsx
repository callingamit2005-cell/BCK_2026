/**
 * LanguageContext
 * 
 * Manages multilingual support across the application.
 * Features:
 * - Uses user preferences from AuthContext
 * - Dynamic language list based on user's country
 * - Persists changes to both localStorage and Supabase
 * - Supports 15+ Indian languages with full translation
 * - Provides translation function `t` for components
 * 
 * @context
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getTranslation, type TranslationKey } from '@/i18n/translations'; // 👈 import translation helper

/**
 * Supported language codes
 * Add new languages here as needed (must match keys in translations.ts)
 */
export type Language = 
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'aw'
  | 'sa'
  | 'ur'
  | 'bho'
  | 'bn'
  | 'te'
  | 'ta'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa'
  | 'mai'   // 👈 add Maithili
  | 'sat';  // 👈 add Santali

/**
 * Language display names for selector
 */
export const LANGUAGE_NAMES: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  hinglish: { name: 'Hinglish', nativeName: 'हिंग्लिश', flag: '🇮🇳' },
  aw: { name: 'Awadhi', nativeName: 'अवधी', flag: '🇮🇳' },
  sa: { name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳' },
  ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
  bho: { name: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  mai:{ name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳' },
  sat:{ name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
};

// Default languages for non-India users (only English)
const DEFAULT_LANGUAGES = [{ code: 'en' as Language, name: 'English' }];

// Build available languages list from LANGUAGE_NAMES
const INDIAN_LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[])
  .map(code => ({ code, name: LANGUAGE_NAMES[code].name }));

/**
 * Language context interface
 */
interface LanguageContextType {
  /** Current language code */
  language: Language;
  /** Set language and persist preference */
  setLanguage: (lang: Language) => Promise<void>;
  /** Show/hide language selector modal (for settings) */
  showLanguageModal: boolean;
  /** Control language selector visibility */
  setShowLanguageModal: (show: boolean) => void;
  /** Translation function: pass a key and optional interpolation parameters */
  t: <K extends TranslationKey>(key: K, params?: Record<string, string | number>) => string;
  /** List of available languages based on user's country */
  availableLanguages: { code: Language; name: string }[];
}

/**
 * Create context with default values
 */
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Language Provider Component
 * Wraps the app to provide language functionality
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, preferences, refreshPreferences } = useAuth();
  const { toast } = useToast();
  
  // State
  const [language, setLanguageState] = useState<Language>('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: Language; name: string }[]>(DEFAULT_LANGUAGES);
  const [initialized, setInitialized] = useState(false);

  /**
   * Translation function using the current language
   */
  const t = useCallback(<K extends TranslationKey>(key: K, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params);
  }, [language]);

  /**
   * Load language from preferences or localStorage
   */
  useEffect(() => {
    const loadLanguage = async () => {
      // Priority: 1. Auth preferences (if user logged in) 2. localStorage 3. Default 'en'
      if (preferences?.language) {
        setLanguageState(preferences.language as Language);
        localStorage.setItem('preferred-language', preferences.language);
      } else {
        const storedLang = localStorage.getItem('preferred-language') as Language | null;
        if (storedLang && storedLang in LANGUAGE_NAMES) {
          setLanguageState(storedLang);
        } else {
          setLanguageState('en');
        }
      }
      setInitialized(true);
    };
    loadLanguage();
  }, [preferences]);

  /**
   * Update available languages based on user's country
   */
  useEffect(() => {
    if (preferences?.country === 'IN') {
      setAvailableLanguages(INDIAN_LANGUAGES);
    } else {
      setAvailableLanguages(DEFAULT_LANGUAGES);
    }
  }, [preferences?.country]);

  /**
   * Save language preference
   * Updates localStorage and Supabase, then refreshes AuthContext
   */
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      // Update local state
      setLanguageState(lang);
      localStorage.setItem('preferred-language', lang);

      // If user is logged in, update Supabase
      if (user) {
        // Check if preference exists
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          // Update
          await supabase
            .from('user_preferences')
            .update({ language: lang, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          // Insert (should not happen because get_or_create_user_preferences creates on login, but just in case)
          await supabase
            .from('user_preferences')
            .insert({ user_id: user.id, language: lang, created_at: new Date().toISOString() });
        }

        // Refresh preferences in AuthContext
        await refreshPreferences();

        // Show success toast using the new language
        toast({
          title: t('common.save'), // You'll need to add 'common.save' to translations
          description: t('language.changed', { name: LANGUAGE_NAMES[lang]?.name || lang }),
          className: "bg-green-600 text-white",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
      toast({
        title: t('common.error'),
        description: t('common.saveFailed'),
        variant: "destructive",
      });
    }
  }, [user, refreshPreferences, toast, t]);

  // Don't render children until initialized to prevent flash of wrong language
  if (!initialized && user) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage,
      showLanguageModal,
      setShowLanguageModal,
      t,
      availableLanguages
    }}>
      {children}
      
      {/* Language Selector Modal - for changing language from settings */}
      {showLanguageModal && (
        <LanguageSelectorModal 
          onSelect={async (lang) => {
            await setLanguage(lang);
            setShowLanguageModal(false);
          }}
          onClose={() => setShowLanguageModal(false)}
          availableLanguages={availableLanguages}
        />
      )}
    </LanguageContext.Provider>
  );
};

/**
 * Language Selector Modal Component
 * Beautiful, mobile-friendly modal for language selection (used in settings)
 */
const LanguageSelectorModal: React.FC<{
  onSelect: (lang: Language) => void;
  onClose: () => void;
  availableLanguages: { code: Language; name: string }[];
}> = ({ onSelect, onClose, availableLanguages }) => {
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const { language: currentLang, t } = useLanguage();

  // Initialize selected language to current language
  useEffect(() => {
    setSelectedLang(currentLang);
  }, [currentLang]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{t('common.selectLanguage')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('common.chooseLanguage')}</p>
        </div>

        {/* Language Options */}
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {availableLanguages.map(({ code, name }) => (
            <button
              key={code}
              onClick={() => setSelectedLang(code)}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                selectedLang === code
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <span className="text-3xl">{LANGUAGE_NAMES[code]?.flag || '🌐'}</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-800">
                  {LANGUAGE_NAMES[code]?.name || name}
                </p>
                <p className="text-sm text-gray-500">
                  {LANGUAGE_NAMES[code]?.nativeName || name}
                </p>
              </div>
              {selectedLang === code && (
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-2 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => onSelect(selectedLang)}
            className="flex-1 h-12 bg-gradient-to-r from-purple-800 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            {t('common.apply')}
          </Button>
        </div>

        {/* Trust Message */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-400">
            {t('common.languagePersistMessage')}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom hook to use language context
 * Must be used within LanguageProvider
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};