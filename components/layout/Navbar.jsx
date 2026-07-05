"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import NotificationBell from "./NotificationBell"

export default function Navbar() {
  const { data: session } = useSession()

  // Get initials for avatar
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "P"

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8">
      <div className="flex items-center">
        {/* Mobile menu button could go here */}
        <h2 className="text-xl font-semibold text-zinc-800 hidden sm:block">
          Patient Portal
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-8 w-px bg-zinc-200" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-700 leading-none">{session?.user?.name || "Patient"}</p>
            <p className="text-xs text-zinc-500 mt-1">{session?.user?.email}</p>
          </div>
          
          <Avatar className="h-9 w-9 bg-purple-100 text-purple-900 border border-purple-200">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-2 text-zinc-600"
        >
          Sign out
        </Button>
      </div>
    </header>
  )
}
