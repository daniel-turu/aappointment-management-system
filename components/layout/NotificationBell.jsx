"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Bell, Check, Trash2, MailOpen } from "lucide-react"
import { requestForToken, messaging } from "@/lib/firebase-client"
import { onMessage } from "firebase/messaging"
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/actions/notifications"

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Fetch notifications list
  const fetchNotifications = async () => {
    if (session) {
      const data = await getNotifications()
      if (Array.isArray(data)) {
        setNotifications(data)
      }
    }
  }

  // Register Service Worker and FCM Token
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && session) {
      const registerServiceWorker = async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/"/g, "")
          const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/"/g, "")
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/"/g, "")
          const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/"/g, "")
          const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/"/g, "")

          // Build dynamic SW parameters to avoid hardcoding client-side secrets
          const queryParams = new URLSearchParams({
            apiKey: apiKey || "",
            messagingSenderId: messagingSenderId || "",
            projectId: projectId || "",
            authDomain: authDomain || "",
            appId: appId || ""
          }).toString()

          const registration = await navigator.serviceWorker.register(
            `/firebase-messaging-sw.js?${queryParams}`,
            { scope: "/" }
          )
          console.log("FCM Service Worker registered scope:", registration.scope)

          // Request FCM token and register in DB
          const token = await requestForToken(registration)
          if (token) {
            await fetch("/api/notifications/fcm-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fcmToken: token })
            })
            console.log("FCM token successfully registered to user account.")
          }
        } catch (error) {
          console.error("FCM Service Worker registration failed:", error)
        }
      }

      registerServiceWorker()
    }
  }, [session])

  // Fetch notifications on load and setup polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [session])

  // Listen to foreground FCM messages
  useEffect(() => {
    if (typeof window !== "undefined" && messaging && session) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground FCM received:", payload)
        
        // Render a native browser notification in foreground
        if (Notification.permission === "granted") {
          const notificationTitle = payload.notification?.title || "FUTMinna Health Centre";
          const notificationOptions = {
            body: payload.notification?.body,
            icon: "https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png",
            data: payload.data || {}
          };
          const notif = new Notification(notificationTitle, notificationOptions);
          notif.onclick = (event) => {
            event.preventDefault();
            window.focus();
            const deepLink = payload.data?.url || "/dashboard";
            window.location.href = deepLink;
          };
        }
        
        // Refresh notifications instantly in UI
        fetchNotifications()
      });
      return () => unsubscribe()
    }
  }, [session])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Mark single as read
  const handleMarkAsRead = async (id) => {
    const res = await markNotificationAsRead(id)
    if (res.success) {
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead()
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-500 hover:text-purple-950 hover:bg-zinc-100 rounded-full transition-colors relative cursor-pointer"
        title="View Notifications"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-900 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-sm font-extrabold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-900 hover:text-purple-950 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <MailOpen className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs italic">
                No notifications to display.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 flex gap-3 items-start transition-colors ${
                    n.isRead ? "bg-white" : "bg-purple-50/20"
                  }`}
                >
                  {/* Status Indicator dot */}
                  <div className="mt-1.5">
                    <span
                      className={`block h-2 w-2 rounded-full ${
                        n.isRead ? "bg-zinc-200" : "bg-purple-900 animate-pulse"
                      }`}
                    />
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 space-y-1">
                    <p className={`text-xs font-bold text-zinc-900 leading-tight ${n.isRead ? "text-zinc-600" : ""}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-zinc-400 block pt-0.5">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {/* Action button: mark read */}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
