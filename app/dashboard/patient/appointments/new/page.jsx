import BookingForm from "@/components/appointments/BookingForm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Book Appointment | FUTMinna Health Centre",
}

export default async function NewAppointmentPage() {
  const session = await auth()
  
  if (!session || session.user.role !== "patient") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">New Appointment</h1>
        <p className="text-zinc-500 mt-1">Schedule a visit with our medical staff.</p>
      </div>

      <BookingForm />
    </div>
  )
}
