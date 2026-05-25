import { appEnv } from "@/config/env";
import { logger } from "@/lib/logger";

type EventPayload = Record<string, any>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    __BK_ANALYTICS__?: AnalyticsClient;
  }
}

type AnalyticsEvent = {
  event: string;
  properties: EventPayload;
  timestamp: string;
};

type AnalyticsClient = {
  track: (eventName: string, properties?: EventPayload) => void;
};

const isBrowser = typeof window !== "undefined";
const isDev = import.meta.env.DEV;

const createAnalyticsClient = (): AnalyticsClient => ({
  track(eventName: string, properties: EventPayload = {}) {
    const event: AnalyticsEvent = {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    if (isDev) {
      console.info("[analytics]", event);
    }

    if (!appEnv.flags.analytics || !isBrowser) {
      return;
    }

    try {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push({
        event: eventName,
        ...properties,
        timestamp: event.timestamp,
      });

      // Provider hook point for GA4/PostHog/etc. without adding duplicate listeners.
      // Example:
      // window.posthog?.capture?.(eventName, properties);
      // window.gtag?.("event", eventName, properties);
    } catch (error) {
      logger.warn("Analytics event dispatch failed", {
        eventName,
        properties,
        error: String(error),
      });
    }
  },
});

const analyticsClient: AnalyticsClient = (() => {
  if (!isBrowser) {
    return createAnalyticsClient();
  }

  window.__BK_ANALYTICS__ = window.__BK_ANALYTICS__ ?? createAnalyticsClient();
  return window.__BK_ANALYTICS__;
})();

export const trackEvent = (eventName: string, properties: EventPayload = {}) => {
  analyticsClient.track(eventName, properties);
};
