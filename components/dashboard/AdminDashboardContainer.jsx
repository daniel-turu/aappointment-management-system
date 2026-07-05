"use client"

import { useState } from "react"
import AdminCharts from "./AdminCharts"
import AdminUserList from "./AdminUserList"
import AdminAppointmentLog from "./AdminAppointmentLog"
import { BarChart3, Users, ClipboardList } from "lucide-react"

export default function AdminDashboardContainer({ metricsData, initialStudents }) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Tab Switchers */}
      <div className="flex border-b border-zinc-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Overview</span>
        </button>
        
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "appointments"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Appointment Logs & Reports</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "users"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Accounts</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === "overview" && <AdminCharts data={metricsData} />}
        {activeTab === "appointments" && <AdminAppointmentLog />}
        {activeTab === "users" && <AdminUserList initialStudents={initialStudents} />}
      </div>
    </div>
  )
}
