"use client";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotatingLines } from "react-loader-spinner";

export default function AuthCallback() {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!auth.isLoading) {
        if (auth.isAuthenticated) {
            console.log("✅ Login successful, redirecting to dashboard...");
            console.log({ userProfile: auth.user.profile, userData: auth.user });
            router.push("/dashboard");
        } else if (auth.error) {
            console.error("Authentication error:", auth.error.message);
        }
        }
    }, [auth, router]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#f9f9f9" }}>
        <RotatingLines height="480" width="380" color="#0070f3" radius="6" visible={true} ariaLabel="RotatingLines-loading" />
        <p style={{ marginTop: "20px", fontSize: "18px", color: "#333" }}>Processing login...</p>
        </div>
    );
}
