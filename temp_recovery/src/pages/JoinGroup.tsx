import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Or your toast library

const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying invite...");

  useEffect(() => {
    const handleJoin = async () => {
      if (!token) {
        setStatus("Invalid link");
        return;
      }

      // 1. Check Auth
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login, preserving the invite link as a return URL
        toast.info("Please login to join the group");
        // Store token in local storage as backup
        localStorage.setItem("pendingInviteToken", token);
        navigate(`/auth?returnUrl=/join?token=${token}`);
        return;
      }

      // 2. Call the Database RPC function to accept
      setStatus("Joining group...");
      const { data, error } = await supabase.rpc("accept_invite", {
        invite_token: token,
      } as any);

      if (error) {
        setStatus("Error joining group");
        toast.error(error.message);
      } else if (data) {
        const result = data as any;
        if (!result.success) {
          setStatus(result.message || "Error");
          toast.error(result.message || "Error");
        } else {
          toast.success("Successfully joined the group!");
          navigate(`/groups/${result.group_id}`);
        }
      }
    };

    handleJoin();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2">Group Invitation</h2>
        <p className="text-gray-600 animate-pulse">{status}</p>
      </div>
    </div>
  );
};

export default JoinGroup;
