import { App } from '@capacitor/app';
import { forensicState } from '@/utils/forensicTracer';

type AppStateCallback = (isActive: boolean) => void;

/**
 * START PROTECTED FINTECH TRANSPORT REGION
 * CRITICAL FINTECH STABILITY SYSTEM.
 * DO NOT MODIFY WITHOUT LIFECYCLE REVIEW.
 */

class LifecycleService {
  private listeners: Set<AppStateCallback> = new Set();
  private isInitialized = false;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private lastState: boolean | null = null;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("[APP_RESUME_LISTENER_COUNT] 1 (LifecycleService Initialized)");
    App.addListener('appStateChange', ({ isActive }) => {
      console.log("[APP_RESUME] Global State isActive (Raw):", isActive);
      
      // 🛡️ [DEBOUNCE_GUARD] Prevent rapid foreground/background switching storms
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(() => {
        if (this.lastState === isActive) return; // Ignore duplicate identical states
        this.lastState = isActive;

        if (isActive) {
            console.log("[APP_FOREGROUND] App moved to foreground safely");
            console.log("[PROCESS_RESTORE] Checking process vitality...");
        } else {
            console.log("[APP_BACKGROUND] App moved to background safely");
            if (import.meta.env.DEV) {
              const memory = (performance as any).memory;
              if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                  console.log("[MEMORY_PRESSURE_DETECTED] High memory usage upon backgrounding");
              }
            }
        }
        forensicState.appActive = isActive;
        this.listeners.forEach(callback => callback(isActive));
      }, 300); // 300ms debounce for stability
    });
  }

  public onResume(callback: AppStateCallback) {
    const internalCallback = (isActive: boolean) => {
      if (isActive) callback(true);
    };
    this.listeners.add(internalCallback);
    console.log(`[LIFECYCLE_LISTENER_COUNT] Total onResume/onStateChange listeners: ${this.listeners.size}`);
    return () => this.listeners.delete(internalCallback);
  }

  public onStateChange(callback: AppStateCallback) {
    this.listeners.add(callback);
    console.log(`[LIFECYCLE_LISTENER_COUNT] Total onResume/onStateChange listeners: ${this.listeners.size}`);
    return () => this.listeners.delete(callback);
  }
}

export const lifecycleService = new LifecycleService();
/** END PROTECTED FINTECH TRANSPORT REGION */
