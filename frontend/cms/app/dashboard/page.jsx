"use client";
import { withAuth } from "@/hoc/withAuth";
import EnhancedDashboard from "@/components/EnhancedDashboard";

const ProtectedEnhancedDashboard = withAuth(EnhancedDashboard);

function Dashboard() {
  return (
    <main>
      <ProtectedEnhancedDashboard />
    </main>
  );
}

export default Dashboard;