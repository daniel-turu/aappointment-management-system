"use client"

import { useState, useTransition } from "react"
import { Search, ShieldAlert, ShieldCheck, UserMinus, UserCheck, RefreshCw, Trash2 } from "lucide-react"
import { toggleUserStatus, getRegisteredStudents, deleteUserAccount } from "@/actions/admin"

export default function AdminUserList({ initialStudents }) {
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    startTransition(async () => {
      const results = await getRegisteredStudents(search)
      setStudents(results)
    })
  }

  const handleToggle = async (userId) => {
    setActionId(userId)
    const res = await toggleUserStatus(userId)
    if (res.success) {
      setStudents(prev =>
        prev.map(s => (s.id === userId ? { ...s, isActive: res.isActive } : s))
      )
    } else {
      alert(res.error || "Failed to update user status")
    }
    setActionId(null)
  }

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Warning: This will permanently delete ${student.name}'s account and ALL associated clinic appointment history. This action CANNOT be undone.\n\nAre you sure you want to proceed?`
    )
    if (!confirmed) return

    setActionId(student.id)
    const res = await deleteUserAccount(student.id)
    if (res.success) {
      setStudents(prev => prev.filter(s => s.id !== student.id))
    } else {
      alert(res.error || "Failed to delete student account")
    }
    setActionId(null)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 border border-zinc-200 rounded-xl shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
        </form>
        <button
          onClick={() => {
            setSearch("")
            startTransition(async () => {
              const results = await getRegisteredStudents("")
              setStudents(results)
            })
          }}
          className="flex items-center space-x-2 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          <span>Reset Search</span>
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Student ID / Dept</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    No registered students found matching your criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{student.name}</div>
                      <div className="text-xs text-zinc-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-700 font-medium">{student.studentId}</div>
                      <div className="text-xs text-zinc-500">{student.department}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      <div>Phone: {student.phone}</div>
                      <div>Joined: {student.createdAt}</div>
                    </td>
                    <td className="px-6 py-4">
                      {student.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          Frozen
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleToggle(student.id)}
                        disabled={actionId === student.id}
                        className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          student.isActive
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100/70"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/70"
                        } disabled:opacity-50`}
                      >
                        {actionId === student.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : student.isActive ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Freeze Account</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate Account</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(student)}
                        disabled={actionId === student.id}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                        title="Permanently Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
