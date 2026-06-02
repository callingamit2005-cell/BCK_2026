/**
 * BottomNav.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Performance Institutional Mobile Navigation.
 * 🛡️ LOGIC LOCK: Routing, context detection, and voice input integration 100% untouched.
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, Users, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SmartUniversalInput from "../SmartUniversalInput";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchLocalOrCloud } from "@/integrations/sqliteService";
import { Capacitor } from "@capacitor/core";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();
  const { user, isAuthReady } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  const isGroupPage = isActive("/group-expenses");
  const context = isGroupPage ? 'group' : 'personal';

  // State & Data Logic (Locked)
  const activeGroupId = useMemo(() => {
    if (typeof localStorage === 'undefined' || !user?.id) return null;
    const STORAGE_KEY = `bachatkaro_last_group_${user.id}`;
    return localStorage.getItem(STORAGE_KEY);
  }, [user?.id]);

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", activeGroupId],
    enabled: isAuthReady && !!user?.id && !!activeGroupId && context === 'group',
    queryFn: async () => {
      const isAndroid = Capacitor.getPlatform() === 'android';
      return await fetchLocalOrCloud("group_members", activeGroupId!, "", "name ASC", "group_id", true, isAndroid && navigator.onLine);
    },
  });

  const activeMembers = useMemo(() => members.filter((m: any) => !m.is_deleted), [members]);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard', "Home") },
    { path: "#", icon: Plus, label: t('common.add', "Add"), isCenter: true },
    { path: "/group-expenses", icon: Users, label: t('nav.split', "Groups") },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] w-full bg-surface/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-4 pt-2 pb-safe shadow-institutional"
        style={{ minHeight: "calc(84px + env(safe-area-inset-bottom, 0px))" }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <div key="center-fab" className="relative -top-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log(`🧪 [BK_TAP_TRACE] BK Button Tapped at ${new Date().getTime()}`);
                    setIsOpen(prev => !prev);
                  }}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Close terminal" : "Open entry terminal"}
                  className={cn(
                    "relative flex items-center justify-center w-[60px] h-[60px] rounded-full transition-all duration-500 active:scale-90 group overflow-hidden shadow-2xl",
                    isOpen 
                      ? "bg-foreground text-surface rotate-45 scale-110" 
                      : "bg-background"
                  )}
                >
                  {/* Premium Rainbow Animated Ring */}
                  <div className={cn(
                    "absolute inset-0 opacity-100 transition-opacity duration-700",
                    isOpen ? "opacity-0" : "opacity-100"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#2563EB] via-[#9333EA] via-[#DB2777] to-[#F59E0B] animate-spin-slow blur-[2px] opacity-80" />
                    <div className="absolute inset-[2.5px] bg-background rounded-full z-10" />
                  </div>

                  <div className="relative z-20 flex items-center justify-center">
                    {isOpen ? (
                      <Plus className="w-7 h-7" />
                    ) : (
                      <span className="text-lg font-black tracking-tighter bg-gradient-to-tr from-[#2563EB] via-[#9333EA] to-[#DB2777] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                        BK
                      </span>
                    )}
                  </div>
                  
                  {/* Subtle Radar Pulse (Institutional) */}
                  {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-[#2563EB]/15 animate-ping-slow opacity-30 pointer-events-none" />
                  )}
                </button>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                  isOpen ? "opacity-0 translate-y-2" : "opacity-40 translate-y-0"
                )}>
                  {isOpen ? "" : "Tap to BK"}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => { if (active) e.preventDefault(); }}
              className="flex flex-col items-center justify-center min-w-[70px] gap-1.5 transition-all duration-300 active:scale-95"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-500 relative",
                active ? "text-primary bg-primary/5" : "text-muted-foreground"
              )}>
                <item.icon className="h-6 w-6" />
                {active && (
                   <motion.div 
                     layoutId="nav-glow"
                     className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-sm"
                   />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                active ? "text-primary" : "text-muted-foreground opacity-60"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* TERMINAL OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-[40] animate-in fade-in duration-500"
          onClick={() => setIsOpen(false)}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogContent className="mobile-scroll w-[95vw] max-w-lg max-h-[min(88dvh,720px)] overflow-y-auto bg-transparent border-none p-0 shadow-none z-[50]">
          <DialogTitle className="sr-only">Add New Transaction</DialogTitle>
          <DialogDescription className="sr-only">Quickly add an expense or income via voice, text, or manual entry.</DialogDescription>
          <SmartUniversalInput 
            context={context}
            groupId={activeGroupId || undefined}
            activeMembers={activeMembers}
            autoStart={true}
            onSuccess={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BottomNav;
