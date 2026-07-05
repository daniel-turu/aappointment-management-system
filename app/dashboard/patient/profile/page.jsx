import PatientProfileForm from "@/components/dashboard/PatientProfileForm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Patient from "@/models/Patient"

export const metadata = {
  title: "My Profile | FUTMinna Health Centre",
}

export default async function PatientProfilePage() {
  const session = await auth()
  
  if (!session || session.user.role !== "patient") {
    redirect("/login")
  }

  await connectDB()

  const user = await User.findById(session.user.id).lean()
  const patient = await Patient.findOne({ userId: session.user.id }).lean()

  const userData = user ? {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || ""
  } : null

  const patientData = patient ? {
    id: patient._id.toString(),
    studentId: patient.studentId || "",
    gender: patient.gender || "",
    age: patient.age || "",
    address: patient.address || "",
    faculty: patient.faculty || "",
    department: patient.department || "",
    emergencyContact: patient.emergencyContact || ""
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Profile Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your academic details and contact info for the health centre.</p>
      </div>

      <PatientProfileForm user={userData} patient={patientData} />
    </div>
  )
}
