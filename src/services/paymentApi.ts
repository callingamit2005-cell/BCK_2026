import { appEnv, buildApiUrl } from "@/config/env";

export const BASE_URL = appEnv.baseUrl || "http://localhost:8081";

export const PAYMENT_API_URL = buildApiUrl("/api/payment");
export const PAYMENT_VERIFY_URL = buildApiUrl("/api/payment/verify");

export const paymentApi = {
  createPayment: async (payload: { amount: number; email: string; name?: string }) => {
    const response = await fetch(PAYMENT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment order.");
    }

    return response.json();
  },
};
