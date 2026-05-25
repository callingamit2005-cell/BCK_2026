import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend"

// --- CONFIGURATION & SECURITY ---
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const APP_SECRET_KEY = Deno.env.get('APP_SECRET_KEY')

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  // 1. Handle CORS Pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Signature verification
  const apiKey = req.headers.get("x-api-key") || req.headers.get("x-webhook-signature");
  if (APP_SECRET_KEY && apiKey !== APP_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid API Key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Client Initialization (Enterprise Admin Mode)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Service role is key for secure DB writes
    );

    const { email, waitlistCount: passedCount } = await req.json();

    // 3. Payload Validation
    if (!email) {
      throw new Error("Missing required credentials: email");
    }

    // 4. DATABASE SYNC: Insert into Waitlist Table
    const { error: dbError } = await supabaseAdmin
      .from("waitlist_users")
      .upsert([
        { 
          email: email.toLowerCase().trim(),
          status: 'verified',
          created_at: new Date().toISOString() 
        }
      ], { onConflict: 'email' });

    if (dbError) {
      console.error("DB Write Error:", dbError);
      throw new Error(`Database record failed: ${dbError.message}`);
    }

    // Fetch real-time count for dynamic display
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from("stats")
      .select("waitlist_count")
      .eq("id", 1)
      .single();

    if (statsError) {
      console.warn("Could not fetch stats for display count:", statsError);
    }

    const waitlistCount = passedCount || statsData?.waitlist_count;
    const displayCount = waitlistCount ? `${waitlistCount.toLocaleString()}+` : null;

    // 5. COMMUNICATIONS: Send The "BachatKaro" VIP Email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'BachatKaro <help@bachatkaro.co.in>',
      to: [email],
      subject: 'Aap BachatKaro Waitlist mein hain! 🚀',
      text: `Welcome to BachatKaro Family ❤️

You’re on the list.

${displayCount 
  ? `You are among our early users — around ${displayCount} members have already joined.`
  : `You are among our early users!`}

Founder access is being released in controlled waves.
You’ll be notified as soon as your access is ready.

Ankit Parasr
Founder, BachatKaro`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; background-color: #0a0014; color: #ffffff; padding: 50px; border-radius: 24px; max-width: 600px; margin: auto; border: 1px solid #ff0f7b20;">
          <h1 style="color: #ff0f7b; font-size: 28px; text-shadow: 0 0 10px #ff0f7b40;">Welcome to BachatKaro Family ❤️</h1>
          <p style="color: #ff0f7b; font-size: 18px; font-weight: bold; margin: 10px 0;">You’re on the list.</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0;">
            ${displayCount 
              ? `You are among our early users — around ${displayCount} members have already joined.`
              : `You are among our early users!`}
          </p>
          
          <div style="color: #b3b3b3; font-size: 14px; line-height: 1.8; margin-bottom: 25px;">
            <p style="margin: 5px 0;">Founder access is being released in controlled waves.</p>
            <p style="margin: 5px 0;">You’ll be notified as soon as your access is ready.</p>
          </div>

          <div style="padding:20px 0; border-top:1px solid rgba(255,255,255,0.1);">
            <p><strong>Follow our journey:</strong></p>

            <p>
            <a href="https://www.facebook.com/profile.php?id=61585495950118" target="_blank">
            Facebook
            </a><br/>

            <a href="https://x.com/bachatkaroapp" target="_blank">
            X (Twitter)
            </a>
            </p>
          </div>
          
          <br/>
          <p style="color: #ffffff; font-weight: bold; margin-bottom: 5px;">Ankit Parasr</p>
          <p style="color: #ff0f7b; font-size: 12px; margin-top: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Founder, BachatKaro</p>
        </div>
      `
    });

    if (emailError) {
      console.warn("Email relay failed, but user was added to DB:", emailError);
    }

    // 6. SUCCESS RESPONSE
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Waitlist access granted and email queued.",
      email_ref: emailData?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("Critical Failure in process-waitlist:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
