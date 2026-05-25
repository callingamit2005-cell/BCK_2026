import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Wallet } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // ✅ Check if there's a saved redirect URL from deep link
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectAfterLogin, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br from-purple-50 via-white to-pink-50">

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/40 p-8 transition-all duration-300">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg ring-4 ring-white/40">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BachatKaro
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm mt-1">
            Simple. Smart. Indian Expense Tracker.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-xl flex mb-6">
              <TabsTrigger
                value="login"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state-���ctive]:text-purple-600 text-gray-500 transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state-active]:text-purple-600 text-gray-500 transition-all duration-200"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-2">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register" className="mt-2">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;