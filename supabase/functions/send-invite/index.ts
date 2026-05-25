import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // 1. Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // 2. Parse Body
    const { email, groupId, groupName } = await req.json();
    if (!email || !groupId) throw new Error("Missing email or groupId");

    // 3. Check for existing pending invite
    const { data: existing } = await supabaseClient
      .from("group_invites")
      .select("*")
      .eq("group_id", groupId)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existing) throw new Error("Invite already pending for this user.");

    // 4. Create Invite Record
    const { data: invite, error: insertError } = await supabaseClient
      .from("group_invites")
      .insert({
        group_id: groupId,
        email: email,
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (insertError) throw insertError;

    // 5. Send Email
    const inviteLink = `${req.headers.get("origin")}/join?token=${invite.token}`;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "BachatKaro <help@bachatkaro.co.in>", // Update this with your verified domain
      to: [email],
      subject: `Join ${groupName || "a group"} on BachatKaro`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>Your friend has invited you to join the group <strong>${groupName}</strong> on BachatKaro to track expenses together.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invite</a>
          </p>
          <p style="font-size: 14px; color: #666;">Or copy this link: <br/>${inviteLink}</p>
        </div>
      `,
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
