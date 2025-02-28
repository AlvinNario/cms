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
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-gray-800 relative">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center absolute top-1/3">Welcome to the Dashboard</h1>
      <button
        onClick={handleSignOut}
        className="absolute top-6 right-6 px-5 py-3 text-white bg-red-600 rounded-lg font-semibold shadow-md hover:bg-red-700 transition-all duration-300 ease-in-out flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h3a2 2 0 002-2v-1m-5-10V5a2 2 0 00-2-2H7a2 2 0 00-2 2v1"
          />
        </svg>
        Sign Out
      </button>
    </div>
  );
}