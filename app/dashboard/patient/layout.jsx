import PatientSidebar from "@/components/layout/PatientSidebar"
import Navbar from "@/components/layout/Navbar"
import Providers from "@/components/Providers"

export default function PatientDashboardLayout({ children }) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-slate-50">
        <PatientSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
