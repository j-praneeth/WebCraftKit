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
    username: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.username, formData.password);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the login function in auth-context
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-10 w-10 text-primary-600"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6H4V18H20V6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 9H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 9V18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="ml-2 text-2xl font-bold text-gray-900">ResuNext.ai</h1>
          </div>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Sign in to your account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Elevate your career with AI-powered job tools
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary-600 hover:text-primary-500">
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
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : "Sign in"}
              </Button>
            </CardContent>
          </form>
          
          <CardFooter className="flex items-center justify-center border-t p-4">
            <div className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
