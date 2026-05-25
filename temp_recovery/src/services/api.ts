import { supabase } from "@/integrations/supabase/client"; // Your supabase client path

export const sendGroupInvite = async (email: string, groupId: string, groupName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-invite', {
      body: { email, groupId, groupName },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { success: true };
  } catch (err: any) {
    console.error("Invite Error:", err);
    return { success: false, message: err.message };
  }
};
