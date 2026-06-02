import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ==================================================================
// 1. 🚀 DIRECT IMPORTS (Bulletproof tarika, Vite fail nahi hoga)
// ==================================================================
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import hinglish from "./locales/hinglish.json";
import awa from "./locales/awa.json";
import bho from "./locales/bho.json";
import sa from "./locales/sa.json";
import mai from "./locales/mai.json";
import mr from "./locales/mr.json";
import gu from "./locales/gu.json";
import bn from "./locales/bn.json";
import pa from "./locales/pa.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import or from "./locales/or.json";
import as from "./locales/as.json";
import ur from "./locales/ur.json";
import mwr from "./locales/mwr.json";

// ==================================================================
// 2. ⚙️ MANUAL MAPPING (Engine ko seedha dictionary pakda di)
// ==================================================================
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  hinglish: { translation: hinglish },
  awa: { translation: awa },
  bho: { translation: bho },
  sa: { translation: sa },
  mai: { translation: mai },
  mr: { translation: mr },
  gu: { translation: gu },
  bn: { translation: bn },
  pa: { translation: pa },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  or: { translation: or },
  as: { translation: as },
  ur: { translation: ur },
  mwr: { translation: mwr }
};

// ==================================================================
// 3. 🚀 INITIALIZATION (App start hote hi language set karna)
// ==================================================================
i18n
  .use(LanguageDetector) // Browser ki default language khud pehchanega
  .use(initReactI18next) // React ke sath properly bind karega
  .init({
    resources,
    fallbackLng: "en", // Agar user ki bhasha na mile, toh English chalegi
    defaultNS: "translation", 
    returnNull: false, // 🚀 PRO TIP: React ko crash hone se bachata hai agar text missing ho
    interpolation: { 
      escapeValue: false // XSS attacks se bachne ke liye (React natively safe hai)
    }
  });

// ==================================================================
// 4. 🛠️ APP KE PURANE PLUGS (Dashboard aur Savings Modules ke liye)
// ==================================================================

// Normal Translate helper (Non-React/TS files ke liye)
export const t = (key: string, params?: Record<string, unknown>): string => {
  return i18n.t(key, params) as string;
};

// Safe Translate helper (Agar translation key na mile, toh fallback text dikhayega)
export const tSafe = (
  key: string, 
  defaultTextOrParams?: string | Record<string, unknown>
): string => {
  if (typeof defaultTextOrParams === 'string') {
    return i18n.t(key, { defaultValue: defaultTextOrParams }) as string;
  }
  return i18n.t(key, defaultTextOrParams) as string;
};

// Language change helper (Header dropdown se language badalne ke liye)
export const changeAppLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};

// Dummy loader taaki aapke purane BachatKaro components error na dein
export const loadNamespaces = async (_namespaces: readonly string[]): Promise<void> => {
  return Promise.resolve();
};

// Master Configuration Object
export const I18N_CONFIG = {
  fallbackLng: "en",
  defaultNS: "translation",
  supportedNamespaces: ["translation", "common", "dashboard", "savings", "split", "group-expenses"],
};

export default i18n;
