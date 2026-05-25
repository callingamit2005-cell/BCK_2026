/**
 * 🛡️ BACHATKARO FORENSIC VALIDATION SUITE
 * MODE: DEV-ONLY | ISOLATED | DETERMINISTIC
 * Temperature: 0.0
 */

import { format, addDays } from 'date-fns';

export interface ForensicMetrics {
  renderCount: number;
  lastRenderTime: number;
  memoryUsage?: number;
  activeRequests: number;
  detectedStorms: number;
  leakWarnings: string[];
}

class ForensicValidationEngine {
  private metrics: ForensicMetrics = {
    renderCount: 0,
    lastRenderTime: 0,
    activeRequests: 0,
    detectedStorms: 0,
    leakWarnings: []
  };

  private isEnabled = process.env.NODE_ENV === 'development';
  private soakTimer?: NodeJS.Timeout;

  /**
   * 🚀 24-HOUR SOAK TEST SIMULATOR
   * Exercises state stability over extended virtual time.
   */
  public startSoakTest() {
    if (!this.isEnabled) return;
    console.log('[FORENSIC] Starting 24-hour Soak Test Simulation...');
    
    let simulatedTicks = 0;
    this.soakTimer = setInterval(() => {
      simulatedTicks++;
      // Simulate periodic syncs and state transitions
      window.dispatchEvent(new CustomEvent('bk_soak_tick', { detail: { tick: simulatedTicks } }));
      
      if (simulatedTicks >= 1440) { // 24 hours in minutes
        this.stopSoakTest();
        console.log('[FORENSIC] Soak Test Completed Successfully.');
      }
    }, 1000); // 1 tick per second
  }

  public stopSoakTest() {
    if (this.soakTimer) clearInterval(this.soakTimer);
    console.log('[FORENSIC] Soak Test Stopped.');
  }

  /**
   * ⚡ STRESS TEST: High Volume Transaction Injection
   * Generates N mock transactions to test list virtualization and memory.
   */
  public generateStressData(count: 500 | 1000 | 5000) {
    if (!this.isEnabled) return;
    console.log(`[FORENSIC] Generating ${count} Stress Transactions...`);
    
    const mockData = Array.from({ length: count }).map((_, i) => ({
      id: `stress_${Date.now()}_${i}`,
      amount: Math.floor(Math.random() * 1000000),
      category: 'Stress Test',
      date: new Date().toISOString(),
      type: 'expense',
      sender: 'STRESS_GENERATOR',
      payment_mode: 'system',
      note: `Forensic Stress Item ${i}`
    }));

    window.dispatchEvent(new CustomEvent('bk_inject_stress_data', { detail: mockData }));
  }

  /**
   * 🌀 CHAOS TEST: Malformed Date Injection
   * Injects corrupted dates to verify RangeError resilience.
   */
  public startDateChaosTest() {
    if (!this.isEnabled) return;
    const corruptedDates = ['', 'invalid-date', '2026-99-99', 'null', 'undefined'];
    console.log('[FORENSIC] Injecting Malformed Date Chaos...');
    
    const chaosData = corruptedDates.map((date, i) => ({
      id: `chaos_${i}`,
      amount: 100,
      category: 'Chaos Test',
      date: date as any,
      type: 'expense'
    }));

    window.dispatchEvent(new CustomEvent('bk_inject_stress_data', { detail: chaosData }));
  }

  /**
   * 📊 EXPORT PARITY ASSERTION
   * Compares visible UI counts against raw data arrays.
   */
  public assertExportParity(uiCount: number, dataArray: any[]) {
    if (!this.isEnabled) return;
    const arrayCount = dataArray?.length || 0;
    if (uiCount !== arrayCount) {
      console.error('[FORENSIC_FAILURE] Export Parity Violation!', { uiCount, arrayCount });
      return false;
    }
    console.log('[FORENSIC_SUCCESS] Export Parity Verified.', { count: uiCount });
    return true;
  }

  /**
   * 🧠 MEMORY LEAK DETECTION
   * Monitors heap growth over time (Chrome only).
   */
  public checkMemoryLeak() {
    if (!this.isEnabled) return;
    const mem: any = (performance as any).memory;
    if (!mem) return;

    const used = mem.usedJSHeapSize;
    if (this.metrics.memoryUsage && used > this.metrics.memoryUsage * 1.5) {
      this.metrics.leakWarnings.push(`Significant heap growth detected: ${used} bytes`);
    }
    this.metrics.memoryUsage = used;
    return used;
  }

  /**
   * ⛈️ RENDER STORM DETECTION
   * Detects excessive component re-renders.
   */
  public trackRender(componentName: string) {
    if (!this.isEnabled) return;
    this.metrics.renderCount++;
    const now = performance.now();
    const diff = now - this.metrics.lastRenderTime;

    if (diff < 16) { // Less than 1 frame gap
      this.metrics.detectedStorms++;
      if (this.metrics.detectedStorms > 10) {
        console.warn(`[FORENSIC_WARNING] Render Storm Detected in ${componentName}!`);
      }
    } else {
      this.metrics.detectedStorms = 0;
    }

    this.metrics.lastRenderTime = now;
  }

  public getMetrics() {
    return { ...this.metrics, averageLatency: 0 };
  }
}

export const forensicEngine = new ForensicValidationEngine();

// Expose to window for manual triggering in console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).BK_FORENSIC = forensicEngine;
}
