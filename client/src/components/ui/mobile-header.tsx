import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Sidebar } from "./sidebar";

export function MobileHeader() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <div className="md:hidden bg-white shadow-sm fixed top-0 inset-x-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>
            <div className="ml-3 flex items-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-auto text-primary-600"
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
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600">
            {user?.firstName ? user.firstName[0] : user?.username ? user.username[0] : "U"}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
