// /app/dashboard/page.js
"use client";

import { withAuth } from "@/hoc/withAuth";
import SignOutButton from "@/components/SignOutButton";

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <SignOutButton />
    </div>
  );
}

export default withAuth(Dashboard);