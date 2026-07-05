import AppointmentsList from "@/components/appointments/AppointmentsList"
import { getPatientAppointments } from "@/actions/appointments"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ArrivalCheckBanner from "@/components/appointments/ArrivalCheckBanner"

export const metadata = {
  title: "My Appointments | FUTMinna Health Centre",
}

export default async function PatientAppointmentsPage() {
  const session = await auth()
  
  if (!session || session.user.role !== "patient") {
    redirect("/login")
  }

  const appointments = await getPatientAppointments()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Appointments</h1>
          <p className="text-zinc-500 mt-1">View, track, and manage your health centre visits.</p>
        </div>
        <Link href="/dashboard/patient/appointments/new">
          <Button className="bg-purple-900 hover:bg-purple-800 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </Button>
        </Link>
      </div>

      <ArrivalCheckBanner initialAppointments={appointments} />
      <AppointmentsList initialAppointments={appointments} />
    </div>
  )
}
