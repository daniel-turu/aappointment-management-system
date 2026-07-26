"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelAppointment, requestTimeShift } from "@/actions/appointments"
import StatusBadge from "./StatusBadge"
import { Calendar, Clock, AlertCircle, RefreshCw, HelpCircle, X } from "lucide-react"

export default function AppointmentsList({ initialAppointments }) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [cancellingId, setCancellingId] = useState(null)
  const [error, setError] = useState("")

  // Time shift modal state
  const [shiftModalApp, setShiftModalApp] = useState(null)
  const [requestedTime, setRequestedTime] = useState("")
  const [requestedDate, setRequestedDate] = useState("")
  const [shiftReason, setShiftReason] = useState("")
  const [submittingShift, setSubmittingShift] = useState(false)
  const [shiftError, setShiftError] = useState("")

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    setCancellingId(id)
    setError("")

    try {
      const res = await cancelAppointment(id)
      if (res?.error) {
        setError(res.error)
      } else {
        setAppointments(prev =>
          prev.map(app => (app.id === id ? { ...app, status: "cancelled" } : app))
        )
      }
    } catch (err) {
      setError("Failed to cancel appointment. Please try again.")
    } finally {
      setCancellingId(null)
    }
  }

  const handleOpenShiftModal = (app) => {
    setShiftModalApp(app)
    setRequestedTime(app.time || "09:00")
    setRequestedDate(app.date || "")
    setShiftReason("")
    setShiftError("")
  }

  const handleCloseShiftModal = () => {
    setShiftModalApp(null)
  }

  const handleSubmitShift = async (e) => {
    e.preventDefault()
    if (!requestedTime || !shiftReason.trim()) {
      setShiftError("Please enter both the requested time and a reason.")
      return
    }

    setSubmittingShift(true)
    setShiftError("")

    try {
      const res = await requestTimeShift(
        shiftModalApp.id,
        requestedTime,
        requestedDate || shiftModalApp.date,
        shiftReason
      )

      if (res?.error) {
        setShiftError(res.error)
      } else {
        // Update local appointment item
        setAppointments(prev =>
          prev.map(app =>
            app.id === shiftModalApp.id
              ? {
                  ...app,
                  shiftRequested: true,
                  requestedTime,
                  requestedDate: requestedDate || app.date,
                  shiftReason,
                  shiftStatus: "pending"
                }
              : app
          )
        )
        handleCloseShiftModal()
      }
    } catch (err) {
      setShiftError("Failed to submit shift request. Please try again.")
    } finally {
      setSubmittingShift(false)
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-white border rounded-xl shadow-sm">
        <div className="inline-flex p-3 bg-purple-50 rounded-full text-purple-900 mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">No appointments found</h3>
        <p className="text-sm text-zinc-500 mt-1">You haven't scheduled any visits with the health centre yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <th className="p-4">Room & Instructions</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {appointments.map((app) => {
                const isCancellable = ["pending", "approved"].includes(app.status)
                const isDateValid = app.date && !isNaN(Date.parse(app.date))
                const formattedDate = isDateValid
                  ? new Date(app.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : (app.date || "Not Scheduled Yet")

                return (
                  <tr key={app.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4 text-zinc-700 max-w-xs whitespace-pre-wrap font-medium">
                      {app.departmentName}
                    </td>
                    <td className="p-4 text-zinc-700">{app.doctorName}</td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center space-x-1.5 text-zinc-900 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formattedDate}</span>
                        </span>
                        {app.time && (
                          <span className="flex items-center space-x-1.5 text-zinc-500 text-xs">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{app.time}</span>
                          </span>
                        )}
                        {app.shiftRequested && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 w-max">
                            Requested: {app.requestedTime}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <StatusBadge status={app.status} />
                        {app.shiftStatus === "rejected" && !app.shiftRequested && (
                          <div className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 w-max text-center">
                            Shift Declined
                          </div>
                        )}
                        {app.shiftStatus === "approved" && (
                          <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-max text-center">
                            Shift Approved
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-500 max-w-xs">
                      <div className="space-y-1">
                        <p className="truncate" title={app.reason}>{app.reason || <span className="text-zinc-300 italic">No description</span>}</p>
                        {app.shiftRequested && app.shiftReason && (
                          <p className="text-[11px] text-zinc-400 italic bg-zinc-50 p-1.5 rounded border border-zinc-100">
                            <strong>Reason for late shift:</strong> {app.shiftReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {(app.status === "serving" || app.arrivalStatus === "arrived") && (
                        <Button
                          variant="outline"
                          size="xs"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold text-xs px-3 py-1.5 h-auto cursor-pointer shadow-xs animate-pulse"
                          disabled={cancellingId === app.id}
                          onClick={async () => {
                            if (!confirm("Are you done with your clinic visit and checking out?")) return;
                            setCancellingId(app.id);
                            try {
                              const { patientCheckoutAppointment } = await import("@/actions/appointments");
                              const res = await patientCheckoutAppointment(app.id);
                              if (res.success) {
                                setAppointments(prev =>
                                  prev.map(a => a.id === app.id ? { ...a, status: "completed", arrivalStatus: "completed" } : a)
                                );
                              } else {
                                alert(res.error || "Failed to check out.");
                              }
                            } catch (e) {
                              alert("Checkout failed. Please try again.");
                            } finally {
                              setCancellingId(null);
                            }
                          }}
                        >
                          Checkout from Clinic
                        </Button>
                      )}

                      {isCancellable && app.status !== "serving" && (
                        <div className="flex items-center justify-end gap-2">
                          {!app.shiftRequested ? (
                            <Button
                              variant="outline"
                              size="xs"
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 text-[11px] font-semibold px-2 py-1 h-auto cursor-pointer"
                              onClick={() => handleOpenShiftModal(app)}
                            >
                              Request Late / Shift Time
                            </Button>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold animate-pulse">
                              Pending Shift Review
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px] font-semibold px-2 py-1 h-auto cursor-pointer"
                            disabled={cancellingId === app.id}
                            onClick={() => handleCancel(app.id)}
                          >
                            {cancellingId === app.id ? "Cancelling..." : "Cancel"}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Shift Request Modal */}
      {shiftModalApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="font-extrabold text-zinc-950">Request Late Shift</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Shift your appointment time due to class/lecture conflicts.</p>
              </div>
              <button
                onClick={handleCloseShiftModal}
                className="p-1.5 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitShift} className="p-5 space-y-4">
              {shiftError && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{shiftError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Original Date & Time</label>
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 font-medium">
                  {shiftModalApp.date} at {shiftModalApp.time || "Not Scheduled"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Requested Date</label>
                  <input
                    type="date"
                    required
                    value={requestedDate}
                    onChange={e => setRequestedDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-transparent text-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Requested New Time</label>
                  <input
                    type="time"
                    required
                    value={requestedTime}
                    onChange={e => setRequestedTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-transparent text-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">Reason for Late Shift</label>
                <textarea
                  required
                  rows={3}
                  value={shiftReason}
                  onChange={e => setShiftReason(e.target.value)}
                  placeholder="e.g. I have a mechanical engineering lecture from 9:00 AM to 11:30 AM."
                  className="w-full p-3 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-transparent text-zinc-700 placeholder:text-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseShiftModal}
                  className="text-zinc-700 border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingShift}
                  className="bg-purple-900 hover:bg-purple-800 text-white cursor-pointer"
                >
                  {submittingShift ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
