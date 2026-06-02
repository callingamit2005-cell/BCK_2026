/**
 * LogoutButton.tsx - BachatKaro Premium UI
 * Logic: Supabase SignOut + Navigation
 */

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const LogoutButton = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
      className="w-full justify-start gap-3 px-4 py-6 text-muted-foreground hover:text-foreground hover:bg-background rounded-2xl transition-all duration-200 group"
      aria-label={isLoggingOut ? t('auth_logging_out', 'Logging out…') : t('auth_logout', 'Log out')}
    >
      {isLoggingOut ? (
        <Loader2 className="h-5 w-5 animate-spin shrink-0" />
      ) : (
        /* Icon slides left on hover — correct direction for "exit" */
        <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200" />
      )}
      <span className="font-semibold text-sm">
        {isLoggingOut
          ? t('auth_logging_out', 'Logging out…')
          : t('auth_logout', 'Log out')}
      </span>
    </Button>
  );
};

export default LogoutButton;
