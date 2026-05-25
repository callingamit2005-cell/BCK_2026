// src/services/groupInviteService.ts
/**
 * Sends an email invitation to join a group.
 *
 * Validates input using `groupInviteSchema`, then invokes the Supabase Edge Function
 * `send-invite` to deliver the invitation email.
 *
 * @param email - Recipient's email address.
 * @param groupId - UUID of the group.
 * @param groupName - Display name of the group.
 * @returns An object with `success` boolean and optional `message` on failure.
 */

import { supabase } from "@/integrations/supabase/client";
import { groupInviteSchema } from "@/security/guards";

export const sendGroupInvite = async (
  email: string,
  groupId: string,
  groupName: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const validated = groupInviteSchema.safeParse({ email, groupId, groupName });
    if (!validated.success) {
      return { success: false, message: "Invalid invite details" };
    }

    const { data, error } = await supabase.functions.invoke('send-invite', {
      body: validated.data,
      headers: {
        "x-api-key": import.meta.env.VITE_APP_SECRET_KEY || "",
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { success: true };
  } catch (err: any) {
    console.error("Invite Error:", err);
    return { success: false, message: err.message };
  }
};