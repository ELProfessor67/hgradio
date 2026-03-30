import React from "react";
import DashboardStats from "@/components/admin/DashboardStats";

const page = () => {
  return (
    <div className="text-white p-4">
      <div className="mb-8">
        <h3 className="text-3xl font-bold">Admin Dashboard</h3>
        <p className="text-gray-400 mt-2">Welcome to the analytics overview of your platform.</p>
      </div>

      <DashboardStats />
    </div>
  );
};

export default page;
