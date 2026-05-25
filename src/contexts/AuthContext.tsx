// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SmsBridge from "@/integrations/smsBridge";
import { forensicState } from "@/utils/forensicTracer";
import { hydrateLocalActiveGroupFromCloud, scheduleActiveGroupSync } from "@/services/activeGroupState";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthReady: boolean;
  preferences: { language: string; country: string | null } | null;
  userProfile: any | null;
  preferencesLoading: boolean;
  signOut: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [preferences, setPreferences] = useState<{ language: string; country: string | null } | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const navigate = useNavigate();

  // 🛡️ [RUNTIME_STABILIZATION] Singleton Guards
  const authListenerStarted = useRef(false);
  const syncSessionInProgress = useRef(false);

  const lastFetchedUserId = useRef<string | null>(null);
  const isFetchingPreferences = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const currentUserRef = useRef<User | null>(null);

  const fetchProfileAndPreferences = async (userId: string, force = false) => {
    if (isFetchingPreferences.current) return;
    if (!force && lastFetchedUserId.current === userId && Date.now() - lastFetchTime.current < 5000) return;

    isFetchingPreferences.current = true;
    setPreferencesLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile) setUserProfile(profile);

      const { data } = await supabase.rpc("get_or_create_user_preferences", { p_user_id: userId });
      if (data && data.length > 0) {
        const pref = data[0];
        setPreferences({ language: pref.language, country: pref.country });
        if (pref.language) {
          localStorage.setItem('preferred-language', pref.language);
          localStorage.setItem('language-onboarding-complete', 'true');
        }
      }

      // PHASE 1: Hybrid Active Group (cloud secondary hydration)
      // Never block auth on this; errors are ignored.
      try {
        await hydrateLocalActiveGroupFromCloud(userId);
        scheduleActiveGroupSync(userId); // best-effort persist if local newer
      } catch {
        // ignore
      }

      lastFetchedUserId.current = userId;
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error("fetchProfileAndPreferences error:", err);
    } finally {
      setPreferencesLoading(false);
      isFetchingPreferences.current = false;
    }
  };

  const refreshPreferences = React.useCallback(async () => {
    if (user) await fetchProfileAndPreferences(user.id, true);
  }, [user]);

  const syncNativeSession = React.useCallback(async (session: Session | null) => {
    if (Capacitor.getPlatform() !== "android" || !session?.user?.id) return;
    if (syncSessionInProgress.current) return;
    syncSessionInProgress.current = true;

    try {
      await SmsBridge.setSession({ userId: session.user.id, accessToken: session.access_token });
      await SmsBridge.updateSyncSession({
        userId: session.user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token || "",
        expiresAt: session.expires_at || 0,
      });
    } catch (e) {
      console.error("Native session sync failed:", e);
    } finally {
      syncSessionInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    // 🛡️ [RUNTIME_STABILIZATION] Prevent duplicate auth initializers
    if (authListenerStarted.current) return;
    authListenerStarted.current = true;
    console.log("[AUTH_SUBSCRIBE_COUNT] 1 (Initializing Auth Stream)");

    let mounted = true;
    const initializeAuth = async () => {
      // 🛡️ [AUTH_SINGLETON_GUARD]
      console.log("[BOOT_SEQUENCE_LOCK] Requesting Auth Hydration");
      console.log("[AUTH_HYDRATION_START] Starting auth hydration process");
      
      // 🛡️ MOBILE_GUARD_REMOVAL: 
      // Arbitrary 2-second delay removed. We now prioritize immediate session hydration 
      // to satisfy the native Orphan Guard as early as possible.

      let attempts = 0;
      const maxAttempts = 3;
      let sessionData = null;
      let fetchError = null;

      // FIX 3: HARD HYDRATION TIMEOUT (FAIL-FAST)
      const hydrationTimeoutId = setTimeout(() => {
        if (mounted) {
          console.error("[HYDRATION_FAIL_FAST] Hard timeout exceeded");
          console.log("[OFFLINE_SAFE_MODE] Forced offline transition");
          setIsAuthReady(true);
          forensicState.isAuthReady = true;
          setLoading(false);
        }
      }, 10000); // Reduced to 10s for faster boot perception

      while (attempts < maxAttempts && mounted) {
        try {
          console.log(`[HYDRATION_TRIGGER_SOURCE] Cold Boot (Attempt ${attempts + 1})`);
          // 🛡️ [LOCK_SAFETY] getSession() acquires a navigator lock on Web
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          sessionData = session;
          fetchError = null;
          break; 
        } catch (err: any) {
          fetchError = err;
          attempts++;
          
          const isTransportError = 
            err?.message?.includes('Failed to fetch') || 
            err?.message?.includes('AUTH_TRANSPORT_DOWN') ||
            err?.name === 'TypeError' || 
            err?.message?.includes('QUIC_PROTOCOL_ERROR') ||
            err?.name === 'NavigatorLockAcquireTimeoutError';
          
          if (!mounted) break;

          // FIX 2: HYDRATION FAIL FAST
          if (err?.message === 'AUTH_TRANSPORT_DOWN') {
            console.error("[HYDRATION_FAIL_FAST] Transport circuit breaker open");
            console.log("[OFFLINE_SAFE_MODE] Entering degraded offline state");
            break;
          }

          if (isTransportError && attempts < maxAttempts) {
            const delay = attempts * 500;
            console.warn(`[AUTH_HYDRATION_RETRY] Transport or Lock failure (Attempt ${attempts}). Retrying in ${delay}ms...`, { error: err.message });
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            break;
          }
        }
      }

      try {
        if (mounted && sessionData) {
          console.log("[BOOT_4] Auth hydration success");
          currentUserRef.current = sessionData.user;
          forensicState.userId = sessionData.user.id;
          setSession(sessionData);
          setUser(sessionData.user);
          
          // 🚀 [IMMEDIATE_SESSION_SYNC] 
          // Sync to native bridge IMMEDIATELY before setting isAuthReady.
          // This ensures the Orphan Guard is unlocked before the first SMS scan or receiver event.
          await syncNativeSession(sessionData);
          
          void fetchProfileAndPreferences(sessionData.user.id);
        } else if (mounted) {
          if (fetchError) console.error("[AUTH_HYDRATION_FAIL] Terminal failure:", fetchError);
          console.log("[BOOT_4] Auth hydration finished (No Session)");
        }
      } catch (err) {
        console.error("Auth state update failed:", err);
      } finally {
        clearTimeout(hydrationTimeoutId);
        if (mounted) {
          setIsAuthReady(true);
          forensicState.isAuthReady = true;
          setLoading(false);
          console.log("[AUTH_HYDRATION_END] Auth hydration process completed");
          
          // 🛡️ [LOCK_SEQUENCING] Start event subscription AFTER initial hydration to avoid race conditions
          subscribeToEvents();
        }
      }
    };

    const subscribeToEvents = () => {
        if (!mounted) return;
        
        console.log("[AUTH_SUBSCRIBE_COUNT] 1 (Subscribing to Auth Events)");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (import.meta.env.DEV) console.log("🔍 [AUTH_EVENT]:", event);
          forensicState.lastEvent = event;

          if (event === 'INITIAL_SESSION' && !session) {
            return;
          }
          
          if (mounted) {
            try {
              if (event === "SIGNED_OUT") {
                console.log("[AUTH_EVENT] User signed out");
                currentUserRef.current = null;
                forensicState.userId = 'anonymous';
                setSession(null); setUser(null); setUserProfile(null); setPreferences(null);
                lastFetchedUserId.current = null; isFetchingPreferences.current = false; lastFetchTime.current = 0;
                await SmsBridge.clearSyncSession();
                return;
              }

              if (session) {
                // 🛡️ AUTH LOOP GUARD: Break if user is already same
                if (currentUserRef.current?.id === session.user.id && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                  return;
                }

                console.log(`[AUTH_EVENT] ${event} for user: ${session.user.id}`);
                currentUserRef.current = session.user;
                forensicState.userId = session.user.id;
                setSession(session); 
                setUser(session.user);
                void syncNativeSession(session);
                void fetchProfileAndPreferences(session.user.id);
              }
            } catch (err) {
              console.error("Auth state change error:", err);
            }
          }
        });

        authSubscriptionRef.current = subscription;
    };

    const authSubscriptionRef = { current: null as any };
    initializeAuth();

    return () => { 
        mounted = false; 
        if (authSubscriptionRef.current) authSubscriptionRef.current.unsubscribe(); 
    };
  }, [syncNativeSession]);

  const signOut = React.useCallback(async () => { await supabase.auth.signOut(); }, []);

  const contextValue = React.useMemo(() => ({ 
    user, 
    session, 
    loading, 
    isAuthReady, 
    preferences, 
    userProfile, 
    preferencesLoading, 
    signOut, 
    refreshPreferences 
  }), [user, session, loading, isAuthReady, preferences, userProfile, preferencesLoading, signOut, refreshPreferences]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
