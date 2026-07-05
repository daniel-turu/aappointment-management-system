"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function PatientSidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Dashboard", href: "/dashboard/patient", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Book Appointment", href: "/dashboard/patient/appointments/new", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "My Appointments", href: "/dashboard/patient/appointments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Live Queue Board", href: "/queue", icon: "M4 6h16M4 12h16M4 18h16" },
    { name: "Profile", href: "/dashboard/patient/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ]

  return (
    <aside className="w-64 bg-white border-r min-h-screen hidden md:block">
      <div className="p-6">
        <h2 className="text-xl font-bold text-purple-900 tracking-tight">FUTMinna</h2>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Health Centre</p>
      </div>

      <nav className="mt-6 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? "bg-purple-50 text-purple-900 font-medium" 
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-purple-900"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
