import { useState } from "react";
import { BASE_URL, PAYMENT_VERIFY_URL, paymentApi } from "@/services/paymentApi";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = async (): Promise<boolean> => {
  if (window.Razorpay) {
    return true;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
  if (existingScript) {
    return Boolean(window.Razorpay);
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

const Payment = () => {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    try {
      setIsPaying(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const order = await paymentApi.createPayment({
        amount: 100,
        email: "customer@example.com",
        name: "Demo User",
      });

      const razorpay = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "BachatKaro",
        description: "Founder Member Payment",
        order_id: order.id,
        callback_url: PAYMENT_VERIFY_URL,
        prefill: {
          name: "Demo User",
          email: "customer@example.com",
        },
        notes: {
          frontend_base_url: BASE_URL,
        },
        theme: {
          color: "#ff0f7b",
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <button type="button" onClick={handlePayment} disabled={isPaying}>
      {isPaying ? "Processing..." : "Pay Now"}
    </button>
  );
};

export default Payment;
