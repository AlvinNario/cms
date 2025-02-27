"use client";

import dynamic from "next/dynamic";

const SignInForm = dynamic(() => import("@/components/SignInForm"), { ssr: false });

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Login with Cognito</h1>
        <SignInForm />
      </div>
    </main>
  );
}