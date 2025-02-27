"use client";

import { signOut } from "@/src/utils/cognitoAuth"; // ✅ Correct import
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-white bg-red-600 rounded"
    >
      Sign Out
    </button>
  );
}
