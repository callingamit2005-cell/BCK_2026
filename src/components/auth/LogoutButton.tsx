/**
 * LogoutButton.tsx - BachatKaro Premium UI
 * Logic: Supabase SignOut + Navigation
 */

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext"; // Aapka translation engine
import { toast } from "sonner"; // Notification ke liye

const LogoutButton = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // 🚀 Step 1: Supabase ko bolna "Bye Bye"
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 🚀 Step 2: User ko Auth page par wapas bhejna
      toast.success(t('auth_logout_success', 'Successfully logged out!'));
      navigate("/auth", { replace: true });
      
    } catch (error: any) {
      toast.error(error.message || "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full justify-start gap-3 px-4 py-6 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 group"
    >
      {isLoggingOut ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      )}
      <span className="font-bold text-base">
        {isLoggingOut ? t('auth_logging_out', 'Processing...') : t('auth_logout', 'Logout')}
      </span>
    </Button>
  );
};

export default LogoutButton;