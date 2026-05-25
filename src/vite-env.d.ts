/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
