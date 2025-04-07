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
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    agreeTerms: false
  });
  const [formErrors, setFormErrors] = useState({
    password: "",
    confirmPassword: "",
    agreeTerms: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (name in formErrors) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, agreeTerms: checked }));
    setFormErrors(prev => ({ ...prev, agreeTerms: "" }));
  };

  const validateForm = () => {
    const errors = {
      password: "",
      confirmPassword: "",
      agreeTerms: ""
    };
    
    let isValid = true;
    
    // Password validation
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
      isValid = false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    // Terms agreement validation
    if (!formData.agreeTerms) {
      errors.agreeTerms = "You must agree to the terms and conditions";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: "user",
        plan: "free"
      });
      
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the register function in auth-context
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
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
          <h2 className="mt-2 text-lg font-medium text-gray-900">Create your account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Start building your career with AI-powered tools
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agreeTerms" 
                  checked={formData.agreeTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <a href="#" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {formErrors.agreeTerms && (
                <p className="text-xs text-red-500">{formErrors.agreeTerms}</p>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : "Create Account"}
              </Button>
            </CardContent>
          </form>
          
          <CardFooter className="flex items-center justify-center border-t p-4">
            <div className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Register;
