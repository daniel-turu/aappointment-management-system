"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { changePassword } from "@/actions/users"
import { ShieldCheck, AlertCircle, X, KeyRound } from "lucide-react"

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.")
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const res = await changePassword({ currentPassword, newPassword })
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg("Password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setIsOpen(false)
          setSuccessMsg("")
        }, 1500)
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        type="button"
        variant="outline" 
        className="border-zinc-200 hover:bg-zinc-50 text-zinc-700 flex items-center gap-2"
      >
        <KeyRound className="w-4 h-4" />
        <span>Change Password</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-lg border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-900" />
                <span>Update Password</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="current-pass">Current Password</Label>
                <Input
                  id="current-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pass">New Password</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass">Confirm New Password</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-900 hover:bg-purple-800 text-white"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
