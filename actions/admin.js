"use server"

import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Appointment from "@/models/Appointment"
import Patient from "@/models/Patient"
import { auth } from "@/lib/auth"

export async function getAdminMetrics() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized")
    }

    await connectDB()

    // 1. Basic Stats
    const totalPatients = await Patient.countDocuments()
    const totalAppointments = await Appointment.countDocuments()
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" })
    const approvedAppointments = await Appointment.countDocuments({ status: "approved" })

    // 2. Department performance
    const departmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: "$departmentName",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: { $ifNull: ["$_id", "Pending Review"] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ])

    // 3. Appointments trend (Last 7 Days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const appointmentsTrendRaw = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // 4. Student registrations by department (Current Year)
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)

    const registrationsRaw = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          department: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          students: "$count"
        }
      },
      { $sort: { students: -1 } }
    ])

    // Generate last 7 days calendar
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const label = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })

      // Find trend matching this date
      const trendMatch = appointmentsTrendRaw.find(t => t._id === dateStr)
      trendData.push({
        name: label,
        total: trendMatch ? trendMatch.total : 0,
        approved: trendMatch ? trendMatch.approved : 0,
        rejected: trendMatch ? trendMatch.rejected : 0
      })
    }

    // Ensure we have some data for display if database is completely fresh
    const hasTrendData = trendData.some(t => t.total > 0)
    const displayTrendData = hasTrendData ? trendData : [
      { name: "Mon", total: 4, approved: 3, rejected: 1 },
      { name: "Tue", total: 7, approved: 5, rejected: 2 },
      { name: "Wed", total: 5, approved: 4, rejected: 1 },
      { name: "Thu", total: 10, approved: 8, rejected: 2 },
      { name: "Fri", total: 8, approved: 6, rejected: 1 },
      { name: "Sat", total: 3, approved: 2, rejected: 1 },
      { name: "Sun", total: 6, approved: 5, rejected: 1 }
    ]

    const hasRegData = registrationsRaw.length > 0
    const displayRegistrationData = hasRegData ? registrationsRaw : [
      { name: "Computer Science", students: 54 },
      { name: "Cyber Security", students: 38 },
      { name: "Mechanical Eng.", students: 42 },
      { name: "Electrical Eng.", students: 35 },
      { name: "Telecomms Sci.", students: 24 },
      { name: "Civil Eng.", students: 30 },
      { name: "Chemical Eng.", students: 18 }
    ]

    const hasDeptData = departmentStats.length > 0
    let displayDepartmentData = []
    if (hasDeptData) {
      const mergedMap = {}
      departmentStats.forEach(d => {
        const name = d.name || "Pending Review"
        mergedMap[name] = (mergedMap[name] || 0) + d.count
      })
      displayDepartmentData = Object.entries(mergedMap).map(([name, value]) => ({
        name,
        value
      }))
    } else {
      displayDepartmentData = [
        { name: "General Clinic", value: 12 },
        { name: "Dental Unit", value: 4 },
        { name: "Pharmacy", value: 8 },
        { name: "Laboratory", value: 6 }
      ]
    }

    return {
      stats: {
        totalPatients,
        totalAppointments,
        pendingAppointments,
        approvedAppointments
      },
      trendData: displayTrendData,
      registrationData: displayRegistrationData,
      departmentData: displayDepartmentData
    }
  } catch (error) {
    console.error("Failed to fetch admin metrics:", error)
    return null
  }
}

export async function getRegisteredStudents(searchQuery = "") {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized")
    }

    await connectDB()

    // Find all users with role 'patient'
    let query = { role: "patient" }
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } }
      ]
    }

    const students = await User.find(query).select("name email phone isActive createdAt").lean()

    // Find patient profiles to map student ID
    const studentIds = students.map(s => s._id)
    const patientProfiles = await Patient.find({ userId: { $in: studentIds } }).select("userId studentId department").lean()

    const profileMap = {}
    patientProfiles.forEach(p => {
      profileMap[p.userId.toString()] = p
    })

    return students.map(s => {
      const profile = profileMap[s._id.toString()]
      return {
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        phone: s.phone || "N/A",
        isActive: s.isActive ?? true,
        studentId: profile?.studentId || "N/A",
        department: profile?.department || "N/A",
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A"
      }
    })
  } catch (error) {
    console.error("Failed to fetch students:", error)
    return []
  }
}

export async function toggleUserStatus(userId) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const user = await User.findById(userId)
    if (!user) {
      return { error: "User not found" }
    }

    // Toggle isActive status
    user.isActive = !user.isActive
    await user.save()

    return { success: true, isActive: user.isActive }
  } catch (error) {
    console.error("Failed to toggle user status:", error)
    return { error: "Failed to update account status." }
  }
}

export async function deleteUserAccount(userId) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    // 1. Find User to confirm role and existence
    const user = await User.findById(userId)
    if (!user) {
      return { error: "User not found" }
    }

    if (user.role === "admin") {
      return { error: "Cannot delete administrator accounts." }
    }

    // 2. If patient, find patient profile and delete it, along with appointments
    if (user.role === "patient") {
      const patient = await Patient.findOne({ userId })
      if (patient) {
        // Delete all appointments for this patient
        await Appointment.deleteMany({ patientId: patient._id })
        // Delete patient profile
        await Patient.deleteOne({ _id: patient._id })
      }
    }

    // 3. Delete user document
    await User.deleteOne({ _id: userId })

    return { success: true }
  } catch (error) {
    console.error("Failed to delete user account:", error)
    return { error: "Failed to delete account." }
  }
}

export async function getFilteredAppointments(filters = {}) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const query = {}

    // 1. Status Filter
    if (filters.status && filters.status !== "all") {
      query.status = filters.status
    }

    // 2. Department Filter
    if (filters.department && filters.department !== "all") {
      query.departmentName = filters.department
    }

    // 3. Date Filter
    if (filters.startDate || filters.endDate) {
      query.date = {}
      if (filters.startDate) {
        query.date.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate
      }
    }

    // Fetch all matching appointments, populating the patient and user info
    let appointments = await Appointment.find(query)
      .populate({
        path: "patientId",
        populate: { path: "userId" }
      })
      .sort({ date: -1, time: -1 })

    // 4. Search Filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      appointments = appointments.filter(a => {
        const studentName = a.patientId?.userId?.name || ""
        const studentEmail = a.patientId?.userId?.email || ""
        const studentId = a.patientId?.studentId || ""
        return (
          studentName.toLowerCase().includes(searchLower) ||
          studentEmail.toLowerCase().includes(searchLower) ||
          studentId.toLowerCase().includes(searchLower)
        )
      })
    }

    // Map to simple JSON objects
    const mapped = appointments.map(a => ({
      id: a._id.toString(),
      studentName: a.patientId?.userId?.name || "Unknown",
      studentEmail: a.patientId?.userId?.email || "Unknown",
      studentId: a.patientId?.studentId || "N/A",
      departmentName: a.departmentName || "Pending Review",
      reason: a.reason || "N/A",
      date: a.date || "Not Scheduled",
      time: a.time || "N/A",
      status: a.status,
      doctorName: a.doctorName || "N/A"
    }))

    return mapped
  } catch (error) {
    console.error("Failed to fetch filtered appointments:", error)
    return []
  }
}

