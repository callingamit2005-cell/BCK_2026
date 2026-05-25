/**
 * 🛡️ FORENSIC DIAGNOSTIC DASHBOARD
 * MODE: DEV-ONLY | ISOLATED
 * UI: High-Contrast Diagnostic Grid
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { forensicEngine, ForensicMetrics } from './validationSuite';
import { Activity, ShieldAlert, Cpu, Database, CloudOff, RefreshCw } from 'lucide-react';

const ForensicDashboard = () => {
  const [metrics, setMetrics] = useState<ForensicMetrics>(forensicEngine.getMetrics());
  const [isVisible, setIsVisible] = useState(false);

  const simulateUIPressure = () => {
    console.log('[FORENSIC] Simulating UI Pressure (Rapid Tab Switching)...');
    const tabs = ['daily', 'planning', 'future', 'dreams'];
    let count = 0;
    const interval = setInterval(() => {
      const tab = tabs[count % tabs.length];
      window.dispatchEvent(new CustomEvent('bk_force_tab', { detail: tab }));
      count++;
      if (count > 20) clearInterval(interval);
    }, 100);
  };

  const simulateAndroidLifecycle = () => {
    console.log('[FORENSIC] Simulating Android Pause/Resume...');
    window.dispatchEvent(new CustomEvent('appPause'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('appResume'));
    }, 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(forensicEngine.getMetrics());
      forensicEngine.checkMemoryLeak();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {/* Hidden Trigger (Alt + F) */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-[9999] p-2 bg-slate-900/50 text-white/20 rounded-full hover:text-white transition-all"
        title="Toggle Forensic Dashboard (Alt + F)"
      >
        <Activity className="h-4 w-4" />
      </button>

      {isVisible && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Forensic Reliability Lab
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white">Close</Button>
            </CardHeader>
            
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[80vh]">
              
              {/* SECTION 1: STRESS TOOLS */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pressure Testing</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => forensicEngine.generateStressData(500)} className="bg-slate-800 border-slate-700">Stress 500</Button>
                  <Button variant="outline" size="sm" onClick={() => forensicEngine.generateStressData(1000)} className="bg-slate-800 border-slate-700">Stress 1000</Button>
                  <Button variant="outline" size="sm" onClick={() => forensicEngine.generateStressData(5000)} className="bg-slate-800 border-slate-700 col-span-2">Stress 5000 (OOM Risk)</Button>
                  <Button variant="destructive" size="sm" onClick={() => forensicEngine.startDateChaosTest()} className="col-span-2">Inject Date Chaos</Button>
                </div>
              </div>

              {/* SECTION 2: UI PRESSURE */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UI Pressure</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => simulateUIPressure()} className="bg-slate-800 border-slate-700">UI Stress Test</Button>
                  <Button variant="outline" size="sm" onClick={() => simulateAndroidLifecycle()} className="bg-slate-800 border-slate-700">Simulate Pause</Button>
                </div>
              </div>

              {/* SECTION 3: RESILIENCE SIMULATION */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resilience Simulation</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => forensicEngine.startSoakTest()} className="bg-indigo-900/30 border-indigo-500/30">Start Soak Test</Button>
                  <Button variant="outline" size="sm" onClick={() => forensicEngine.stopSoakTest()} className="bg-slate-800 border-slate-700">Stop Soak Test</Button>
                  <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new Event('offline'))} className="bg-slate-800 border-slate-700 flex gap-2"><CloudOff className="h-3 w-3" /> Force Offline</Button>
                  <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new Event('online'))} className="bg-slate-800 border-slate-700 flex gap-2"><RefreshCw className="h-3 w-3" /> Force Online</Button>
                </div>
              </div>

              {/* SECTION 3: RUNTIME METRICS */}
              <div className="space-y-4 md:col-span-2 bg-black/40 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Runtime Health</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricItem icon={<Cpu className="h-3 w-3 text-cyan-400" />} label="Renders" value={metrics.renderCount} />
                  <MetricItem icon={<Activity className="h-3 w-3 text-emerald-400" />} label="Storms" value={metrics.detectedStorms} color={metrics.detectedStorms > 0 ? "text-amber-500" : ""} />
                  <MetricItem icon={<Database className="h-3 w-3 text-purple-400" />} label="Heap (MB)" value={(metrics.memoryUsage || 0) / 1024 / 1024} format="fixed" />
                  <MetricItem icon={<ShieldAlert className="h-3 w-3 text-rose-400" />} label="Leaks" value={metrics.leakWarnings.length} color={metrics.leakWarnings.length > 0 ? "text-rose-500" : ""} />
                </div>
                
                {metrics.leakWarnings.length > 0 && (
                  <div className="mt-4 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 font-mono">
                    {metrics.leakWarnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

const MetricItem = ({ icon, label, value, color = "", format = "raw" }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
      {icon} {label}
    </div>
    <div className={cn("text-xl font-black font-mono tracking-tighter", color)}>
      {format === "fixed" ? (Number(value)).toFixed(2) : value}
    </div>
  </div>
);

const cn = (...args: any[]) => args.filter(Boolean).join(' ');

export default ForensicDashboard;
