"use client";

import dynamic from "next/dynamic";

const SignInForm = dynamic(() => import("@/components/SignInForm"), { ssr: false });

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen w-screen" >
      <div className="text-center">
        <SignInForm />
      </div>
    </main>
  );
}