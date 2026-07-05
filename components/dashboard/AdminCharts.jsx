"use client"

import { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts"
import { Users, Calendar, CheckCircle, Clock } from "lucide-react"

// Color scheme for the pie chart
const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981", "#f59e0b"]

export default function AdminCharts({ data }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!data) return null

  const { stats, trendData, registrationData, departmentData } = data

  return (
    <div className="space-y-8">
      {/* 4 Cards for Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 text-purple-900 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalPatients}</h3>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Booked</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalAppointments}</h3>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.pendingAppointments}</h3>
          </div>
        </div>

        {/* Approved Visits */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Approved Visits</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.approvedAppointments}</h3>
          </div>
        </div>
      </div>

      {mounted ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Daily Appointments Trend Chart */}
          <div className="lg:col-span-2 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-lg text-zinc-900">Daily Appointments Trend</h3>
              <p className="text-sm text-zinc-500">Volume of appointments requested, approved, and rejected over the last 7 days.</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e4e4e7" }}
                    labelStyle={{ fontWeight: "bold", color: "#18181b" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="total" name="Total Requests" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorApproved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Performance Pie Chart */}
          <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-zinc-900">Department Performance</h3>
              <p className="text-sm text-zinc-500">Distribution of visits assigned across clinic departments.</p>
            </div>
            <div className="h-[240px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e4e4e7" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xs text-zinc-400 font-medium uppercase">Active Areas</p>
                <p className="text-2xl font-bold text-zinc-800">{departmentData.reduce((acc, curr) => acc + curr.value, 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {departmentData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-zinc-600 truncate">{entry.name}</span>
                  <span className="text-zinc-400 font-semibold ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Registrations by Department Bar Chart */}
          <div className="lg:col-span-3 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-lg text-zinc-900">Student Registrations by Department</h3>
              <p className="text-sm text-zinc-500">Yearly student registration counts, categorized by their academic departments.</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-10}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e4e4e7" }}
                    labelStyle={{ fontWeight: "bold", color: "#18181b" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="students" name="Registered Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[380px] bg-zinc-50 border rounded-xl animate-pulse flex items-center justify-center text-zinc-400 text-sm">
            Loading Appointments Trend...
          </div>
          <div className="h-[380px] bg-zinc-50 border rounded-xl animate-pulse flex items-center justify-center text-zinc-400 text-sm">
            Loading Department Distribution...
          </div>
          <div className="lg:col-span-3 h-[360px] bg-zinc-50 border rounded-xl animate-pulse flex items-center justify-center text-zinc-400 text-sm">
            Loading User Registrations...
          </div>
        </div>
      )}
    </div>
  )
}
