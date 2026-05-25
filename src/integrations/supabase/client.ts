import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("❌ CRITICAL: Missing Supabase Environment Variables!");
}

/**
 * 🛡️ TRANSPORT STABILIZATION
 * Native window.fetch is used directly to avoid bridge overload and context conflicts.
 */
console.log("[BOOT_2] Supabase client ready");
console.log("[SUPABASE_INIT] Initializing Supabase client");

/**
 * 🛡️ TRANSPORT CIRCUIT BREAKERS (Split Architecture)
 * BACKGROUND_REFRESH_BREAKER: Controls silent token refreshes.
 * MANUAL_AUTH_CHANNEL: Always remains open for user-initiated actions.
 */
export const refreshBreaker = {
  consecutiveFailures: 0,
  isDown: false,
  lastFailureTime: 0,
  recordFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    if (this.consecutiveFailures >= 3) {
      if (!this.isDown) {
        console.error("[BACKGROUND_REFRESH_BREAKER_OPEN]");
        // 🚀 PHASE 1 & 2: Suppress recursive refresh scheduling and visibility handlers
        try { supabase.auth.stopAutoRefresh(); } catch (e) {}
      }
      this.isDown = true;
    }
  },
  recordSuccess() {
    if (this.isDown) {
      console.log("[BACKGROUND_REFRESH_BREAKER_RESET]");
      // 🚀 PHASE 3: Safe resume of background refresh engine
      try { supabase.auth.startAutoRefresh(); } catch (e) {}
    }
    this.consecutiveFailures = 0;
    this.isDown = false;
  }
};

const activeFetches = new Map<string, Promise<Response>>();

export const supabase = createClient<Database>(
  SUPABASE_URL || "", 
  SUPABASE_PUBLISHABLE_KEY || "", 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      // 🚀 TRANSPORT STABILIZATION: Split-breaker fetch
      fetch: async (...args) => {
        const [url, config] = args;
        const urlStr = url?.toString() || '';
        const bodyStr = config?.body?.toString() || '';
        
        // --- REQUEST CLASSIFICATION ---
        const isAuthRequest = urlStr.includes('/auth/v1/');
        const isRefresh = isAuthRequest && (urlStr.includes('refresh_token') || bodyStr.includes('refresh_token'));
        const isManualAuth = isAuthRequest && !isRefresh;

        // --- CIRCUIT BREAKER: BACKGROUND REFRESH ONLY ---
        if (isRefresh && refreshBreaker.isDown && (Date.now() - refreshBreaker.lastFailureTime < 60000)) {
          console.warn("[AUTH_REFRESH_SKIPPED] Background refresh breaker active");
          throw new Error("AUTH_TRANSPORT_DOWN");
        }

        if (isManualAuth) {
          console.log("[MANUAL_AUTH_REQUEST]", { url: urlStr });
        }

        const reqHash = `${urlStr}-${config?.method}-${bodyStr}`;

        const executeFetch = async () => {
          const MAX_RETRIES = isManualAuth ? 1 : 3; // Manual auth has lower retry to fail fast to UI
          let attempt = 0;

          while (attempt <= MAX_RETRIES) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort("Transport Timeout"), 20000);
            
            try {
              let signal = controller.signal;
              if (config?.signal) {
                if (typeof AbortSignal.any === 'function') {
                  signal = AbortSignal.any([controller.signal, config.signal]);
                  if (attempt === 0) console.log("[TRANSPORT_SIGNAL_CHAINED]");
                } else {
                  config.signal.addEventListener('abort', () => controller.abort(config.signal.reason), { once: true });
                }
              }

              const response = await window.fetch(url, {
                ...config,
                signal: signal,
              });
              
              clearTimeout(timeoutId);
              if (isRefresh) refreshBreaker.recordSuccess();
              if (isManualAuth) console.log("[MANUAL_AUTH_ALLOWED]");
              return response;
            } catch (err: any) {
              clearTimeout(timeoutId);
              attempt++;
              
              const isTransportError = 
                err.name === 'AbortError' || 
                err.message?.includes('Failed to fetch') || 
                err.message?.includes('QUIC_PROTOCOL_ERROR') ||
                err.name === 'TypeError';

              if (isTransportError) {
                if (isRefresh) refreshBreaker.recordFailure();
                
                if (attempt <= MAX_RETRIES && (!isRefresh || !refreshBreaker.isDown)) {
                  if (isManualAuth) console.warn("[MANUAL_AUTH_RETRY]", { attempt });
                  const delay = attempt * 1000;
                  await new Promise(r => setTimeout(r, delay));
                  continue;
                } else {
                  if (isManualAuth) console.error("[MANUAL_AUTH_FAIL]", { error: err.message });
                  console.error("[TRANSPORT_RETRY_TERMINATED]");
                  throw new Error(isRefresh && refreshBreaker.isDown ? "AUTH_TRANSPORT_DOWN" : (err.message || "Transport Error"));
                }
              }
              throw err;
            }
          }
          throw new Error("Maximum transport retries exceeded");
        };

        // --- SINGLE-FLIGHT PROTECTION ---
        if (isAuthRequest && config?.method === 'POST') {
          if (activeFetches.has(reqHash)) {
            console.log("[AUTH_SINGLE_FLIGHT_ACTIVE]");
            const activePromise = activeFetches.get(reqHash);
            if (activePromise) {
              const res = await activePromise;
              return res.clone();
            }
          }

          const fetchPromise = (async () => {
            try {
              return await executeFetch();
            } finally {
              activeFetches.delete(reqHash);
            }
          })();

          activeFetches.set(reqHash, fetchPromise);
          const result = await fetchPromise;
          return result.clone();
        }

        return await executeFetch();
      }
    }
  }
);
