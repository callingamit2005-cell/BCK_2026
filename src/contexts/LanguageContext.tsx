import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import '@/i18n/index'; 
import { useTranslation } from 'react-i18next';

export type Language = 
  | 'en' | 'hi' | 'hinglish' | 'aw' | 'sa' | 'ur' | 'bho' | 'bn' 
  | 'as' | 'te' | 'ta' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' 
  | 'pa' | 'kok' | 'ks' | 'doi' | 'ne' | 'mai' | 'sat';

export const LANGUAGE_NAMES: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  hinglish: { name: 'Hinglish', nativeName: 'हिंग्लिश', flag: '🇮🇳' },
  aw: { name: 'Awadhi', nativeName: 'अवधी', flag: '🇮🇳' },
  sa: { name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳' },
  ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
  bho: { name: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  kok:{ name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳' },
  ks: { name: 'Kashmiri', nativeName: 'कॉशुर', flag: '🇮🇳' },
  doi:{ name: 'Dogri', nativeName: 'डोगरी', flag: '🇮🇳' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', flag: '🇮🇳' },
  mai:{ name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳' },
  sat:{ name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
};

const DEFAULT_LANGUAGES = [{ code: 'en' as Language, name: 'English' }];
const LANGUAGE_ONBOARDING_KEY = 'language-onboarding-complete';

// 🚀 Saari Indian bhashaon ki list
const INDIAN_LANGUAGES = (Object.keys(LANGUAGE_NAMES) as Language[])
  .map(code => ({ code, name: LANGUAGE_NAMES[code].name }));

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
  t: (key: string, defaultTextOrParams?: any) => string;
  availableLanguages: { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, preferences, refreshPreferences, userProfile } = useAuth();
  const { toast } = useToast();
  const { t: i18nT, i18n } = useTranslation();
  
  const [language, setLanguageState] = useState<Language>('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFirstLoginLanguageModal, setShowFirstLoginLanguageModal] = useState(false);
  
  // 🚀 FIX 1: By default saari bhashayein dikhao, sirf English nahi
  const [availableLanguages, setAvailableLanguages] = useState<{ code: Language; name: string }[]>(INDIAN_LANGUAGES);
  const [initialized, setInitialized] = useState(false);

  // 🚀 FIX 2: Bulletproof Translation Function
  const t = useCallback((key: string, defaultTextOrParams?: any): string => {
    const params = typeof defaultTextOrParams === 'object' ? defaultTextOrParams : undefined;
    const fallbackText = typeof defaultTextOrParams === 'string' ? defaultTextOrParams : undefined;

    const result = i18nT(key, params);

    // Agar translation nahi mili, toh proper English fallback text dikhao (Ajeeb code nahi)
    if (result === key && fallbackText) {
      return fallbackText;
    }
    return result as string;
  }, [i18nT]);

  useEffect(() => {
    const loadLanguage = async () => {
      let activeLang: Language = 'en';
      if (preferences?.language) {
        activeLang = preferences.language as Language;
      } else {
        const storedLang = localStorage.getItem('preferred-language') as Language | null;
        if (storedLang && storedLang in LANGUAGE_NAMES) {
          activeLang = storedLang;
        }
      }
      setLanguageState(activeLang);
      localStorage.setItem('preferred-language', activeLang);
      await i18n.changeLanguage(activeLang);
      setInitialized(true);
    };
    loadLanguage();
  }, [preferences, i18n]);

  // 🚀 FIX 1 (Part B): Country check hata diya taaki sabko Indian languages dikhein
  useEffect(() => {
    setAvailableLanguages(INDIAN_LANGUAGES);
  }, [preferences?.country]);

  useEffect(() => {
    if (!initialized || !user) return;
    if (window.location.pathname.startsWith('/setup')) return;
    
    // 🚀 FIXED: Only trigger language selection AFTER privacy is accepted.
    if (!userProfile?.privacy_completed) return;

    // 🚀 FIX: Load directly from localStorage
    const hasCompletedOnboarding = localStorage.getItem(LANGUAGE_ONBOARDING_KEY) === 'true';
    if (!hasCompletedOnboarding) {
      setShowFirstLoginLanguageModal(true);
    }
  }, [initialized, user, userProfile]);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      setLanguageState(lang);
      localStorage.setItem('preferred-language', lang);
      // 🚀 The Memory Lock is applied here when the user selects a language.
      localStorage.setItem(LANGUAGE_ONBOARDING_KEY, 'true'); 
      await i18n.changeLanguage(lang);

      if (user) {
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_preferences')
            .update({ language: lang, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_preferences')
            .insert({ user_id: user.id, language: lang, created_at: new Date().toISOString() });
        }
        await refreshPreferences();

        toast({
          title: t('common.save', 'Saved'),
          description: t('common.languageChanged', `Language changed to ${LANGUAGE_NAMES[lang]?.name}`),
          className: "bg-foreground text-surface",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('common.saveFailed', 'Failed to save language.'),
        variant: "destructive",
      });
    }
  }, [user, refreshPreferences, toast, t, i18n]);

  if (!initialized && user) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ 
      language, setLanguage, showLanguageModal, setShowLanguageModal, t, availableLanguages
    }}>
      {children}
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
      {showFirstLoginLanguageModal && (
        <LanguageSelectorModal
          mandatory
          onSelect={async (lang) => {
            await setLanguage(lang);
            setShowFirstLoginLanguageModal(false);
          }}
          onClose={() => undefined}
          availableLanguages={availableLanguages}
        />
      )}
    </LanguageContext.Provider>
  );
};

// 🚀 MODAL UI WITH PROPER FALLBACK STRINGS
const LanguageSelectorModal: React.FC<{
  onSelect: (lang: Language) => void;
  onClose: () => void;
  availableLanguages: { code: Language; name: string }[];
  mandatory?: boolean;
}> = ({ onSelect, onClose, availableLanguages, mandatory = false }) => {
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const { language: currentLang, t } = useLanguage();

  useEffect(() => {
    setSelectedLang(currentLang);
  }, [currentLang]);

  const gradientClass = "bg-foreground";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 animate-in fade-in duration-300 backdrop-blur-sm">
      <div className="bg-surface rounded-t-[28px] sm:rounded-modal w-full max-w-md mx-auto shadow-institutional animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border-t sm:border border-border/40">
        
        {/* Header - Fixed */}
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 text-center bg-background/50">
          <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
            {t('common.selectLanguage', 'Select Language')}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-1.5 opacity-60">{t('common.chooseLanguage', 'Choose your preferred language')}</p>
        </div>

        {/* List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain custom-scrollbar bg-surface">
          {availableLanguages.map(({ code, name }) => (
            <button
              key={code}
              onClick={() => setSelectedLang(code)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-5 group ${
                selectedLang === code
                  ? 'border-institutional-blue bg-background ring-4 ring-institutional-blue/5'
                  : 'border-border/40 hover:border-institutional-blue/20 hover:bg-background'
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-surface-elevated shadow-inner border border-border/40 flex items-center justify-center text-3xl group-active:scale-95 transition-transform shrink-0">
                {LANGUAGE_NAMES[code]?.flag || '🌐'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`font-black text-lg uppercase tracking-tight truncate ${selectedLang === code ? 'text-foreground' : 'text-text-secondary'}`}>
                  {LANGUAGE_NAMES[code]?.name || name}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted truncate mt-1 opacity-60">
                  {LANGUAGE_NAMES[code]?.nativeName || name}
                </p>
              </div>
              {selectedLang === code && (
                <div className="w-6 h-6 bg-institutional-blue rounded-full flex items-center justify-center shadow-lg shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Actions - Fixed at Bottom */}
        <div className="p-6 bg-background/50 border-t border-border/40 shrink-0">
          <div className="flex gap-4 mb-5">
            {!mandatory && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-14 rounded-xl border-border/40 bg-surface text-foreground font-black uppercase text-[10px] tracking-[0.2em] hover:bg-background transition-all active:scale-95 shadow-sm"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            )}
            {mandatory && (
              <Button
                variant="outline"
                onClick={() => onSelect('en')}
                className="flex-1 h-14 rounded-xl border-border/40 bg-surface text-foreground font-black uppercase text-[10px] tracking-[0.2em] hover:bg-background transition-all active:scale-95 shadow-sm"
              >
                {t('common.continueEnglish', 'English')}
              </Button>
            )}
            <Button
              onClick={() => onSelect(selectedLang)}
              className={`flex-[1.5] h-14 bg-foreground text-surface rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-institutional hover:bg-foreground/90 transition-all active:scale-95`}
            >
              {t('common.apply', 'Apply')}
            </Button>
          </div>
          
          <p className="text-[10px] text-center font-black uppercase tracking-widest text-text-muted opacity-40 italic">
            {t('common.languagePersistMessage', 'Identity Saved Locally')}
          </p>
        </div>
      </div>
    </div>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
