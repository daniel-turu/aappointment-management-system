"use client"

import { useState, useEffect } from "react"
import { getTodayQueue } from "@/actions/appointments"
import { Users, Play, Clock, RefreshCw } from "lucide-react"

export default function PublicQueueBoard({ initialQueue }) {
  const [queue, setQueue] = useState(initialQueue)
  const [loading, setLoading] = useState(false)
  const [timeString, setTimeString] = useState("")

  const fetchLatestQueue = async () => {
    setLoading(true)
    const latest = await getTodayQueue()
    setQueue(latest)
    setTimeString(new Date().toLocaleTimeString())
    setLoading(false)
  }

  // Auto-poll every 15 seconds
  useEffect(() => {
    setTimeString(new Date().toLocaleTimeString())
    const interval = setInterval(fetchLatestQueue, 15000)
    return () => clearInterval(interval)
  }, [])

  // Filter queue into categories
  const servingPatients = queue.filter(p => p.status === "serving")
  
  const waitingQueue = queue.filter(p => p.status === "approved")
  const nextUpPatients = waitingQueue.slice(0, 3)
  const remainingQueue = queue.filter(p => p.status !== "serving")

  const getStatusStyle = (status) => {
    switch (status) {
      case "serving":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse font-bold"
      case "approved":
        return "bg-amber-50 text-amber-700 border-amber-200 font-medium"
      case "completed":
        return "bg-zinc-100 text-zinc-600 border-zinc-200"
      case "no_show":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "serving":
        return "NOW SERVING"
      case "approved":
        return "WAITING"
      case "completed":
        return "COMPLETED"
      case "no_show":
        return "NO SHOW"
      default:
        return status.toUpperCase()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-800 font-sans p-6 md:p-12 space-y-8">
      {/* Lobby Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-200 pb-6">
        <div className="flex items-center space-x-5">
          <img
            src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png"
            alt="FUTMinna Logo"
            className="w-16 h-16 bg-white rounded-full p-1 border shadow-sm"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
              FUTMinna Clinic <span className="text-purple-900 font-bold">Live Queue Board</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Real-time student queueing display. Updates automatically every 15 seconds.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-xs text-zinc-500 shadow-sm">
          <Clock className="w-4 h-4 text-purple-700" />
          <span>Last Updated: {timeString || "Just now"}</span>
          <button
            onClick={fetchLatestQueue}
            disabled={loading}
            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Active Board */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Now Serving Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Now Serving ({servingPatients.length})</span>
            </h2>
            <span className="text-xs text-zinc-500 font-medium">Please proceed to your assigned room</span>
          </div>

          {servingPatients.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400 italic shadow-sm">
              No patients are currently being attended to.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {servingPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white border border-purple-200 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-[240px] shadow-sm hover:border-purple-300 transition-colors"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-8 -mt-8"></div>
                  <div>
                    <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>{patient.departmentName || "General"}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h3 className="text-2xl font-black text-purple-950 truncate">{patient.studentName}</h3>
                      <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase line-clamp-1">
                        Reason: {patient.reason || "General Consultation"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-end border-t border-zinc-100 pt-4">
                    <div>
                      <p className="text-[9px] text-zinc-400 uppercase font-semibold">Queue Ticket</p>
                      <p className="text-xl font-black text-purple-950 mt-0.5">NO. 0{patient.queueNumber}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 text-purple-900 text-[10px] px-3 py-1.5 rounded-xl font-medium">
                      Time Slot: {patient.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Up Next List */}
        <div className="space-y-4 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center space-x-2 mb-2">
              <Play className="w-4 h-4 text-purple-700 fill-purple-700" />
              <span>Up Next (Queue Line)</span>
            </h3>
            <p className="text-zinc-500 text-xs mb-6">Students who should be ready for consultation soon.</p>

            <div className="space-y-3">
              {nextUpPatients.length === 0 ? (
                <div className="text-zinc-400 text-sm py-8 text-center italic">
                  Queue line is empty.
                </div>
              ) : (
                nextUpPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-purple-200 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-zinc-800">{patient.studentName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{patient.departmentName}</div>
                    </div>
                    <div className="text-right">
                      <div className="bg-purple-50 border border-purple-100 text-purple-700 px-3 py-1 rounded-xl text-xs font-black">
                        #{patient.queueNumber}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">{patient.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>In Waiting: {waitingQueue.length} students</span>
            <span>Est. Wait Time: ~{waitingQueue.length * 15} mins</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Queue Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-700" />
            <span>Today's Clinic Queue List</span>
          </h3>
          <p className="text-zinc-500 text-xs">Full queue overview for the clinic today.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Appt Time</th>
                <th className="px-6 py-4">Queue Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {remainingQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400 italic">
                    No scheduled queue entries yet.
                  </td>
                </tr>
              ) : (
                remainingQueue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-zinc-700">
                      NO. 0{patient.queueNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">
                      {patient.studentName}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {patient.departmentName}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-medium">
                      {patient.time}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(patient.status)}`}>
                        {getStatusLabel(patient.status)}
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
