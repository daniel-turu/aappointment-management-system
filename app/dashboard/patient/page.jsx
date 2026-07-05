import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import connectDB from "@/lib/mongodb"
import Patient from "@/models/Patient"
import Appointment from "@/models/Appointment"
import Department from "@/models/Department"
import StatusBadge from "@/components/appointments/StatusBadge"
import { Calendar, Clock, ArrowRight, User } from "lucide-react"
import ArrivalCheckBanner from "@/components/appointments/ArrivalCheckBanner"

export default async function PatientDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== "patient") {
    redirect("/login")
  }

  await connectDB()
  const patient = await Patient.findOne({ userId: session.user.id })
  
  let upcomingCount = 0
  let upcomingAppointments = []
  
  if (patient) {
    // Count pending and approved appointments
    upcomingCount = await Appointment.countDocuments({
      patientId: patient._id,
      status: { $in: ["pending", "approved"] }
    })

    // Fetch next 3 upcoming appointments
    const appointmentsRaw = await Appointment.find({
      patientId: patient._id,
      status: { $in: ["pending", "approved"] }
    })
    .populate({
      path: "staffId",
      populate: { path: "userId", select: "name" }
    })
    .populate("departmentId")
    .sort({ date: 1, time: 1 })
    .limit(3)
    .lean()

    upcomingAppointments = appointmentsRaw.map(a => ({
      id: a._id.toString(),
      date: a.date,
      time: a.time,
      status: a.status,
      doctorName: a.doctorName || (a.staffId?.userId?.name ? `Dr. ${a.staffId.userId.name}` : "Any Available Doctor"),
      departmentName: a.departmentName || a.departmentId?.name || "General Clinic",
      arrivalStatus: a.arrivalStatus || "none",
      arrivalCheckCount: a.arrivalCheckCount || 0,
      arrivalEta: a.arrivalEta || ""
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Hello, {session.user.name.split(" ")[0]}!
        </h1>
        <p className="text-zinc-500 mt-1">Welcome back to the FUTMinna Health Centre portal.</p>
      </div>
      
      <ArrivalCheckBanner initialAppointments={upcomingAppointments} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Action Card */}
        <div className="p-6 bg-white border border-purple-100 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-lg text-purple-900">Need to see a doctor?</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-6">Book a new appointment with our medical professionals today.</p>
          </div>
          <Link href="/dashboard/patient/appointments/new" className="relative z-10 w-full mt-auto">
            <Button className="w-full bg-purple-900 hover:bg-purple-800 text-white">
              Book Appointment
            </Button>
          </Link>
        </div>

        {/* Stats Card */}
        <div className="p-6 bg-white border rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-zinc-700">Upcoming Appointments</h3>
            <div className="mt-4 flex items-baseline text-5xl font-bold text-zinc-900">
              {upcomingCount}
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-4">Active and approved bookings</p>
        </div>

        {/* Profile Card */}
        <div className="p-6 bg-white border rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-zinc-700">Academic Details</h3>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">School:</span>
                <span className="font-medium text-zinc-900">{patient?.faculty || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Dept:</span>
                <span className="font-medium text-zinc-900 truncate max-w-[150px]">{patient?.department || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">ID:</span>
                <span className="font-medium text-zinc-900">{patient?.studentId || "Not set"}</span>
              </div>
            </div>
          </div>
          <Link href="/dashboard/patient/profile" className="mt-4 text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1">
            <span>Edit Profile</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Next Appointments List */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-zinc-900">Next Scheduled Visits</h3>
          <Link href="/dashboard/patient/appointments" className="text-sm font-semibold text-purple-700 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {upcomingAppointments.map((app) => {
              const isDateValid = app.date && !isNaN(Date.parse(app.date))
              const formattedDate = isDateValid
                ? new Date(app.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })
                : (app.date || "Not Scheduled Yet")

               return (
                <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-800 text-sm whitespace-pre-wrap">{app.departmentName}</p>
                    <div className="flex items-center space-x-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </span>
                      {app.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{app.time}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{app.doctorName}</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 py-4 italic">No upcoming appointments scheduled.</p>
        )}
      </div>
    </div>
  )
}
