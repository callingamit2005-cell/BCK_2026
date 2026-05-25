import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, LifeBuoy, Wallet, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    logger.warn("404 route hit", { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-24 animate-fade-in font-body">
      <div className="max-w-2xl w-full text-center">
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="relative bg-slate-50 border-4 border-slate-100 p-10 rounded-full shadow-2xl transform hover:scale-110 transition-transform duration-500">
            <Wallet className="w-24 h-24 text-primary" strokeWidth={1.5} />
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-sm font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <AlertCircle size={14} /> 404
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Oops! Paisa bachaate bachaate <br className="hidden md:block" />
          <span className="text-primary italic">rasta bhatak gaye?</span>
        </h1>

        <p className="text-slate-800 text-lg md:text-xl font-bold mb-12 max-w-lg mx-auto leading-relaxed">
          {t('404_sub_text', 'Lagta hai ye page hamari "Savings" list mein nahi hai. Par ghabraiye mat, hum aapko wapas sahi raste par le chalenge!')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            to="/"
            className="w-full sm:w-auto px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-primary/30 transform hover:-translate-y-1 active:scale-95"
          >
            <Home size={24} /> {t('btn_back_home', 'Wapas Home Chalein')}
          </Link>

          <Link
            to="/contact"
            className="w-full sm:w-auto px-10 py-5 bg-slate-50 hover:bg-slate-100 text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all"
          >
            <LifeBuoy size={24} /> {t('contact_title', 'Musaibat mein hain?')}
          </Link>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-100">
          <p className="text-base text-slate-900 font-black flex flex-wrap items-center justify-center gap-2">
            Bachat karega India, tabhi toh sapne pure karega India!
          </p>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
            A Trusted Product of ORV Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
