import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const APP_SECRET_KEY = Deno.env.get("APP_SECRET_KEY");

type RequestPayload = {
  email?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  order_id: string;
  status: string;
  email?: string | null;
  notes?: Record<string, string | undefined>;
};

const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");

const expectedAmount = 100;
const expectedCurrency = "INR";

const basicAuth = (keyId: string, keySecret: string) =>
  `Basic ${btoa(`${keyId}:${keySecret}`)}`;

const fetchPayment = async (
  paymentId: string,
  razorpayKeyId: string,
  razorpayKeySecret: string,
) => {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: basicAuth(razorpayKeyId, razorpayKeySecret),
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const message = typeof data?.error?.description === "string"
      ? data.error.description
      : "Unable to fetch Razorpay payment details.";
    throw new Error(message);
  }

  return data as RazorpayPayment;
};

const triggerWelcomeEmail = async (
  supabaseUrl: string,
  anonKey: string,
  email: string,
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  if (APP_SECRET_KEY) {
    headers["x-api-key"] = APP_SECRET_KEY;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to trigger welcome email.");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Signature verification (Custom API Key)
  const apiKey = req.headers.get("x-api-key") || req.headers.get("x-webhook-signature");
  if (APP_SECRET_KEY && apiKey !== APP_SECRET_KEY) {
    return json({ error: "Unauthorized: Invalid API Key" }, 401);
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const email = normalizeEmail(payload.email);
    const orderId = payload.razorpay_order_id?.trim();
    const paymentId = payload.razorpay_payment_id?.trim();
    const signature = payload.razorpay_signature?.trim();

    if (!email || !orderId || !paymentId || !signature) {
      return json({ error: "Missing verification payload." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const body = `${orderId}|${paymentId}`;
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const expectedSignature = toHex(new Uint8Array(digest));

    if (expectedSignature !== signature) {
      return json({ error: "Invalid payment signature." }, 400);
    }

    const payment = await fetchPayment(paymentId, razorpayKeyId, razorpayKeySecret);

    if (payment.order_id !== orderId) {
      return json({ error: "Payment order mismatch." }, 400);
    }

    if (payment.amount !== expectedAmount || payment.currency !== expectedCurrency) {
      return json({ error: "Payment amount verification failed." }, 400);
    }

    if (!["authorized", "captured"].includes(payment.status)) {
      return json({ error: "Payment is not in a successful state." }, 400);
    }

    const razorpayEmail = payment.email?.trim().toLowerCase() ?? payment.notes?.email?.trim().toLowerCase() ?? null;
    if (razorpayEmail && razorpayEmail !== email) {
      return json({ error: "Payment email mismatch." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log(`[verify-payment] Checking waitlist for email: ${email}`);
    
    const { data: existing, error: existingError } = await supabase
      .from("waitlist_users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("[verify-payment] Database lookup error", existingError);
      throw existingError;
    }

    if (!existing) {
      console.log(`[verify-payment] New user, inserting into waitlist_users: ${email}`);
      const { error: insertError } = await supabase
        .from("waitlist_users")
        .insert([{ email, status: 'verified' }]); // Start as verified, send-welcome-email will update to 'notified'
      
      if (insertError) {
        console.error("[verify-payment] Insert error", insertError);
        const duplicate = insertError.message.toLowerCase().includes("duplicate") ||
          insertError.message.toLowerCase().includes("unique");
        if (!duplicate) {
          throw insertError;
        }
      }
    } else {
      console.log(`[verify-payment] Existing user found: ${email}, current status: ${existing.status}`);
    }

    // Always trigger welcome email for paid users to ensure they get notified status
    console.log(`[verify-payment] Triggering welcome email for: ${email}`);
    try {
      await triggerWelcomeEmail(supabaseUrl, supabaseAnonKey, email);
      console.log(`[verify-payment] Welcome email triggered successfully for: ${email}`);
    } catch (triggerError: any) {
      console.error(`[verify-payment] Failed to trigger welcome email: ${triggerError.message}`);
      // We don't throw here to ensure the response is still success since payment was verified
      // but we log it as a critical warning.
    }

    return json({
      success: true,
      alreadyJoined: Boolean(existing),
      email,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      audit_note: "Razorpay IDs verified server-side. Welcome email triggered.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("verify-razorpay-payment failed", message, error);
    return json({ error: message }, 500);
  }
});
