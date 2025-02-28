"use client";

import { useAuth } from "react-oidc-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withAuth(WrappedComponent) {
  return function AuthWrapper(props) {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
      if(!auth?.isAuthenticated && !auth?.isLoading){
        console.log("🔒 Unauthorized access. Redirecting to login...");
        router.push("/"); 
      }
    }, [auth?.isAuthenticated, auth?.isLoading])

    if (auth?.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
          <p>🔄 Checking authentication...</p>
        </div>
      );
    }

    if (!auth?.isAuthenticated) {
      return null; // Prevents flashing of protected content before redirect
    }
  
    return <WrappedComponent {...props} />;
  };
}