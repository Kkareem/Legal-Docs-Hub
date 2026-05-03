import { useState } from "react";
import { useLogin, LoginBody } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center opacity-5" />
      <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur z-10">
        <CardHeader className="space-y-3 pb-8 pt-10 px-10">
          <div className="mx-auto bg-sidebar w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg border border-primary/20">
            <span className="text-primary font-bold text-2xl tracking-tighter">LD</span>
          </div>
          <CardTitle className="text-3xl text-center font-serif text-sidebar">LegalDesk</CardTitle>
          <CardDescription className="text-center text-slate-500">
            Secure access to your office command center
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="attorney@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-md mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
