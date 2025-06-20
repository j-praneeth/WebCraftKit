import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Login() {
  const [location, navigate] = useLocation();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the login function in auth-context
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C1C25] bg-opacity-98 px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(138,173,255,0.04),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(138,173,255,0.04),transparent_70%)]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Welcome back<span className="text-[#3B82F6]">.</span></h2>
          <p className="mt-2 text-base text-[#8B8B93]">
            New to ResuNext? <Link href="/auth/register" className="text-[#3B82F6] hover:text-blue-400 transition-colors duration-200 font-medium">Create an account</Link>
          </p>
        </div>
        
        <div className="bg-[#23232F]/40 backdrop-blur-xl rounded-2xl border border-white/[0.05] shadow-xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#8B8B93] font-medium text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#8B8B93] font-medium text-sm">Password</Label>
                <a href="#" className="text-sm text-[#3B82F6] hover:text-blue-400 transition-colors duration-200">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-medium h-12 rounded-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                  Signing in...
                </>
              ) : "Sign in"}
            </Button>

            <p className="text-xs text-[#8B8B93] text-center">
              By signing in, you agree to our{" "}
              <a href="#" className="text-[#3B82F6] hover:text-blue-400 transition-colors duration-200">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-[#3B82F6] hover:text-blue-400 transition-colors duration-200">Privacy Policy</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

