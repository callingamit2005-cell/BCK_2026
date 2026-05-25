/**
 * DeepLinkRedirect.tsx - BachatKaro Intelligent Router
 * Logic: Detects device and attempts to launch the native app via custom scheme.
 * Fallback: Redirects to App Store / Play Store if app not found or on mobile web.
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Zap } from "lucide-react";

const DeepLinkRedirect = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    // Custom Scheme URL
    const appSchemeUrl = `bachatkaro://join?token=${token}`;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.bachatkaro.app`;
    const appStoreUrl = `https://apps.apple.com/app/bachatkaro`; // Placeholder

    if (isAndroid || isIOS) {
      // 🚀 ATTEMPT 1: Open Native App
      window.location.href = appSchemeUrl;

      // 🕒 FALLBACK: If app doesn't open within 2.5 seconds, redirect to store
      const timer = setTimeout(() => {
        if (isAndroid) {
          window.location.href = playStoreUrl;
        } else {
          window.location.href = appStoreUrl;
        }
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // 💻 Desktop Fallback: Open web join page
      window.location.href = `/join?token=${token}`;
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0a0014] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-purple-600/20 rounded-full animate-pulse" />
        <div className="relative bg-white/5 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <Zap className="h-12 w-12 text-pink-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black text-white mt-4 tracking-tighter uppercase">Opening BachatKaro</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Redirecting Securely</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-white/30 font-medium max-w-[200px]">
        Taking you to the app to securely join the group...
      </p>
    </div>
  );
};

export default DeepLinkRedirect;
