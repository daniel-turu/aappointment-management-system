"use client"

import { useState, useTransition } from "react"
import StaffTriageList from "./StaffTriageList"
import { 
  updateQueueStatus, 
  getTodayQueue, 
  processTimeShift, 
  getPendingTimeShifts,
  secretaryCancelFlaggedAppointment,
  secretaryAllowExtraTime
} from "@/actions/appointments"
import { ClipboardList, Play, CheckCircle2, AlertCircle, RefreshCw, Layers, CalendarRange, Check, X, Clock, ShieldAlert } from "lucide-react"

export default function StaffDashboardContainer({ initialPendingRequests, initialTodayQueue, initialPendingShifts = [] }) {
  const [activeTab, setActiveTab] = useState("triage")
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
  const [todayQueue, setTodayQueue] = useState(initialTodayQueue)
  const [pendingShifts, setPendingShifts] = useState(initialPendingShifts)
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState(null)
  const [shiftActionId, setShiftActionId] = useState(null)

  const refreshQueue = async () => {
    startTransition(async () => {
      const q = await getTodayQueue()
      setTodayQueue(q)
      const s = await getPendingTimeShifts()
      setPendingShifts(s)
    })
  }

  const handleStatusUpdate = async (apptId, status) => {
    setActionId(apptId)
    const res = await updateQueueStatus(apptId, status)
    if (res.success) {
      const q = await getTodayQueue()
      setTodayQueue(q)
    } else {
      alert(res.error || "Failed to update queue status")
    }
    setActionId(null)
  }

  const handleCancelFlagged = async (apptId) => {
    if (!confirm("Cancel this appointment because the student failed to arrive after 3 prompts?")) return;
    setActionId(apptId)
    const res = await secretaryCancelFlaggedAppointment(apptId, "Cancelled by Secretary: Student failed to arrive after 3 prompt attempts.")
    if (res.success) {
      const q = await getTodayQueue()
      setTodayQueue(q)
    } else {
      alert(res.error || "Failed to cancel appointment.")
    }
    setActionId(null)
  }

  const handleAllowExtraTime = async (apptId) => {
    setActionId(apptId)
    const res = await secretaryAllowExtraTime(apptId)
    if (res.success) {
      const q = await getTodayQueue()
      setTodayQueue(q)
    } else {
      alert(res.error || "Failed to extend appointment time.")
    }
    setActionId(null)
  }

  const handleProcessShift = async (apptId, action) => {
    setShiftActionId(apptId)
    try {
      const res = await processTimeShift(apptId, action)
      if (res.success) {
        // Remove from local shift list
        setPendingShifts(prev => prev.filter(s => s.id !== apptId))
        // Refresh live queue since time change affects it
        const q = await getTodayQueue()
        setTodayQueue(q)
      } else {
        alert(res.error || "Failed to process shift request.")
      }
    } catch (err) {
      alert("An error occurred. Please try again.")
    } finally {
      setShiftActionId(null)
    }
  }

  const getStatusBadge = (student) => {
    const { status, arrivalStatus, arrivalEta, arrivalCheckCount } = student;
    
    if (status === "serving" || arrivalStatus === "arrived") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-max">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Arrived / In Clinic
        </span>
      );
    }
    if (arrivalStatus === "flagged_late") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 w-max animate-bounce">
          <ShieldAlert className="w-3.5 h-3.5" />
          Flagged Late (3 Prompts Failed)
        </span>
      );
    }
    if (arrivalStatus === "delayed") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-max">
          <Clock className="w-3.5 h-3.5" />
          Delayed: {arrivalEta} ({arrivalCheckCount}/3)
        </span>
      );
    }
    if (arrivalStatus === "checking") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 w-max">
          Prompt Sent (Awaiting Confirmation)
        </span>
      );
    }
    if (status === "completed") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">Completed Visit</span>;
    }
    if (status === "cancelled") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">Cancelled</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Waiting Scheduled Slot</span>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs bar */}
      <div className="flex flex-wrap border-b border-zinc-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab("triage")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "triage"
              ? "border-purple-950 text-purple-950 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Incoming Requests ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("shifts")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "shifts"
              ? "border-purple-950 text-purple-950 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>Time Shift Requests ({pendingShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all cursor-pointer ${
            activeTab === "queue"
              ? "border-purple-950 text-purple-950 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Live Queue Controller ({todayQueue.filter(q => q.status === "approved" || q.status === "serving").length} Active)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "triage" && (
          <StaffTriageList initialRequests={pendingRequests} />
        )}

        {activeTab === "shifts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-zinc-950">Student Time Shift Requests</h3>
                <p className="text-xs text-zinc-500">Review and action schedule adjustments requested by students due to lectures or conflicts.</p>
              </div>
              <button
                onClick={refreshQueue}
                disabled={isPending}
                className="flex items-center space-x-1.5 text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-2 rounded-lg text-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Refresh Requests</span>
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Original Slot</th>
                      <th className="px-6 py-4">Requested Slot</th>
                      <th className="px-6 py-4">Reason for Request</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm">
                    {pendingShifts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">
                          No pending shift requests to review.
                        </td>
                      </tr>
                    ) : (
                      pendingShifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-zinc-900">{shift.patient?.name || "Unknown"}</div>
                            <div className="text-xs text-zinc-500">ID: {shift.patient?.studentId} | Dept: {shift.patient?.department}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">
                            <div>{shift.originalDate}</div>
                            <div className="text-xs font-medium mt-0.5">{shift.originalTime}</div>
                          </td>
                          <td className="px-6 py-4 text-indigo-700 font-bold">
                            <div>{shift.requestedDate}</div>
                            <div className="text-xs mt-0.5">{shift.requestedTime}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600 max-w-xs whitespace-pre-wrap italic">
                            "{shift.shiftReason}"
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleProcessShift(shift.id, "approve")}
                                disabled={shiftActionId !== null}
                                className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 p-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Approve Request"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-bold px-1">Accept</span>
                              </button>
                              <button
                                onClick={() => handleProcessShift(shift.id, "reject")}
                                disabled={shiftActionId !== null}
                                className="inline-flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 p-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                                <span className="text-xs font-bold px-1">Decline</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "queue" && (
          <div className="space-y-6">
            {/* Header / Refresh */}
            <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-zinc-950">Lobby Waiting & Consultation Queue</h3>
                <p className="text-xs text-zinc-500">Manage today's scheduled students and update their consultation progress.</p>
              </div>
              <button
                onClick={refreshQueue}
                disabled={isPending}
                className="flex items-center space-x-1.5 text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-2 rounded-lg text-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Queue Board Controller */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Position / Ticket</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Department / Room Details</th>
                      <th className="px-6 py-4">Scheduled Time</th>
                      <th className="px-6 py-4">Current Status</th>
                      <th className="px-6 py-4 text-right">Queue Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm">
                    {todayQueue.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                          No students are scheduled in the queue today.
                        </td>
                      </tr>
                    ) : (
                      todayQueue.map((student) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-zinc-50/50 transition-colors ${
                            student.status === "serving" ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-zinc-900">
                            Ticket #{student.queueNumber}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-zinc-900">{student.studentName}</div>
                            <div className="text-xs text-zinc-500">{student.reason}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-700">
                            {student.departmentName}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-medium">
                            {student.time}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(student)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {student.arrivalStatus === "flagged_late" && (
                                <>
                                  <button
                                    onClick={() => handleCancelFlagged(student.id)}
                                    disabled={actionId !== null}
                                    className="inline-flex items-center space-x-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Cancel Appointment</span>
                                  </button>
                                  <button
                                    onClick={() => handleAllowExtraTime(student.id)}
                                    disabled={actionId !== null}
                                    className="inline-flex items-center space-x-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Allow Extra Time</span>
                                  </button>
                                </>
                              )}

                              {(student.status === "serving" || student.arrivalStatus === "arrived") && (
                                <button
                                  onClick={() => handleStatusUpdate(student.id, "completed")}
                                  disabled={actionId !== null}
                                  className="inline-flex items-center space-x-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Complete Session</span>
                                </button>
                              )}

                              {["completed", "cancelled", "no_show"].includes(student.status) && (
                                <span className="text-xs text-zinc-400 italic px-3 py-1.5">Action recorded</span>
                              )}

                              {student.status === "approved" && student.arrivalStatus !== "flagged_late" && student.arrivalStatus !== "arrived" && (
                                <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 font-semibold px-2.5 py-1 rounded-md">
                                  Auto Arrival Active
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
