import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal"
import NotificationBell from "@/components/layout/NotificationBell"
import AdminDashboardContainer from "@/components/dashboard/AdminDashboardContainer"
import { getAdminMetrics, getRegisteredStudents } from "@/actions/admin"
import Providers from "@/components/Providers"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== "admin") {
    redirect("/login")
  }

  // Fetch both metrics and student accounts
  const [metricsData, initialStudents] = await Promise.all([
    getAdminMetrics(),
    getRegisteredStudents()
  ])

  return (
    <Providers>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-950">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time statistics, queue metrics, and student account management.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ChangePasswordModal />
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="outline">Sign Out</Button>
            </form>
          </div>
        </div>
        
        <AdminDashboardContainer metricsData={metricsData} initialStudents={initialStudents} />
      </div>
    </Providers>
  )
}
