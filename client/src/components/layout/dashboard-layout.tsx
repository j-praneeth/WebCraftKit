import { Sidebar } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/ui/mobile-header";
import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";
import { Redirect } from "wouter";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/auth/login" />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <MobileHeader />
      
      <div className="flex-1 md:ml-64">
        <div className="pt-16 md:pt-0">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-10 pb-24">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-16">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between">
              <div className="flex justify-center space-x-6 md:order-2">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <i className="ri-twitter-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">LinkedIn</span>
                  <i className="ri-linkedin-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">GitHub</span>
                  <i className="ri-github-fill text-xl"></i>
                </a>
              </div>
              <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-base text-gray-400">
                  &copy; {new Date().getFullYear()} ResuNext.ai. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
