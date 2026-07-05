"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { updatePatientProfile } from "@/actions/users"
import { FUTMINNA_SCHOOLS } from "@/lib/futminnaData"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function PatientProfileForm({ user, patient }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [studentId, setStudentId] = useState(patient?.studentId || "")
  const [gender, setGender] = useState(patient?.gender || "")
  const [age, setAge] = useState(patient?.age || "")
  const [address, setAddress] = useState(patient?.address || "")
  const [faculty, setFaculty] = useState(patient?.faculty || "")
  const [department, setDepartment] = useState(patient?.department || "")
  const [emergencyContact, setEmergencyContact] = useState(patient?.emergencyContact || "")

  const [departmentsInSchool, setDepartmentsInSchool] = useState([])

  // Load Departments of the selected School
  useEffect(() => {
    if (faculty) {
      const school = FUTMINNA_SCHOOLS.find(s => s.id === faculty)
      if (school) {
        setDepartmentsInSchool(school.departments)
      } else {
        setDepartmentsInSchool([])
      }
    } else {
      setDepartmentsInSchool([])
    }
  }, [faculty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    try {
      const res = await updatePatientProfile({
        name,
        phone,
        studentId,
        gender,
        age: age ? Number(age) : undefined,
        address,
        faculty,
        department,
        emergencyContact
      })

      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Your profile has been successfully updated!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="shadow-sm border-zinc-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">Personal Information</CardTitle>
          <CardDescription>Update your basic account and contact information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email Address (Read-only)</Label>
              <Input
                id="emailAddress"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-zinc-50 border-zinc-200 text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08012345678"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentIdField">Student/Staff ID</Label>
              <Input
                id="studentIdField"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="2022/1/00000CT"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">Academic Affiliation</CardTitle>
          <CardDescription>Select your school and academic department at FUTMinna.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolField">Your School (Faculty)</Label>
              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger id="schoolField">
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
              <Label htmlFor="deptField">Your Department</Label>
              <Select value={department} onValueChange={setDepartment} disabled={!faculty}>
                <SelectTrigger id="deptField">
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
        </CardContent>
      </Card>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">Health & Medical Info</CardTitle>
          <CardDescription>Provide details to assist in your primary care records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genderField">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="genderField">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageField">Age</Label>
              <Input
                id="ageField"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="21"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressField">Residential Address</Label>
              <Input
                id="addressField"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Gidan Kwano Campus Hostels, FUTMinna"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergencyField">Emergency Contact (Name & Phone)</Label>
              <Input
                id="emergencyField"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="Parent/Guardian Name - 08033221100"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
          <Button type="submit" className="bg-purple-900 hover:bg-purple-800 text-white" disabled={loading}>
            {loading ? "Saving changes..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
