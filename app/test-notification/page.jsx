"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { 
  Bell, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Shield, 
  Activity, 
  RefreshCw, 
  ArrowLeft, 
  Info,
  Terminal
} from "lucide-react"
import { requestForToken, messaging } from "@/lib/firebase-client"
import { onMessage } from "firebase/messaging"

import Providers from "@/components/Providers"

function TestNotificationPageContent() {
  const { data: session } = useSession()
  const [permission, setPermission] = useState("loading")
  const [fcmToken, setFcmToken] = useState("")
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState("Checking...")
  const [copied, setCopied] = useState(false)
  
  // Custom Push Form
  const [title, setTitle] = useState("Diagnostics Test Push")
  const [body, setBody] = useState("Hello! This is a test push notification from your diagnostics dashboard.")
  const [sending, setSending] = useState(false)
  const [apiResult, setApiResult] = useState(null)

  // Console log state
  const [logs, setLogs] = useState([])

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [{ timestamp, message, type }, ...prev])
  }

  // Check initial permissions and Service Workers
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPermission(Notification.permission)
      addLog(`Initial notification permission status: ${Notification.permission}`, "info")

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            setServiceWorkerStatus(`Registered (${registrations.length} active)`)
            addLog(`Found ${registrations.length} active Service Worker registration(s).`, "success")
          } else {
            setServiceWorkerStatus("None Registered")
            addLog("No active Service Workers found. Please request token to initialize registration.", "warn")
          }
        }).catch(err => {
          setServiceWorkerStatus("Error checking SW")
          addLog(`Error checking service worker: ${err.message}`, "error")
        })
      } else {
        setServiceWorkerStatus("Not supported in browser")
        addLog("Service Workers are not supported in this browser.", "error")
      }
    }
  }, [])

  // Listen to foreground messages
  useEffect(() => {
    if (typeof window !== "undefined" && messaging) {
      addLog("Setting up foreground messaging event listener...", "info")
      try {
        const unsubscribe = onMessage(messaging, (payload) => {
          addLog(`Foreground FCM received! Title: "${payload.notification?.title}", Body: "${payload.notification?.body}"`, "success")
          console.log("Foreground FCM payload:", payload)
          
          // Render native browser notification if allowed
          if (Notification.permission === "granted") {
            new Notification(payload.notification?.title || "Test Notification", {
              body: payload.notification?.body,
              icon: "https://futminna.edu.ng/wp-content/uploads/2022/11/cropped-futlogo1-192x192.png",
              data: payload.data
            })
          }
        })
        return () => unsubscribe()
      } catch (err) {
        addLog(`Failed to attach foreground message listener: ${err.message}`, "error")
      }
    }
  }, [])

  // Request Permission and Generate Token
  const handleRequestToken = async () => {
    addLog("Registering Service Worker with configuration...", "info")
    try {
      if ("serviceWorker" in navigator) {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/"/g, "")
        const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/"/g, "")
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/"/g, "")
        const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/"/g, "")
        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/"/g, "")

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
        setServiceWorkerStatus(`Registered (Active)`)
        addLog("Service Worker registered successfully.", "success")
      }
    } catch (swErr) {
      addLog(`SW Registration Warning: ${swErr.message}`, "warn")
    }

    addLog("Requesting token from Firebase client...", "info")
    try {
      const token = await requestForToken()
      setPermission(Notification.permission)
      
      if (token) {
        setFcmToken(token)
        addLog("FCM token generated successfully!", "success")
        console.log("Generated token:", token)
        
        // Also register with server
        addLog("Syncing token with current logged-in account in DB...", "info")
        const res = await fetch("/api/notifications/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcmToken: token })
        })
        
        if (res.ok) {
          addLog("Token successfully linked to database user record.", "success")
        } else {
          const errData = await res.json()
          addLog(`Server failed to sync token: ${errData.error || res.statusText}`, "error")
        }
      } else {
        addLog("Failed to obtain FCM token. Check if permissions were denied or VAPID key is configured.", "error")
      }
    } catch (error) {
      addLog(`Error during token generation: ${error.message}`, "error")
    }
  }

  // Trigger test notification
  const handleSendTestPush = async () => {
    if (!fcmToken) {
      addLog("Cannot send push: Generate or input an FCM token first.", "error")
      return
    }

    setSending(true)
    setApiResult(null)
    addLog(`Sending request to /api/notifications/test-push...`, "info")

    try {
      const response = await fetch("/api/notifications/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          customToken: fcmToken
        })
      })

      const data = await response.json()
      setApiResult(data)

      if (response.ok && data.success) {
        addLog(`Push dispatch succeeded! Message ID: ${data.messageId}`, "success")
      } else {
        addLog(`Push dispatch failed: ${data.error || "Unknown Error"}`, "error")
      }
    } catch (error) {
      addLog(`API fetch error: ${error.message}`, "error")
    } finally {
      setSending(false)
    }
  }

  const handleCopyToken = () => {
    if (!fcmToken) return
    navigator.clipboard.writeText(fcmToken)
    setCopied(true)
    addLog("FCM Token copied to clipboard.", "info")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Banner / Navigation */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-purple-300 animate-bounce" />
              FCM Diagnostics
            </h1>
            <p className="text-xs text-purple-200">
              Test and troubleshoot real-time push notifications
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Diagnostics Checklist & Token */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-indigo-600" />
              Device Status
            </h2>

            {/* Checklist */}
            <div className="space-y-4">
              {/* Login Session */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">User Session</span>
                {session ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200">
                    Logged in: {session.user.name} ({session.user.role})
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full border border-amber-200">
                    Guest Session
                  </span>
                )}
              </div>

              {/* Notification Permission */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Permissions</span>
                <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border ${
                  permission === "granted" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : permission === "denied"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {permission.toUpperCase()}
                </span>
              </div>

              {/* Service Worker Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Service Worker</span>
                <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border ${
                  serviceWorkerStatus.startsWith("Registered")
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {serviceWorkerStatus}
                </span>
              </div>
            </div>

            {/* Token Section */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 block">FCM Registration Token</label>
              <div className="relative">
                <textarea
                  readOnly
                  value={fcmToken || "No token generated yet. Click the button below."}
                  className="w-full h-24 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {fcmToken && (
                  <button
                    onClick={handleCopyToken}
                    className="absolute right-2 bottom-2 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                    title="Copy Token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleRequestToken}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Generate & Sync FCM Token
            </button>
          </div>
        </div>

        {/* Right Column: Trigger Test Notifications */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Send className="w-5 h-5 text-purple-600" />
              Trigger Push Test
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700">Notification Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Notification Title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700">Notification Body</label>
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Notification Body"
                />
              </div>
            </div>

            <button
              onClick={handleSendTestPush}
              disabled={sending || !fcmToken}
              className={`w-full py-3 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sending || !fcmToken
                  ? "bg-slate-300 shadow-none cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Dispatching Push...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Notification to this Device
                </>
              )}
            </button>

            {/* API Result Indicator */}
            {apiResult && (
              <div className={`p-4 rounded-2xl border text-xs ${
                apiResult.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Info className="w-4 h-4" />
                  {apiResult.success ? "FCM Push Successful" : "Push Dispatch Failed"}
                </div>
                <pre className="text-[10px] font-mono mt-1 overflow-x-auto p-2 bg-white/60 rounded-lg">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Console / Diagnostics Monitor */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Terminal className="w-4 h-4 text-emerald-400" />
              DIAGNOSTIC EVENTS CONSOLE
            </h2>

            <div className="h-48 overflow-y-auto font-mono text-xs space-y-2.5 pr-2">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">Monitoring diagnostic logs...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start leading-tight">
                    <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                    <span className={
                      log.type === "success" ? "text-emerald-400 font-bold" :
                      log.type === "error" ? "text-rose-400 font-bold" :
                      log.type === "warn" ? "text-amber-400 font-bold" : "text-slate-300"
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function TestNotificationPage() {
  return (
    <Providers>
      <TestNotificationPageContent />
    </Providers>
  )
}
