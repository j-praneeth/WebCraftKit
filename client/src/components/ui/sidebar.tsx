import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: "ri-dashboard-line" },
  { name: "Resume Builder", path: "/resume-builder", icon: "ri-file-list-line" },
  { name: "Cover Letter", path: "/cover-letter", icon: "ri-mail-open-line" },
  { name: "Interview Prep", path: "/interview-prep", icon: "ri-questionnaire-line" },
  { name: "Mock Interviews", path: "/mock-interviews", icon: "ri-vidicon-line" },
  { name: "Job Matching", path: "/job-matching", icon: "ri-user-search-line" },
];

const bottomNavItems = [
  { name: "Settings", path: "/settings", icon: "ri-settings-line" },
  { name: "Help & Support", path: "/help", icon: "ri-question-line" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
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
          <span className="ml-2 text-xl font-bold text-gray-900">ResuNext.ai</span>
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.path
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <i
                  className={cn(
                    item.icon,
                    "mr-3 text-lg",
                    location === item.path
                      ? "text-primary-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                ></i>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-2 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                location === item.path
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <i
                className={cn(
                  item.icon,
                  "mr-3 text-lg",
                  location === item.path
                    ? "text-primary-500"
                    : "text-gray-400 group-hover:text-gray-500"
                )}
              ></i>
              {item.name}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600">
              {user?.firstName ? user.firstName[0] : user?.username ? user.username[0] : "U"}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "User"}
              </p>
              <p className="text-xs font-medium text-gray-500 capitalize">{user?.plan || "Free"} Plan</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Logout"
              title="Logout"
            >
              <i className="ri-logout-box-line text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
