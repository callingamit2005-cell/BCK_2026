/**
 * [PROCESS_FORENSICS]
 * STRICT ROOT-CAUSE CAPTURE UTILITY
 * Role: World-class Android WebView/Capacitor Forensic Instrumentation.
 * Additive Only. No side effects on business logic.
 */

import { Capacitor } from "@capacitor/core";

// 1. Process Instance UUID
export const PROCESS_INSTANCE_ID = `PROC_${Math.random().toString(36).substring(7).toUpperCase()}`;

// 2. App Launch Counter (Persisted in localStorage for JS context correlation)
const getLaunchCount = (): number => {
    try {
        const count = parseInt(localStorage.getItem('forensic_launch_count') || '0', 10);
        const newCount = count + 1;
        localStorage.setItem('forensic_launch_count', newCount.toString());
        return newCount;
    } catch (e) {
        return -1;
    }
};

export const LAUNCH_COUNT = getLaunchCount();

// 3. Memory Snapshot Helper
export const getMemorySnapshot = () => {
    const memory = (performance as any).memory;
    return memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        deviceMemory: (navigator as any).deviceMemory || 'unknown'
    } : 'unavailable';
};

// 4. Safe Logger Helper
export const forensicLog = (event: string, data?: any) => {
    const telemetry = {
        tag: '[PROCESS_FORENSICS]',
        instance: PROCESS_INSTANCE_ID,
        launch: LAUNCH_COUNT,
        timestamp: new Date().toISOString(),
        uptime: performance.now(),
        online: navigator.onLine,
        visibility: document.visibilityState,
        url: window.location.href,
        platform: Capacitor.getPlatform(),
        memory: getMemorySnapshot(),
        event,
        ...data
    };
    console.log(`[PROCESS_FORENSICS] [${event}]`, JSON.stringify(telemetry));
};

// 5. Global JS Crash Capture
export const initializeProcessForensics = () => {
    forensicLog('APP_START', {
        userAgent: navigator.userAgent,
        navType: performance.getEntriesByType('navigation')[0]?.entryType || 'unknown'
    });

    window.onerror = (message, source, lineno, colno, error) => {
        forensicLog('JS_CRASH', {
            message,
            source,
            lineno,
            colno,
            stack: error?.stack
        });
    };

    window.onunhandledrejection = (event) => {
        forensicLog('JS_UNHANDLED_REJECTION', {
            reason: event.reason?.message || event.reason,
            stack: event.reason?.stack
        });
    };
};
