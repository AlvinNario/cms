"use client";
import { AuthProvider } from "react-oidc-context";
import { oidcConfigSignInConfig } from "@/src/utils/oidcConfigSignInConfig";

export default function AuthWrapper({ children }) {
  return <AuthProvider {...oidcConfigSignInConfig}>{children}</AuthProvider>;
}
