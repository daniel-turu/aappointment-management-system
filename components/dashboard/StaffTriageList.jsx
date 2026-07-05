"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  triageAppointment, 
  rejectAppointment 
} from "@/actions/appointments"
import { Calendar, Clock, User, Check, X, ClipboardList, AlertCircle, RefreshCw } from "lucide-react"

export default function StaffTriageList({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState(null)
  
  // Triage state
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [instructions, setInstructions] = useState("")
  
  // Rejection state
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Reset form when active request changes
  useEffect(() => {
    setDate("")
    setTime("")
    setInstructions("")
    setRejectMode(false)
    setRejectionReason("")
    setSuccessMsg("")
    setErrorMsg("")
  }, [selectedRequest])

  const handleApprove = async (e) => {
    e.preventDefault()
    if (!selectedRequest) return
    if (!date.trim() || !time.trim() || !instructions.trim()) {
      setErrorMsg("Please fill in the date, time, and instructions.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await triageAppointment(selectedRequest.id, {
        departmentName: instructions,
        doctorName: "Clinic Staff",
        date: date,
        time: time
      })

      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg("Appointment successfully scheduled and approved!")
        // Remove from pending list
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        setSelectedRequest(null)
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRequest || !rejectionReason.trim()) return

    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await rejectAppointment(selectedRequest.id, rejectionReason)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg("Appointment request successfully rejected.")
        setRequests(prev => prev.filter(r => r.id !== selectedRequest.id))
        setSelectedRequest(null)
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: List of Requests */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-purple-900" />
          <span>Pending Requests ({requests.length})</span>
        </h2>
        
        {requests.length === 0 ? (
          <div className="p-8 text-center bg-white border border-zinc-200 rounded-xl shadow-sm text-zinc-500 italic">
            No pending appointment requests.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
            {requests.map(req => (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`p-4 border rounded-xl shadow-sm cursor-pointer transition-all ${
                  selectedRequest?.id === req.id
                    ? "bg-purple-900 border-purple-900 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-purple-300 hover:bg-purple-50/20"
                }`}
              >
                <div className="font-semibold">{req.patient?.name || "Unknown Patient"}</div>
                <div className={`text-xs mt-1 truncate ${selectedRequest?.id === req.id ? "text-purple-200" : "text-zinc-500"}`}>
                  School: {req.patient?.school}
                </div>
                <div className={`text-xs mt-1 truncate font-medium ${selectedRequest?.id === req.id ? "text-purple-100" : "text-purple-950"}`}>
                  Reason: {req.reason}
                </div>
                <div className={`text-[10px] mt-2 text-right ${selectedRequest?.id === req.id ? "text-purple-300" : "text-zinc-400"}`}>
                  Submitted {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: Active request triage and actions */}
      <div className="lg:col-span-2">
        {selectedRequest ? (
          <div className="space-y-6">
            {/* Success/Error Alerts */}
            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Card className="shadow-sm border-zinc-200">
              <CardHeader className="bg-zinc-50/50 border-b">
                <CardTitle className="text-xl text-purple-900 font-bold">Booking Request Details</CardTitle>
                <CardDescription>Review student symptoms and assign medical details.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Student Personal details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-purple-50/30 p-4 rounded-xl border border-purple-100/50">
                  <div>
                    <span className="text-zinc-400">Name:</span>{" "}
                    <span className="font-semibold text-zinc-900">{selectedRequest.patient?.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Student ID:</span>{" "}
                    <span className="font-semibold text-zinc-900">{selectedRequest.patient?.studentId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">School / Department:</span>{" "}
                    <span className="font-semibold text-zinc-900">
                      {selectedRequest.patient?.school} ({selectedRequest.patient?.department})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Age / Gender:</span>{" "}
                    <span className="font-semibold text-zinc-900">
                      {selectedRequest.patient?.age} yrs / {selectedRequest.patient?.gender}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-zinc-400">Contact Details:</span>{" "}
                    <span className="font-semibold text-zinc-900">
                      {selectedRequest.patient?.phone} | {selectedRequest.patient?.email}
                    </span>
                  </div>
                </div>

                {/* Student symptoms description */}
                <div className="space-y-2">
                  <Label className="text-zinc-700 font-semibold text-sm">Student Statement of Concern</Label>
                  <p className="p-4 bg-zinc-50 border rounded-xl text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedRequest.reason}
                  </p>
                </div>

                {!rejectMode ? (
                  /* Approve / Schedule Form */
                  <form onSubmit={handleApprove} className="space-y-6 pt-4 border-t">
                    <h3 className="font-bold text-zinc-900 text-sm">Schedule & Instructions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="triage-date">Schedule Date</Label>
                        <Input
                          id="triage-date"
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="bg-white border-zinc-200"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="triage-time">Schedule Time</Label>
                        <Input
                          id="triage-time"
                          type="time"
                          value={time}
                          onChange={e => setTime(e.target.value)}
                          className="bg-white border-zinc-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="triage-instructions">Consultation Room & Special Instructions</Label>
                      <textarea
                        id="triage-instructions"
                        rows={3}
                        placeholder="e.g. Go to General Clinic Room 2. Ask for Nurse Joy."
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        className="w-full rounded-md border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setRejectMode(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Request</span>
                      </Button>

                      <Button
                        type="submit"
                        disabled={loading || !date.trim() || !time.trim() || !instructions.trim()}
                        className="bg-purple-900 hover:bg-purple-800 text-white flex items-center gap-1.5 px-6"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Approve & Schedule</span>
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Rejection Form */
                  <form onSubmit={handleRejectSubmit} className="space-y-4 pt-4 border-t">
                    <h3 className="font-bold text-red-700 text-sm flex items-center gap-1.5">
                      <X className="w-4 h-4" />
                      <span>Reject Appointment Request</span>
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Provide Reason for Rejection</Label>
                      <textarea
                        id="rejection-reason"
                        placeholder="State why this request is being rejected (e.g. Please provide a copy of your course form first, or the health centre does not offer this service, etc.)"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="flex w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent min-h-[100px] resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setRejectMode(false)}
                        className="text-zinc-600 hover:text-zinc-700"
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        disabled={loading || !rejectionReason.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        <span>Confirm Rejection</span>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-[400px] border border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center p-6 bg-zinc-50/50 text-center">
            <ClipboardList className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-zinc-600 font-semibold text-lg">Select a request to begin</h3>
            <p className="text-zinc-400 text-sm max-w-sm mt-1">
              Select any pending student request from the left panel to review symptoms and schedule details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
