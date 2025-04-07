import { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";

interface PublicWrapperProps {
  children: ReactNode;
}

// This component always wraps with the AuthProvider
// We handle public vs. authenticated routes inside the routing components
export function PublicWrapper({ children }: PublicWrapperProps) {
  // For all routes, wrap with AuthProvider
  // Individual components will decide whether to use the auth context or not
  return <AuthProvider>{children}</AuthProvider>;
}