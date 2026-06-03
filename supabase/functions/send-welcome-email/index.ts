import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.1.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

/**
 * 🔐 ENV CONFIG
 */
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_SECRET_KEY = Deno.env.get("APP_SECRET_KEY");
const RESEND_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") ||
  "BachatKaro <help@bachatkaro.co.in>";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Branding
const FOUNDER_NAME = "Ankit Praser";
const X_URL = "https://x.com/bachatkaroapp";
const FB_URL =
  "https://www.facebook.com/profile.php?id=61585495950118";

/**
 * 🌐 CORS
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * 🧠 LOGGER
 */
const log = (msg: string, meta?: any) =>
  console.log(`[WELCOME] ${msg}`, meta ? JSON.stringify(meta) : "");

const errorLog = (msg: string, err?: any) =>
  console.error(`[WELCOME ERROR] ${msg}`, err?.message || err);

/**
 * 🚀 SERVER
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Signature verification
  const apiKey = req.headers.get("x-api-key") || req.headers.get("x-webhook-signature");
  if (APP_SECRET_KEY && apiKey !== APP_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid API Key" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Server configuration missing" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const resend = new Resend(RESEND_API_KEY);
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const payload = await req.json();

    const email =
      payload?.email?.toLowerCase()?.trim() ||
      payload?.record?.email?.toLowerCase()?.trim();

    if (!email) throw new Error("Valid email required");

    log("Processing", { email });

    /**
     * ✅ FETCH USER + STATS
     */
    const [userRes, statsRes] = await Promise.all([
      supabase
        .from("waitlist_users")
        .select("id, status")
        .eq("email", email)
        .maybeSingle(),

      supabase
        .from("stats")
        .select("waitlist_count")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (userRes.error) throw userRes.error;

    /**
     * ✅ UPSERT (RACE SAFE)
     */
    let user = userRes.data;

    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("waitlist_users")
        .upsert([{ email, status: "pending" }], {
          onConflict: "email",
        })
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      user = newUser;
    }

    /**
     * 🔁 SKIP IF ALREADY NOTIFIED
     */
    if (user?.status === "notified") {
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /**
     * ✅ SAFE COUNT
     */
    const count = statsRes?.data?.waitlist_count ?? 1000;
    const displayCount = `${count.toLocaleString()}+`;

    /**
     * 📧 SEND PREMIUM EMAIL
     */
    let emailSuccess = false;

    try {
      const { error: sendError } = await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject:
          "Paisa bachao, Sapne sajao! Swagat hai BachatKaro mein 🚀",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono&display=swap');
          </style>
        </head>
        <body style="background-color: #0a0014; margin: 0; padding: 40px 20px; font-family: 'Inter', sans-serif; color: #b3b3b3;">
          <div style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 15, 123, 0.35); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            
            <!-- Header -->
            <div style="text-align: left; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; text-shadow: 0 0 10px #ff0f7b;">
                Bachat<span style="color: #ff0f7b;">Karo</span>
              </h1>
              <p style="margin: 5px 0 0; font-size: 14px; color: #b3b3b3; letter-spacing: 1px;">Stop overspending. Start growing.</p>
            </div>

            <!-- Salutation -->
            <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 20px; line-height: 1.4;">
              Namaste! Aap officially list mein shamil ho chuke hain, aur humein is baat ki dil se khushi hai!
            </h2>

            <!-- Pain Point & Vision -->
            <div style="line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
              <p>
                Hum jante hain ki mehnat ki kamayi ko manage karna kisi mushkil kaam se kam nahi lagta. 
                Wo hidden expenses ki tension, bikhre huye spreadsheets, aur mahine ke end wali wo feeling—<strong style="color: #ffffff;">"Aakhir mera paisa gaya kahan?"</strong>—humne ye sab mehsoos kiya hai.
              </p>
              <p>
                Isliye hum bana rahe hain <span style="color: #ff0f7b; font-weight: bold;">BachatKaro</span>, taaki aapko mile ek <span style="background: linear-gradient(90deg, #ff0f7b 0%, #5f0a87 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">'Butter-Soft'</span> experience jo aapko apne paison ka asli maalik banayega.
              </p>
            </div>

            <!-- Quote -->
            <div style="border-left: 3px solid #ff0f7b; padding-left: 20px; margin: 30px 0; font-style: italic; color: #ffffff;">
              <p style="font-size: 18px; margin-bottom: 5px;">"आदतें बदलनी होंगी, कोई और नहीं बदल सकता।"</p>
              <p style="font-size: 14px; color: #b3b3b3; margin: 0;">(Kyunki aapki financial freedom ki shuruat aapki apni ek chhoti si koshish se hoti hai.)</p>
            </div>

            <!-- Features -->
            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h3 style="color: #ff0f7b; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Upcoming Features:</h3>
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                <li style="color: #ffffff;">🚀 <strong style="font-family: 'JetBrains Mono', monospace;">AI Expense Insights</strong> <span style="color: #b3b3b3; font-size: 14px;">(Real-time clarity)</span></li>
                <li style="color: #ffffff;">🚀 <strong style="font-family: 'JetBrains Mono', monospace;">One-Tap Budgeting</strong> <span style="color: #b3b3b3; font-size: 14px;">(Intuitive controls)</span></li>
                <li style="color: #ffffff;">🚀 <strong style="font-family: 'JetBrains Mono', monospace;">Smart Savings Goals</strong> <span style="color: #b3b3b3; font-size: 14px;">(Automated tracking)</span></li>
              </ul>
            </div>

            <!-- Perks -->
            <div style="text-align: center; margin-bottom: 40px;">
              <p style="color: #ffffff; font-weight: bold; margin-bottom: 15px;">Exclusive Early Access Perks:</p>
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(90deg, #ff0f7b 0%, #5f0a87 100%); color: #ffffff; border-radius: 12px; font-weight: bold; text-decoration: none;">
                50% OFF Android App (Lifetime) & 100% FREE Web Access
              </div>
            </div>

            <!-- Social Proof -->
            <p style="text-align: center; font-size: 14px; color: #b3b3b3;">
              Join <span style="color: #ffffff; font-family: 'JetBrains Mono', monospace; font-weight: bold;">${displayCount}</span> others choosing financial freedom.
            </p>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
              <p style="font-size: 12px; color: #ff0f7b; font-weight: bold; letter-spacing: 1px; margin-bottom: 15px;">SHARE TO FRIEND FOR YOUR FUTURE BENEFITS...</p>
              <p style="font-size: 13px; margin-bottom: 20px;">
                Agar hamari koshish achhi ho toh dusron ko batayein, nahi toh humein, taaki hum bhavishya mein sudhaar ke liye kaam kar sakein.
              </p>
              
              <div style="margin-bottom: 25px;">
                <a href="${X_URL}" style="color: #ffffff; text-decoration: none; margin: 0 10px; font-size: 14px;">X / Twitter</a>
                <span style="color: rgba(255,255,255,0.2);">|</span>
                <a href="${FB_URL}" style="color: #ffffff; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a>
              </div>

              <p style="margin: 0; color: #ffffff; font-weight: bold;">${FOUNDER_NAME}</p>
              <p style="margin: 5px 0 0; font-size: 12px; color: #ff0f7b;">Founder, BachatKaro</p>
            </div>

          </div>
        </body>
        </html>
        `,
      });

      if (sendError) throw sendError;

      emailSuccess = true;
      log("Email sent", { email });
    } catch (err) {
      errorLog("Email failed", err);
    }

    /**
     * ✅ UPDATE STATUS + COUNT
     */
    if (emailSuccess) {
      const { error: updateError } = await supabase
        .from("waitlist_users")
        .update({ status: "notified" })
        .eq("email", email);

      if (updateError) throw updateError;

      await supabase.rpc("increment_waitlist_count");

      log("Status + count updated", { email });
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: emailSuccess,
        waitlistCount: displayCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    errorLog("Execution failed", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});