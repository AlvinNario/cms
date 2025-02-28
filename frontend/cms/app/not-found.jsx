"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";

export default function UnauthorizedPage() {
    const router = useRouter();
    const auth = useAuth();

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
  
   
    

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white text-center px-4">
        {/* 404 Image */}
        <div className="relative">
            <Image
            src="/404-error.png"
            alt="404 Error"
            width={500}
            height={500}
            className="max-w-full h-auto object-contain grayscale-[20%] opacity-100 animate-float"
            />
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold mt-4 text-red-500">
            404 - Page Not Found
        </h1>
        <p className="text-gray-400 mt-2 max-w-md">
            Oops! The page you're looking for doesn't exist or you don't have
            permission to access it.
        </p>

        {/* Back to Home Button */}
        <button
            onClick={() => {
                if(auth?.isAuthenticated){
                    router.push("/dashboard");
                }else{
                    router.push("/");
                }
            }}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-lg transition duration-300"
        >
            {auth?.isAuthenticated ? "Back to Dashboard" : "Login"}
        </button>
        </div>
    );
}
