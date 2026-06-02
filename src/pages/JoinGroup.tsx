/**
 * JoinGroup.tsx - BachatKaro Premium Fintech Edition
 * UI: High-Security Institutional Handover Terminal.
 * Logic: Triple-Check Invite System (Token, UUID, & Auth State)
 * ✅ Production Ready – Verified for WhatsApp invite links and auth flow
 * 🛡️ FIX: Resolved "Rendered fewer hooks than expected" by moving useEffect above early returns.
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidUuid } from "@/security/guards"; 
import { sanitizeInternalRedirect, setRedirectAfterLogin } from "@/security/redirect";
import { Loader2, Users, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { cn } from "@/lib/utils";

const JoinGroup = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { t } = useLanguage();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(t('join.verifying', "Verifying invite..."));
  const [errorStatus, setErrorStatus] = useState(false);
  
  // 🛡️ LOGIC LOCK: Prevent multi-tab race conditions
  const isJoiningRef = useRef(false);
  const retryCountRef = useRef(0);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ISSUE 1 & 4: AUTH READY GUARD & STABLE DEPENDENCIES
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') console.warn("⏳ Waiting for user session...");
      return;
    }

    const handleJoin = async () => {
      // 1. Basic Validation
      if (!token) {
        setStatus(t('join.invalidLink', "Invalid Invitation Link"));
        setErrorStatus(true);
        return;
      }

      if (isJoiningRef.current) return;
      isJoiningRef.current = true;
      
      const currentRequestId = crypto.randomUUID();
      requestIdRef.current = currentRequestId;

      try {
        setStatus(t('join.verifying', "Verifying invitation..."));

        // 🛡️ [PHASE_7] UNIFIED ATOMIC JOIN
        // One RPC call to validate token (either table) and join the user atomically.
        const { data, error: rpcError } = await supabase.rpc("join_group_via_token", {
          p_token: token
        });

        if (rpcError) throw rpcError;

        const result = data as any;

        if (process.env.NODE_ENV === 'development') {
          console.log("🚨 JOIN RPC RESULT:", result);
          console.log("🚨 RAW RPC DATA:", data);
        }

        // Normalize legacy + modern RPC responses
        const normalizedSuccess =
          result === "joined" ||
          result === "already_member" ||
          result === "already_joined" ||
          result?.success === true;

        if (!normalizedSuccess) {
          if (process.env.NODE_ENV === 'development') console.error("❌ JOIN BUSINESS LOGIC FAILED:", result);

          const failureReason =
            result?.reason ||
            result?.error ||
            t('join.failed', "Failed to join group.");

          if (failureReason === "INVALID_OR_EXPIRED") {
            setStatus(t('join.expired', "This invite link has expired or is already used."));
          } else if (failureReason === "AUTH_REQUIRED") {
            setStatus(t('join.authRequired', "Authentication required."));
          } else {
            setStatus(failureReason);
          }

          setErrorStatus(true);
          return;
        }

        if (result === "already_joined") {
          if (process.env.NODE_ENV === 'development') console.log("✅ User already belongs to group.");
          setStatus(t('join.alreadyMember', "You are already a member of this group."));
        }

        const groupId = result?.group_id;
        if (process.env.NODE_ENV === 'development') console.log("✅ Membership join success", result);

        if (requestIdRef.current !== currentRequestId) return;

        // 5. Cache Sync
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }),
          queryClient.refetchQueries({ queryKey: ["groups"] })
        ]);

        // 6. Navigate
        toast.success(t('join.success', "Successfully joined the group!"), {
          className: "bg-surface border-primary text-foreground shadow-premium"
        });
        navigate(`/group-expenses?groupId=${groupId}`, { replace: true });

      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') console.error("❌ [JoinGroup] Join Failed:", err);
        setStatus(err.message || t('join.failed', "Failed to join group."));
        setErrorStatus(true);
        toast.error(t('join.verificationFailed', "Verification failed. Please request a new link."));
      } finally {
        isJoiningRef.current = false;
      }
    };

    handleJoin();
  }, [token, user?.id, t]);

  // 🛡️ ZERO FLICKER AUTH GUARD
  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    const returnUrl = `/join?token=${token}`;
    return <Navigate to={`/auth?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden font-sans">
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-surface rounded-modal shadow-institutional border border-border/40 text-center space-y-8 relative overflow-hidden p-8 sm:p-10">
          
          {/* Header Edge */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1.5 shadow-[0_0_15px_rgba(0,0,0,0.1)]",
            errorStatus ? "bg-destructive" : "bg-primary"
          )} />

          {/* Animated Icon Container */}
          <div className="flex justify-center relative">
            <div className={cn(
              "relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-2xl bg-muted/20 border shadow-inner",
              errorStatus ? "border-destructive/20" : "border-primary/20"
            )}>
              {errorStatus ? (
                <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
              ) : (
                <Users className="h-10 w-10 text-primary" />
              )}
              {!errorStatus && (
                <div className="absolute -top-2 -right-2 bg-primary p-1.5 rounded-xl shadow-sm border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Status Content */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {errorStatus ? t('join.issue', "Invite Issue") : t('join.invitation', "Processing Invite")}
            </h2>
            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-5 rounded-2xl border shadow-sm mx-auto max-w-[90%]",
              errorStatus ? "bg-destructive/5 border-destructive/20" : "bg-muted/20 border-border/50"
            )}>
              {!errorStatus && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest text-center",
                errorStatus ? "text-destructive" : "text-foreground"
              )}>
                {status}
              </p>
            </div>
          </div>

          {/* Enterprise Security Badge */}
          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-2 opacity-80">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">
              {t('join.secureOnboarding', 'BachatKaro Secure Handover')}
            </span>
          </div>
        </div>

        {/* Footer Navigation Instruction */}
        {!errorStatus && (
          <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
            {t('join.establishing', 'Establishing secure connection...')}
          </p>
        )}
        
        {errorStatus && (
          <button 
            onClick={() => navigate("/")}
            className="mt-8 w-full text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 p-3 rounded-xl transition-all"
          >
            ← {t('join.returnHome', 'Return to Homepage')}
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;
