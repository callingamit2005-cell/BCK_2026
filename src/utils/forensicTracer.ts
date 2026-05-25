/**
 * 🕵️ PASSIVE FORENSIC TRACER (STABILIZED)
 * 
 * Removed global window.fetch monkey-patch to prevent Android transport instability.
 * This file now only maintains passive state for high-level event correlation.
 */

export const forensicState = {
    userId: 'anonymous',
    isAuthReady: false,
    appActive: true,
    lastEvent: 'none'
};

/**
 * No-op initialization to maintain compatibility with existing entry points.
 * Global fetch override has been REMOVED to stabilize Android WebView.
 */
export const initForensicTracer = () => {
    console.log("🕵️ Passive Forensic Tracer Active (Global fetch override REMOVED)");
};
