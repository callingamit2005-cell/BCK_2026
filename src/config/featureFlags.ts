import { appEnv } from "@/config/env";

export const featureFlags = {
  analytics: appEnv.flags.analytics,
  newI18n: appEnv.flags.newI18n,
  voiceV2: appEnv.flags.voiceV2,
  realtimeSync: appEnv.flags.realtimeSync,
  transactionAutoDetect: appEnv.flags.transactionAutoDetect,
  smsRequiresPremium: appEnv.flags.smsRequiresPremium,
  exportRequiresPremium: appEnv.flags.exportRequiresPremium,
  aiTripPlanner: appEnv.tripDataMode === "ai",
  hidePricing: true, // Production-level toggle for pricing visibility
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return featureFlags[flag];
};
