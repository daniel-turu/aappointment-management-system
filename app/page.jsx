import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img 
            src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" 
            alt="FUTMinna Logo" 
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-purple-900 leading-tight">
              FUTMinna
            </h1>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Health Centre</p>
          </div>
        </div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-purple-900 hover:text-purple-800 hover:bg-purple-50">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-purple-900 hover:bg-purple-800 text-white">Register</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-pink-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-4xl px-6 text-center space-y-8 relative z-10 my-16">
          <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-800 mb-4">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Modernized Healthcare Access
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900">
            Book Your Health <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-purple-500">Appointment Online</span>
          </h1>
          
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            The official Appointment Management System for the Federal University of Technology, Minna Health Centre. Skip the manual queues and book your medical visit in seconds.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8 text-lg h-14 bg-purple-900 hover:bg-purple-800 shadow-lg shadow-purple-900/20">
                Book Appointment
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 text-lg h-14 border-purple-200 text-purple-900 hover:bg-purple-50">
                Manage Existing Booking
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-white border-t text-center text-sm text-zinc-500 flex flex-col items-center">
        <img 
          src="https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png" 
          alt="FUTMinna Logo" 
          className="w-8 h-8 opacity-50 mb-4 grayscale"
        />
        <p>© 2026 Federal University of Technology, Minna. All rights reserved.</p>
        <p className="mt-1 text-xs text-zinc-400">Appointment Management System - B.Tech Project</p>
      </footer>
    </div>
  )
}
