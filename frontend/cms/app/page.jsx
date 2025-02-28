"use client";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useState } from "react";


export default function LoginPage() {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = () => {
    auth.signinRedirect();
    setIsLoading(true);
    
    // Simulate authentication process
    // In a real app, this would be replaced with actual auth logic
    setTimeout(() => {
      // After "authentication" completes, you might redirect or show success
      setIsLoading(false);
      console.log('Login completed');
    }, 3000); // 3 second simulated loading time
  }

  // useEffect(() => {
  //   if (!auth.isAuthenticated && !auth.isLoading) {
  //     console.log("🔄 Redirecting to Cognito login...");
  //     auth.signinRedirect();
  //   }
  // }, [auth.isAuthenticated, auth.isLoading]);

  // if (auth.isLoading) return <p>Loading...</p>;

  return (
    // <p>Redirecting to sign in...</p>
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 relative">

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 overflow-hidden">
          <div className="h-full bg-blue-500 animate-linearProgress"></div>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Cognito Self Sign-in</h1>
        <p className="text-gray-400 mt-2">Secure authentication for your application</p>
      </header>

      {/* Sign-in Card */}
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
        </div>

        {/* Card Body - Just Login Button */}
        <div className="px-6 py-8">
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 transform focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}