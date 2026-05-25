type EnvKey =
  | "VITE_BASE_URL"
  | "VITE_APP_URL"
  | "VITE_ENABLE_ANALYTICS"
  | "VITE_ENABLE_NEW_I18N"
  | "VITE_ENABLE_VOICE_V2"
  | "VITE_ENABLE_REALTIME_SYNC"
  | "VITE_ENABLE_TXN_AUTODETECT"
  | "VITE_ENABLE_SMS_PREMIUM_GATE"
  | "VITE_ENABLE_EXPORT_PREMIUM_GATE"
  | "VITE_TRIP_DATA_MODE"
  | "VITE_GROQ_API_KEY"
  | "VITE_GROQ_MODEL"
  | "VITE_AI_PROVIDER"
  | "VITE_RAZORPAY_KEY_ID";

const env = import.meta.env;

const getEnv = (key: EnvKey, fallback = ""): string => {
  const value = env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
};

const getBool = (key: EnvKey, fallback = false): boolean => {
  const raw = getEnv(key);
  if (!raw) {
    return fallback;
  }

  return raw.toLowerCase() === "true";
};

const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

const DEFAULT_BASE_URL = "http://localhost:8081";
const BASE_URL = normalizeUrl(getEnv("VITE_BASE_URL", DEFAULT_BASE_URL));

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

export const appEnv = {
  baseUrl: BASE_URL,
  appUrl: normalizeUrl(getEnv("VITE_APP_URL", BASE_URL)),
  paymentVerifyUrl: buildApiUrl("/api/payment/verify"),
  tripDataMode: getEnv("VITE_TRIP_DATA_MODE", "static"),
  groqApiKey: getEnv("VITE_GROQ_API_KEY"),
  groqModel: getEnv("VITE_GROQ_MODEL", "llama-3.1-8b-instant"),
  aiProvider: getEnv("VITE_AI_PROVIDER", "groq"),
  razorpayKeyId: getEnv("VITE_RAZORPAY_KEY_ID"),
  flags: {
    analytics: getBool("VITE_ENABLE_ANALYTICS", false),
    newI18n: getBool("VITE_ENABLE_NEW_I18N", false),
    voiceV2: getBool("VITE_ENABLE_VOICE_V2", false),
    realtimeSync: getBool("VITE_ENABLE_REALTIME_SYNC", false),
    transactionAutoDetect: getBool("VITE_ENABLE_TXN_AUTODETECT", false),
    smsRequiresPremium: getBool("VITE_ENABLE_SMS_PREMIUM_GATE", false),
    exportRequiresPremium: getBool("VITE_ENABLE_EXPORT_PREMIUM_GATE", false),
  },
} as const;
