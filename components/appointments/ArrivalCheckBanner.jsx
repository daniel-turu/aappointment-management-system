"use client"

import { useState, startTransition } from "react"
import { respondToArrivalCheck } from "@/actions/appointments"
import { Check, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ArrivalCheckBanner({ initialAppointments = [] }) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [loadingId, setLoadingId] = useState(null)
  const [error, setError] = useState("")

  // Filter for appointments that are currently asking the student if they've arrived
  const checkingAppts = appointments.filter(app => app.arrivalStatus === "checking")

  if (checkingAppts.length === 0) return null

  const handleResponse = async (apptId, isYes, eta = 0) => {
    setLoadingId(apptId)
    setError("")
    try {
      const res = await respondToArrivalCheck(apptId, isYes ? "yes" : "no", eta)
      if (res.error) {
        setError(res.error)
      } else {
        // Update local status so banner disappears
        setAppointments(prev =>
          prev.map(app =>
            app.id === apptId
              ? {
                  ...app,
                  arrivalStatus: isYes ? "arrived" : "delayed",
                  arrivalCheckCount: isYes ? app.arrivalCheckCount : (app.arrivalCheckCount || 0) + 1,
                  arrivalEta: isYes ? "" : `${eta}m`
                }
              : app
          )
        )
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checkingAppts.map((app) => (
        <div
          key={app.id}
          className="bg-purple-950 text-white rounded-xl shadow-lg border border-purple-900 p-5 md:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(168,85,247,0.15),transparent_60%)] pointer-events-none"></div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
                Clinic Arrival Check
              </span>
            </div>
            <h3 className="text-lg font-bold">Have you arrived at the FUTMinna Health Centre?</h3>
            <p className="text-sm text-purple-100 max-w-xl">
              Your appointment for <strong>{app.departmentName}</strong> at <strong>{app.time}</strong> has reached its scheduled time. Please confirm your arrival.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <Button
              disabled={loadingId !== null}
              onClick={() => handleResponse(app.id, true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 px-4 rounded-lg flex items-center gap-1.5 shadow-md border-0 cursor-pointer"
            >
              {loadingId === app.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4.5 h-4.5" />
              )}
              <span>Yes, I am here</span>
            </Button>

            <div className="flex flex-wrap items-center bg-purple-900/60 border border-purple-800 rounded-lg p-1.5 gap-1">
              <span className="text-xs text-purple-200 px-1.5 font-semibold">Not yet, I need:</span>
              <button
                disabled={loadingId !== null}
                onClick={() => handleResponse(app.id, false, 1)}
                className="hover:bg-purple-800 bg-purple-900/80 text-white text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors"
              >
                1 Min
              </button>
              <button
                disabled={loadingId !== null}
                onClick={() => handleResponse(app.id, false, 2)}
                className="hover:bg-purple-800 bg-purple-900/80 text-white text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors"
              >
                2 Mins
              </button>
              <button
                disabled={loadingId !== null}
                onClick={() => handleResponse(app.id, false, 3)}
                className="hover:bg-purple-800 bg-purple-900/80 text-white text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors"
              >
                3 Mins
              </button>
              <button
                disabled={loadingId !== null}
                onClick={() => handleResponse(app.id, false, 5)}
                className="hover:bg-purple-800 bg-purple-900/80 text-white text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors"
              >
                5 Mins
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
