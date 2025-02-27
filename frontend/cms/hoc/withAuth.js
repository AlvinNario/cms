"use client";

import { isAuthenticated } from "@/src/utils/cognitoAuth"; // ✅ Ensure correct import
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();

    useEffect(() => {
      if (!isAuthenticated()) {
        router.push("/");
      }
    }, [router]);

    return <Component {...props} />;
  };
}
