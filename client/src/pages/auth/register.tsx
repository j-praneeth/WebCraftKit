import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function Register() {
  const [location, navigate] = useLocation();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await register({
        username: formData.name.toLowerCase().replace(/\s+/g, '_'), // Create username from name
        email: formData.email,
        password: formData.password,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' '),
        role: "user",
        plan: "free"
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
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
          <h2 className="text-3xl font-bold text-white">Create new account<span className="text-[#3B82F6]">.</span></h2>
          <p className="mt-2 text-base text-[#8B8B93]">
            Already a member? <Link href="/auth/login" className="text-[#3B82F6] hover:text-blue-400 transition-colors duration-200 font-medium">Log in</Link>
          </p>
        </div>
        
        <div className="bg-[#23232F]/40 backdrop-blur-xl rounded-2xl border border-white/[0.05] shadow-xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#8B8B93] font-medium text-sm">First Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                  className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#8B8B93] font-medium text-sm">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  required
                  className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#8B8B93] font-medium text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#8B8B93] font-medium text-sm">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                className="bg-[#15151D]/40 border-[#ffffff0a] text-white placeholder:text-[#8B8B93] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#8B8B93] font-medium text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
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
                  Creating account...
                </>
              ) : "Create account"}
            </Button>

            <p className="text-xs text-[#8B8B93] text-center">
              By creating an account, you agree to our{" "}
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
export default Register;

