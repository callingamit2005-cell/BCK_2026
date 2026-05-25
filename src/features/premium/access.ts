import type { User } from "@supabase/supabase-js";
import { appEnv } from "@/config/env";

export type PremiumFeature = "sms" | "export";

const getSubscriptionStatus = (user?: User | null) => {
  const appStatus = user?.app_metadata?.subscription_status;
  const userStatus = user?.user_metadata?.subscription_status;
  const appPlan = user?.app_metadata?.plan;
  const userPlan = user?.user_metadata?.plan;

  return String(appStatus || userStatus || appPlan || userPlan || "").toLowerCase();
};

export const premiumFeatureFlags = {
  smsRequiresPremium: appEnv.flags.smsRequiresPremium,
  exportRequiresPremium: appEnv.flags.exportRequiresPremium,
} as const;

export const hasPremiumAccess = (
  user: User | null | undefined,
  feature: PremiumFeature,
) => {
  const flagEnabled =
    feature === "sms"
      ? premiumFeatureFlags.smsRequiresPremium
      : premiumFeatureFlags.exportRequiresPremium;

  if (!flagEnabled) {
    return true;
  }

  if (!user) {
    return false;
  }

  const status = getSubscriptionStatus(user);
  return (
    user.user_metadata?.is_premium === true ||
    user.app_metadata?.is_premium === true ||
    status === "premium" ||
    status === "pro" ||
    status === "active" ||
    status === "paid"
  );
};
