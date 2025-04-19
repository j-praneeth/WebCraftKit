import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  plan: string;
  profilePicture?: string;
  mockInterviewsCount?: number;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/user", { credentials: "include" });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      // const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.firstName || userData.email}!`,
        });
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/register", userData);
      
      if (response.ok) {
        const newUser = await response.json();
        // Login automatically after successful registration
        await login(userData.email, userData.password);
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
