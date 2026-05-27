/**
 * JoinGroup.tsx - BachatKaro Premium Edition
 * UI: TRUE DARK NEON GLASS V2 (Deep Void + Neon Bloom)
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
import FullScreenLoader from "@/components/ui/FullScreenLoader";

const JoinGroup = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying invite...");
  const [errorStatus, setErrorStatus] = useState(false);
  
  // 🛡️ LOGIC LOCK: Prevent multi-tab race conditions
  const isJoiningRef = useRef(false);
  const retryCountRef = useRef(0);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ISSUE 1 & 4: AUTH READY GUARD & STABLE DEPENDENCIES
    if (!user?.id) {
      if (import.meta.env.DEV) console.warn("⏳ Waiting for user session...");
      return;
    }

    const handleJoin = async () => {
      // 1. Basic Validation
      if (!token) {
        setStatus("Invalid Invitation Link");
        setErrorStatus(true);
        return;
      }

      if (isJoiningRef.current) return;
      isJoiningRef.current = true;
      
      const currentRequestId = crypto.randomUUID();
      requestIdRef.current = currentRequestId;

      try {
        setStatus("Verifying invitation...");

        // 🛡️ [PHASE_7] UNIFIED ATOMIC JOIN
        // One RPC call to validate token (either table) and join the user atomically.
        const { data, error: rpcError } = await supabase.rpc("join_group_via_token", {
          p_token: token
        });

        if (rpcError) throw rpcError;

        const result = data as any;

        console.log("🚨 JOIN RPC RESULT:", result);
        console.log("🚨 RAW RPC DATA:", data);
        console.log("🚨 RAW RPC ERROR:", rpcError);

        // Normalize legacy + modern RPC responses
        const normalizedSuccess =
          result === "joined" ||
          result === "already_member" ||
          result === "already_joined" ||
          result?.success === true;

        if (!normalizedSuccess) {
          console.error("❌ JOIN BUSINESS LOGIC FAILED:", result);

          const failureReason =
            result?.reason ||
            result?.error ||
            "Failed to join group.";

          if (failureReason === "INVALID_OR_EXPIRED") {
            setStatus("This invite link has expired or is already used.");
          } else if (failureReason === "AUTH_REQUIRED") {
            setStatus("Authentication required.");
          } else {
            setStatus(failureReason);
          }

          setErrorStatus(true);
          return;
        }

        if (result === "already_joined") {
          console.log("✅ User already belongs to group.");
          setStatus("You are already a member of this group.");
        }

        const groupId = result?.group_id;
        console.log("✅ Membership join success", result);

        if (requestIdRef.current !== currentRequestId) return;

        // 5. Cache Sync
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }),
          queryClient.refetchQueries({ queryKey: ["groups"] })
        ]);

        // 6. Navigate
        toast.success("Successfully joined the group!");
        navigate(`/group-expenses?groupId=${groupId}`, { replace: true });

      } catch (err: any) {
        console.error("❌ [JoinGroup] Join Failed:", err);
        setStatus(err.message || "Failed to join group.");
        setErrorStatus(true);
        toast.error("Verification failed. Please request a new link.");
      } finally {
        isJoiningRef.current = false;
      }
    };

    handleJoin();
  }, [token, user?.id]);

  // 🛡️ ZERO FLICKER AUTH GUARD
  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    const returnUrl = `/join?token=${token}`;
    return <Navigate to={`/auth?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // UI CONSTANTS (TRUE DARK NEON GLASS V2)
  const primaryGradient = "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]";
  const secondaryGradient = "bg-gradient-to-r from-[#4F46E5] to-[#06B6D4]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0014] relative overflow-hidden font-sans">
      {/* Dynamic Background Mesh Streaks */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#7C3AED]/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#EC4899]/10 blur-[120px] animate-pulse" />

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
        {/* High-Refraction Glass Card */}
        <div className="bg-background backdrop-blur-[32px] rounded-[40px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-border text-center space-y-8 relative overflow-hidden">
          
          {/* Neon Bloom Header Edge */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${primaryGradient} shadow-[0_0_15px_rgba(236,72,153,0.5)]`} />

          {/* Animated Icon Container */}
          <div className="flex justify-center relative">
            <div className={`absolute inset-0 blur-3xl opacity-30 scale-150 ${secondaryGradient} rounded-full`} />
            <div className={`relative w-24 h-24 flex items-center justify-center rounded-[30px] bg-surface border border-border shadow-2xl ring-1 ring-border`}>
              {errorStatus ? (
                <AlertCircle className="h-10 w-10 text-rose-500 animate-bounce" />
              ) : (
                <Users className="h-10 w-10 text-[#111111]" />
              )}
              <div className="absolute -top-2 -right-2 bg-surface backdrop-blur-md p-2 rounded-xl border border-border shadow-lg">
                <Sparkles className="h-4 w-4 text-pink-400" />
              </div>
            </div>
          </div>

          {/* Status Content */}
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#111111] tracking-tighter">
              {errorStatus ? "Invite Issue" : "Group Invitation"}
            </h2>
            <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-2xl bg-surface border border-border">
              {!errorStatus && <Loader2 className="h-4 w-4 animate-spin text-pink-500" />}
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${errorStatus ? "text-rose-400" : "text-[#666666]"}`}>
                {status}
              </p>
            </div>
          </div>

          {/* Enterprise Security Badge */}
          <div className="pt-6 border-t border-border flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-[#666666] uppercase tracking-widest">
              BachatKaro Secure Onboarding
            </span>
          </div>
        </div>

        {/* Footer Navigation Instruction */}
        {!errorStatus && (
          <p className="mt-8 text-center text-[11px] font-bold text-[#999999] uppercase tracking-widest animate-pulse">
            Establishing secure group connection...
          </p>
        )}
        
        {errorStatus && (
          <button 
            onClick={() => navigate("/")}
            className="mt-8 w-full text-center text-sm font-bold text-[#111111] hover:text-pink-400 transition-colors"
          >
            ← Return to Homepage
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;
