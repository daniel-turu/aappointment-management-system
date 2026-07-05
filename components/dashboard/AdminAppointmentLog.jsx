"use client"

import { useState, useEffect } from "react"
import { getFilteredAppointments } from "@/actions/admin"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Search, FileDown, Printer, RefreshCw, XCircle } from "lucide-react"

export default function AdminAppointmentLog() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    department: "all",
    startDate: "",
    endDate: ""
  })

  const loadAppointments = async () => {
    setLoading(true)
    const data = await getFilteredAppointments(filters)
    if (Array.isArray(data)) {
      setAppointments(data)
    }
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    loadAppointments()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadAppointments()
  }

  const handleClearFilters = () => {
    const cleared = {
      search: "",
      status: "all",
      department: "all",
      startDate: "",
      endDate: ""
    }
    setFilters(cleared)
    // Query with cleared filters
    setLoading(true)
    getFilteredAppointments(cleared).then((data) => {
      if (Array.isArray(data)) {
        setAppointments(data)
      }
      setLoading(false)
    })
  }

  // Export matching list as CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) return

    const headers = [
      "Student Name",
      "Student Email",
      "Student ID",
      "Assigned Department",
      "Reason for Visit",
      "Scheduled Date",
      "Time Slot",
      "Assigned Doctor",
      "Status"
    ]

    const rows = appointments.map(a => [
      `"${a.studentName.replace(/"/g, '""')}"`,
      `"${a.studentEmail.replace(/"/g, '""')}"`,
      `"${a.studentId.replace(/"/g, '""')}"`,
      `"${a.departmentName.replace(/"/g, '""')}"`,
      `"${a.reason.replace(/"/g, '""')}"`,
      `"${a.date}"`,
      `"${a.time}"`,
      `"${a.doctorName.replace(/"/g, '""')}"`,
      `"${a.status.toUpperCase()}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `futminna_appointments_report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print-friendly HTML report
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank")
    const today = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })

    const statusCounts = appointments.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {})

    const htmlContent = `
      <html>
        <head>
          <title>FUTMinna Clinic Appointments Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 40px; line-height: 1.5; }
            .header { display: flex; align-items: center; justify-content: space-between; border-b: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 60px; height: 60px; }
            .title h1 { margin: 0; font-size: 24px; color: #1e1b4b; }
            .title p { margin: 5px 0 0 0; font-size: 13px; color: #6b7280; }
            .summary-cards { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; text-align: center; }
            .card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
            .card p { margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #1e1b4b; }
            table { w-full; width: 100%; border-collapse: collapse; text-align: left; margin-top: 20px; font-size: 13px; }
            th { border-bottom: 2px solid #e5e7eb; padding: 12px; font-weight: bold; color: #4b5563; background: #f3f4f6; }
            td { border-bottom: 1px solid #f3f4f6; padding: 12px; color: #374151; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-pending { background: #fef3c7; color: #d97706; }
            .badge-approved { background: #dbeafe; color: #2563eb; }
            .badge-serving { background: #d1fae5; color: #059669; }
            .badge-completed { background: #e5e7eb; color: #4b5563; }
            .badge-no_show { background: #fee2e2; color: #dc2626; }
            .badge-rejected { background: #fee2e2; color: #dc2626; }
            .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">
              <h1>FUTMinna Clinic Appointments Report</h1>
              <p>Generated on ${today} | Total Records: ${appointments.length}</p>
            </div>
            <img src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" class="logo" />
          </div>

          <div class="summary-cards">
            <div class="card">
              <h3>Total Filtered</h3>
              <p>${appointments.length}</p>
            </div>
            <div class="card">
              <h3>Active / Serving</h3>
              <p>${statusCounts["serving"] || 0}</p>
            </div>
            <div class="card">
              <h3>Pending Triage</h3>
              <p>${statusCounts["pending"] || 0}</p>
            </div>
            <div class="card">
              <h3>Completed</h3>
              <p>${statusCounts["completed"] || 0}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Room / Dept</th>
                <th>Schedule</th>
                <th>Reason for Visit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${appointments.map(a => `
                <tr>
                  <td>
                    <strong>${a.studentName}</strong><br/>
                    <span style="color:#6b7280; font-size:11px;">${a.studentEmail}</span>
                  </td>
                  <td>${a.studentId}</td>
                  <td>${a.departmentName}</td>
                  <td>${a.date} at ${a.time}</td>
                  <td>${a.reason}</td>
                  <td>
                    <span class="badge badge-${a.status}">${a.status}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="footer">
            Federal University of Technology, Minna Health Centre | Consultation Queue Management System
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "serving":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse font-bold"
      case "completed":
        return "bg-zinc-100 text-zinc-600 border-zinc-200"
      case "no_show":
        return "bg-red-50 text-red-700 border-red-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-zinc-50 text-zinc-500 border-zinc-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtering Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search name, email, ID..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 bg-white border-zinc-200 focus-visible:ring-indigo-600"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={filters.department}
                onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-zinc-700"
              >
                <option value="all">All Rooms / Depts</option>
                <option value="General Clinic">General Clinic</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Dental Unit">Dental Unit</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-zinc-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Waiting</option>
                <option value="serving">Serving</option>
                <option value="completed">Completed</option>
                <option value="no_show">No Show</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <Input
                type="date"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="pl-9 bg-white border-zinc-200 focus-visible:ring-indigo-600 text-zinc-600 text-xs"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <Input
                type="date"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="pl-9 bg-white border-zinc-200 focus-visible:ring-indigo-600 text-zinc-600 text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Search className="w-4 h-4 mr-1.5" />}
                Search Log
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters} className="text-zinc-600 cursor-pointer">
                <XCircle className="w-4 h-4 mr-1.5" />
                Clear Filters
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCSV}
                disabled={appointments.length === 0}
                className="text-zinc-700 hover:bg-zinc-50 border-zinc-200 cursor-pointer"
              >
                <FileDown className="w-4 h-4 mr-1.5 text-purple-700" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintReport}
                disabled={appointments.length === 0}
                className="text-zinc-700 hover:bg-zinc-50 border-zinc-200 cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5 text-indigo-700" />
                Print PDF Report
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Appointment List Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <th className="p-4">Student Info</th>
                <th className="p-4">Assigned Room / Dept</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Reason for Visit</th>
                <th className="p-4">Staff / Doctor</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Querying database logs...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                    No matching appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-zinc-900">{a.studentName}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{a.studentEmail}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {a.studentId}</div>
                    </td>
                    <td className="p-4 font-semibold text-zinc-700">{a.departmentName}</td>
                    <td className="p-4 text-zinc-600">
                      <div>{a.date}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{a.time}</div>
                    </td>
                    <td className="p-4 text-zinc-500 max-w-xs truncate" title={a.reason}>
                      {a.reason}
                    </td>
                    <td className="p-4 text-zinc-600">{a.doctorName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(a.status)}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
