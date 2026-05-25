import { supabase } from "@/integrations/supabase/client";
import { appEnv } from "@/config/env";
import { trackEvent } from "@/lib/analytics";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RazorpayCheckoutSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VipWaitlistOrderResponse {
  amount: number;
  currency: string;
  description: string;
  key_id?: string;
  keyId?: string;
  order_id?: string;
  orderId?: string;
  prefill: {
    email: string;
  };
}

export interface ProcessWaitlistPayload {
  email: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  waitlistCount?: number;
}

export interface ProcessWaitlistResponse {
  success: boolean;
  alreadyJoined?: boolean;
  email?: string;
}

export interface StartVipWaitlistCheckoutArgs {
  email: string;
  onOpenRazorpay?: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  onSuccess: (response: ProcessWaitlistResponse) => void;
  onError?: (error: Error) => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  callback_url?: string;
  prefill: {
    email: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (payload: RazorpayCheckoutSuccessPayload) => void | Promise<void>;
}

interface NormalizedOrder {
  amount: number;
  currency: string;
  description: string;
  key: string;
  orderId: string;
  prefill: {
    email: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = async (): Promise<boolean> => {
  if (window.Razorpay) {
    return true;
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      resolve(Boolean(window.Razorpay));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Razorpay SDK load failed.");
      resolve(false);
    };
    document.head.appendChild(script);
  });

  const loaded = await razorpayScriptPromise;
  if (!loaded) {
    razorpayScriptPromise = null;
  }
  return loaded;
};

const normalizeOrder = (order: VipWaitlistOrderResponse): NormalizedOrder => {
  const keyFromServer = order.key_id || order.keyId || "";
  const keyFromEnv = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
  const orderId = order.order_id || order.orderId || "";
  const amount = Number(order.amount);

  if (!orderId) {
    throw new Error("Missing Razorpay order ID from backend.");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Invalid Razorpay amount returned by backend.");
  }

  if (!keyFromServer && !keyFromEnv) {
    throw new Error("Missing Razorpay public key.");
  }

  if (keyFromServer && keyFromEnv && keyFromServer !== keyFromEnv) {
    throw new Error("Razorpay key mismatch between backend order and frontend environment.");
  }

  return {
    amount,
    currency: order.currency,
    description: order.description || "VIP Waitlist Access",
    key: keyFromServer || keyFromEnv,
    orderId,
    prefill: order.prefill,
  };
};

export const startVipWaitlistCheckout = async ({
  email,
  onOpenRazorpay,
  onProcessingChange,
  onSuccess,
  onError,
}: StartVipWaitlistCheckoutArgs): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const error = new Error("Invalid email format.");
    onError?.(error);
    throw error;
  }

  onProcessingChange?.(true);
  trackEvent("waitlist_checkout_started", { email_domain: normalizedEmail.split("@")[1] });

  try {
    const { data: rawOrder, error: orderError } = await supabase.functions.invoke<VipWaitlistOrderResponse>(
      "create-razorpay-order",
      {
        body: { email: normalizedEmail },
        headers: {
          "x-api-key": import.meta.env.VITE_APP_SECRET_KEY || "",
        },
      },
    );

    if (orderError || !rawOrder) {
      throw new Error(orderError?.message || "Payment engine initialization failed.");
    }

    const order = normalizeOrder(rawOrder);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error("Payment gateway unreachable.");
    }

    const razorpay = new window.Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: "BachatKaro",
      description: order.description,
      order_id: order.orderId,
      callback_url: appEnv.paymentVerifyUrl,
      prefill: order.prefill,
      theme: { color: "#ff0f7b" },
      modal: {
        ondismiss: () => {
          onProcessingChange?.(false);
          trackEvent("payment_failed", { reason: "checkout_dismissed" });
        },
      },
        handler: async (payload: RazorpayCheckoutSuccessPayload) => {
          try {
            if (payload.razorpay_order_id !== order.orderId) {
              throw new Error("Razorpay returned an unexpected order ID.");
            }

            // Increment count in DB and get new value
            const { data: countData, error: incError } = await supabase
              .rpc("increment_waitlist_count");

            if (incError) console.warn("Counter increment failed, but proceeding with verification:", incError);

            const { data: response, error } = await supabase.functions.invoke<ProcessWaitlistResponse>(
              "process-waitlist",
              {
                body: {
                  email: normalizedEmail,
                  razorpay_payment_id: payload.razorpay_payment_id,
                  razorpay_order_id: payload.razorpay_order_id,
                  razorpay_signature: payload.razorpay_signature,
                  waitlistCount: countData || undefined,
                },
                headers: {
                  "x-api-key": import.meta.env.VITE_APP_SECRET_KEY || "",
                },
              },
            );

          if (error || !response?.success) {
            throw new Error(error?.message || "Waitlist verification failed.");
          }

          trackEvent("payment_success", {
            email_domain: normalizedEmail.split("@")[1],
            already_joined: response.alreadyJoined ?? false,
          });
          onSuccess(response);
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error("Payment verification failed.");
          trackEvent("payment_failed", { reason: normalizedError.message });
          onError?.(normalizedError);
          throw normalizedError;
        } finally {
          onProcessingChange?.(false);
        }
      },
    });

    onOpenRazorpay?.();
    razorpay.open();
  } catch (error) {
    onProcessingChange?.(false);
    const normalizedError = error instanceof Error ? error : new Error("Razorpay checkout failed.");
    onError?.(normalizedError);
    throw normalizedError;
  }
};
