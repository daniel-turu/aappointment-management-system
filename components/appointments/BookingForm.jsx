"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getPatientProfile, bookAppointment } from "@/actions/appointments"
import { FUTMINNA_SCHOOLS } from "@/lib/futminnaData"
import { AlertCircle, Stethoscope } from "lucide-react"

export default function BookingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [faculty, setFaculty] = useState("")
  const [department, setDepartment] = useState("")
  const [reason, setReason] = useState("")
  const [departmentsInSchool, setDepartmentsInSchool] = useState([])

  // Load patient's profile on mount to pre-fill School and Department
  useEffect(() => {
    getPatientProfile().then(profile => {
      if (profile) {
        if (profile.faculty) setFaculty(profile.faculty)
        if (profile.department) setDepartment(profile.department)
      }
    })
  }, [])

  // Sync departments when school/faculty changes
  useEffect(() => {
    if (faculty) {
      const school = FUTMINNA_SCHOOLS.find(s => s.id === faculty)
      if (school) {
        setDepartmentsInSchool(school.departments)
        // Reset department if it's not in the new school's department list
        if (!school.departments.includes(department)) {
          setDepartment("")
        }
      } else {
        setDepartmentsInSchool([])
      }
    } else {
      setDepartmentsInSchool([])
      setDepartment("")
    }
  }, [faculty, department])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!faculty || !department || !reason.trim()) {
      setError("Please fill in all the required fields.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await bookAppointment({
        faculty,
        department,
        reason
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push("/dashboard/patient?booked=true")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-zinc-200">
      <CardHeader className="space-y-1">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-purple-50 rounded-lg text-purple-900 mt-1">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl text-purple-900 font-bold">Request an Appointment</CardTitle>
            <CardDescription className="text-zinc-500 mt-1 text-sm leading-relaxed">
              State what is bothering you or why you want to visit the clinic. The medical team will review your request, assign you to the correct department/doctor, and schedule your appointment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Academic Affiliation */}
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-4">
            <h3 className="font-semibold text-purple-900 text-sm">Academic Affiliation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school-select" className="text-zinc-700">Your School (Faculty)</Label>
                <Select value={faculty} onValueChange={setFaculty}>
                  <SelectTrigger id="school-select" className="bg-white border-zinc-200">
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUTMINNA_SCHOOLS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-select" className="text-zinc-700">Your Department</Label>
                <Select value={department} onValueChange={setDepartment} disabled={!faculty}>
                  <SelectTrigger id="department-select" className="bg-white border-zinc-200">
                    <SelectValue placeholder={faculty ? "Select your department" : "Choose a school first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsInSchool.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reason / Symptoms Description */}
          <div className="space-y-2">
            <Label htmlFor="reason-textarea" className="text-zinc-700 font-semibold">
              What is bothering you? / Reason for visit
            </Label>
            <textarea
              id="reason-textarea"
              placeholder="Please describe your symptoms, health concern, or what you want to do (e.g. malaria test, medical certificate, severe cough since two days, general checkup)."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-900 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-[150px] resize-none"
              required
            />
            <p className="text-xs text-zinc-500">
              Provide as much detail as possible so our clinic staff can assign you correctly.
            </p>
          </div>
        </CardContent>

        <CardFooter className="border-t border-zinc-100 pt-6 flex justify-end">
          <Button 
            type="submit"
            className="bg-purple-900 hover:bg-purple-800 text-white px-6 py-2" 
            disabled={loading || !faculty || !department || !reason.trim()}
          >
            {loading ? "Submitting request..." : "Submit Appointment Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
