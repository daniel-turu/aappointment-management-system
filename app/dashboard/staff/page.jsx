import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getPendingAppointments, getTodayQueue, getPendingTimeShifts } from "@/actions/appointments"
import StaffDashboardContainer from "@/components/dashboard/StaffDashboardContainer"
import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal"
import NotificationBell from "@/components/layout/NotificationBell"
import Providers from "@/components/Providers"
import { LogOut } from "lucide-react"

export const metadata = {
  title: "Staff Queue Dashboard | FUTMinna Health Centre",
}

export default async function StaffDashboard() {
  const session = await auth()
  
  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/login")
  }

  // Fetch pending requests, shifts, and today's queue list in parallel
  const [pendingRequests, todayQueue, pendingShifts] = await Promise.all([
    getPendingAppointments(),
    getTodayQueue(),
    getPendingTimeShifts()
  ])

  return (
    <Providers>
      <div className="min-h-screen bg-zinc-50/50 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <img 
              src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" 
              alt="FUTMinna Logo" 
              className="w-14 h-14 bg-white rounded-full p-1 border shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-purple-950">FUTMinna Health Centre</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-800 border border-purple-100">
                  Portal
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-1">
                Welcome back, <span className="font-semibold text-zinc-900">{session.user.name}</span> (Clinic Staff)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ChangePasswordModal />
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="outline" className="border-zinc-200 hover:bg-zinc-50 text-zinc-700 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Main Workspaces Layout Container */}
        <StaffDashboardContainer 
          initialPendingRequests={pendingRequests} 
          initialTodayQueue={todayQueue} 
          initialPendingShifts={pendingShifts} 
        />
      </div>
    </Providers>
  )
}
