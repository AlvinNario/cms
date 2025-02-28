"use client";

import React from "react";
import { useAuth } from "react-oidc-context";
import oidcConfigSignOutConfig from "@/src/utils/oidcConfigSignOutConfig";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

export default function EnhancedDashboard() {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    setIsLoading(true);
    oidcConfigSignOutConfig();
    setTimeout(() => {
      // After "authentication" completes, you might redirect or show success
      setIsLoading(false);
      console.log('Login completed');
    }, 3000); // 3 second simulated loading time

  }


  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">

      {/* linear progress */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 overflow-hidden z-50">
          <div className="h-full bg-blue-500 animate-linearProgress"></div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-[#1E293B] shadow-lg p-4 flex justify-between items-center fixed top-0 left-0 w-full z-30">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-6">
          {/* User Info */}
          {auth?.user && (
            <div className="flex items-center space-x-2 text-white font-medium">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">
                Welcome, {auth.user?.profile?.email.split("@")[0] || "User"}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center mt-16">
        <h1 className="text-3xl font-bold text-white">
          Welcome to Your Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Manage your account and settings here.
        </p>
      </main>
    </div>
  );
}
