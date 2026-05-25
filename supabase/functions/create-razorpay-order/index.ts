import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const APP_SECRET_KEY = Deno.env.get("APP_SECRET_KEY");

const amount = 100;
const currency = "INR";

type RequestPayload = {
  email?: string;
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

const basicAuth = (keyId: string, keySecret: string) =>
  `Basic ${btoa(`${keyId}:${keySecret}`)}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Signature verification
  const apiKey = req.headers.get("x-api-key") || req.headers.get("x-webhook-signature");
  if (APP_SECRET_KEY && apiKey !== APP_SECRET_KEY) {
    return json({ error: "Unauthorized: Invalid API Key" }, 401);
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const email = normalizeEmail(payload.email);

    if (!email) {
      return json({ error: "Valid email is required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: existing, error: existingError } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return json({ error: "You are already part of our family." }, 409);
    }

    const authHeader = basicAuth(razorpayKeyId, razorpayKeySecret);
    const receipt = `bk_${Date.now()}`;

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: {
          email,
          campaign: "bachatkaro-alpha-launch-v2-1",
        },
      }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      const message = typeof orderData?.error?.description === "string"
        ? orderData.error.description
        : "Razorpay order creation failed.";
      return json({ error: message }, 502);
    }

    return json({
      key_id: razorpayKeyId,
      keyId: razorpayKeyId,
      order_id: orderData.id,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      description: "BachatKaro Alpha Founder Access",
      prefill: {
        email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("create-razorpay-order failed", message, error);
    return json({ error: message }, 500);
  }
});
