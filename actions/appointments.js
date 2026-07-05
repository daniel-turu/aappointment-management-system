"use server"

import connectDB from "@/lib/mongodb"
import Department from "@/models/Department"
import Staff from "@/models/Staff"
import Appointment from "@/models/Appointment"
import Patient from "@/models/Patient"
import User from "@/models/User"
import { auth } from "@/lib/auth"
import { createNotification } from "./notifications"

export async function getDepartments() {
  await connectDB()
  const depts = await Department.find({ isActive: true }).lean()
  return depts.map(d => ({ id: d._id.toString(), name: d.name, description: d.description }))
}

export async function getStaffByDepartment(departmentId) {
  if (!departmentId) return []
  await connectDB()
  
  // Find staff in this department and populate their user info (for name)
  const staffList = await Staff.find({ departmentId }).populate('userId', 'name').lean()
  
  return staffList.map(s => ({
    id: s._id.toString(),
    name: s.userId ? `Dr. ${s.userId.name}` : "Unknown Doctor",
    specialization: s.specialization || "General"
  }))
}

export async function getAvailableTimeSlots(date, staffId, departmentId) {
  if (!date) return []
  
  await connectDB()
  
  // Basic daily slots (9 AM to 4 PM, 30 min intervals)
  const allSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"
  ]

  let staffIdsToCheck = []

  if (staffId) {
    staffIdsToCheck = [staffId]
  } else if (departmentId) {
    // Find all staff in this department
    const deptStaff = await Staff.find({ departmentId }).select("_id").lean()
    staffIdsToCheck = deptStaff.map(s => s._id.toString())
  }

  // If no doctors are registered in this clinic department, allow booking any slot (fallback)
  if (staffIdsToCheck.length === 0) {
    return allSlots
  }

  // Find existing appointments for these doctors on this date
  const bookedAppointments = await Appointment.find({
    staffId: { $in: staffIdsToCheck },
    date,
    status: { $nin: ["cancelled", "rejected"] }
  }).lean()

  const bookedCountPerSlot = {}
  bookedAppointments.forEach(a => {
    bookedCountPerSlot[a.time] = (bookedCountPerSlot[a.time] || 0) + 1
  })

  // A slot is available if at least one doctor in the department is free at that time
  const availableSlots = allSlots.filter(slot => {
    const bookedCount = bookedCountPerSlot[slot] || 0
    return bookedCount < staffIdsToCheck.length
  })
  
  return availableSlots
}

export async function getPatientProfile() {
  try {
    const session = await auth()
    if (!session) {
      return null
    }

    await connectDB()
    const patient = await Patient.findOne({ userId: session.user.id }).lean()
    if (!patient) return null

    return {
      id: patient._id.toString(),
      studentId: patient.studentId || "",
      gender: patient.gender || "",
      age: patient.age || "",
      address: patient.address || "",
      faculty: patient.faculty || "",
      department: patient.department || "",
      emergencyContact: patient.emergencyContact || ""
    }
  } catch (error) {
    console.error("Failed to get patient profile:", error)
    return null
  }
}

export async function bookAppointment(data) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    // Find the patient record linked to this user session
    const patient = await Patient.findOne({ userId: session.user.id })
    if (!patient) {
      return { error: "Patient profile not found" }
    }

    // Verify user account is not frozen/blocked
    const user = await User.findById(session.user.id)
    if (!user || !user.isActive) {
      return { error: "Your account is frozen or blocked. Please contact the clinic administrator." }
    }

    const { reason, faculty, department } = data

    if (!reason || reason.trim() === "") {
      return { error: "Please describe what is bothering you or why you want to visit." }
    }

    // Update patient's faculty and department if provided
    if (faculty || department) {
      await Patient.updateOne(
        { _id: patient._id },
        { 
          $set: { 
            ...(faculty ? { faculty } : {}),
            ...(department ? { department } : {})
          } 
        }
      )
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      reason,
      status: "pending"
    })

    // Notify all staff and admins of new booking
    const staffUsers = await User.find({ role: { $in: ["staff", "admin"] } })
    for (const staff of staffUsers) {
      await createNotification(
        staff._id,
        "New Appointment Requested",
        `Student ${session.user.name} has requested an appointment for ${department || "General Clinic"}.`,
        appointment._id
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Booking error:", error)
    return { error: "Failed to submit appointment request." }
  }
}

export async function getPatientAppointments() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return []
    }

    await connectDB()

    const patient = await Patient.findOne({ userId: session.user.id })
    if (!patient) {
      return []
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: "staffId",
        populate: { path: "userId", select: "name" }
      })
      .populate("departmentId")
      .sort({ date: 1, time: 1 })
      .lean()

    return appointments.map(a => ({
      id: a._id.toString(),
      date: a.date || null,
      time: a.time || null,
      status: a.status,
      reason: a.reason || "",
      rejectionReason: a.rejectionReason || "",
      doctorName: a.doctorName || (a.staffId?.userId?.name ? `Dr. ${a.staffId.userId.name}` : "Pending Assignment"),
      departmentName: a.departmentName || a.departmentId?.name || "Pending Review",
      createdAt: a.createdAt.toISOString(),
      shiftRequested: a.shiftRequested || false,
      requestedTime: a.requestedTime || "",
      requestedDate: a.requestedDate || "",
      shiftReason: a.shiftReason || "",
      shiftStatus: a.shiftStatus || "none",
      arrivalStatus: a.arrivalStatus || "none",
      arrivalCheckCount: a.arrivalCheckCount || 0,
      arrivalEta: a.arrivalEta || ""
    }))
  } catch (error) {
    console.error("Error fetching patient appointments:", error)
    return []
  }
}

export async function cancelAppointment(appointmentId) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const patient = await Patient.findOne({ userId: session.user.id })
    if (!patient) {
      return { error: "Patient profile not found" }
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId: patient._id })
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    if (["completed", "cancelled", "rejected"].includes(appointment.status)) {
      return { error: `Cannot cancel a ${appointment.status} appointment.` }
    }

    appointment.status = "cancelled"
    await appointment.save()

    return { success: true }
  } catch (error) {
    console.error("Cancel appointment error:", error)
    return { error: "Failed to cancel appointment" }
  }
}

export async function getPendingAppointments() {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return []
    }

    await connectDB()

    const appointments = await Appointment.find({ status: "pending" })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" }
      })
      .sort({ createdAt: -1 })
      .lean()

    return appointments.map(a => ({
      id: a._id.toString(),
      reason: a.reason || "No reason specified",
      createdAt: a.createdAt.toISOString(),
      patient: a.patientId ? {
        id: a.patientId._id.toString(),
        name: a.patientId.userId?.name || "Unknown Patient",
        email: a.patientId.userId?.email || "",
        phone: a.patientId.userId?.phone || "",
        school: a.patientId.faculty || "Not set",
        department: a.patientId.department || "Not set",
        studentId: a.patientId.studentId || "Not set",
        gender: a.patientId.gender || "Not set",
        age: a.patientId.age || "Not set"
      } : null
    }))
  } catch (error) {
    console.error("Error fetching pending appointments:", error)
    return []
  }
}

export async function triageAppointment(appointmentId, data) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    const { departmentName, doctorName, date, time } = data
    if (!departmentName || !date || !time) {
      return { error: "Missing required triage fields (Department, Date, Time)" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return { error: "Appointment request not found" }
    }

    appointment.departmentName = departmentName
    appointment.doctorName = doctorName || undefined
    appointment.date = date
    appointment.time = time
    appointment.status = "approved"

    await appointment.save()

    return { success: true }
  } catch (error) {
    console.error("Triage error:", error)
    return { error: "Failed to schedule and approve appointment" }
  }
}

export async function rejectAppointment(appointmentId, rejectionReason) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      return { error: "Rejection reason is required" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return { error: "Appointment request not found" }
    }

    appointment.status = "rejected"
    appointment.rejectionReason = rejectionReason

    await appointment.save()

    return { success: true }
  } catch (error) {
    console.error("Rejection error:", error)
    return { error: "Failed to reject appointment" }
  }
}

export async function getTodayQueue() {
  try {
    await connectDB()

    const todayDateStr = new Date().toISOString().split("T")[0]

    // Fetch all appointments for today that are approved (waiting), serving, completed, or no-show
    const appointmentsRaw = await Appointment.find({
      date: todayDateStr,
      status: { $in: ["approved", "serving", "completed", "no_show"] }
    })
    .populate({
      path: "patientId",
      populate: { path: "userId", select: "name" }
    })
    .sort({ time: 1 })
    .lean()

    // Map database results
    const mappedQueue = appointmentsRaw.map((a, index) => ({
      id: a._id.toString(),
      queueNumber: index + 1,
      studentName: a.patientId?.userId?.name || "Unknown Student",
      departmentName: a.departmentName || "General Clinic",
      time: a.time,
      status: a.status,
      reason: a.reason || "General Checkup",
      arrivalStatus: a.arrivalStatus || "none",
      arrivalCheckCount: a.arrivalCheckCount || 0,
      arrivalEta: a.arrivalEta || ""
    }))

    if (mappedQueue.length === 0) {
      // Mock today's queue for demonstration/seed
      return [
        {
          id: "mock1",
          queueNumber: 1,
          studentName: "Daniel James",
          departmentName: "Computer Science",
          time: "09:00",
          status: "completed",
          reason: "Fever and Headache"
        },
        {
          id: "mock2",
          queueNumber: 2,
          studentName: "Aishat Yusuf",
          departmentName: "Cyber Security",
          time: "10:30",
          status: "serving",
          reason: "Medical Certificate Clearance"
        },
        {
          id: "mock3",
          queueNumber: 3,
          studentName: "Emeka Obi",
          departmentName: "Mechanical Engineering",
          time: "11:00",
          status: "approved",
          reason: "Eye checkup"
        },
        {
          id: "mock4",
          queueNumber: 4,
          studentName: "Blessing Okon",
          departmentName: "Electrical Engineering",
          time: "11:30",
          status: "approved",
          reason: "General Consultation"
        },
        {
          id: "mock5",
          queueNumber: 5,
          studentName: "Musa Ibrahim",
          departmentName: "Civil Engineering",
          time: "13:00",
          status: "no_show",
          reason: "Dental Pain"
        }
      ]
    }

    return mappedQueue
  } catch (error) {
    console.error("Failed to fetch today's queue:", error)
    return []
  }
}

export async function updateQueueStatus(appointmentId, status) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return { error: "Appointment not found" }
    }



    appointment.status = status
    await appointment.save()

    return { success: true }
  } catch (error) {
    console.error("Failed to update queue status:", error)
    return { error: "Failed to update queue status." }
  }
}

export async function requestTimeShift(appointmentId, requestedTime, requestedDate, shiftReason) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    // Verify patient owns this appointment
    const patient = await Patient.findOne({ userId: session.user.id })
    if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
      return { error: "Unauthorized access to appointment." }
    }

    appointment.shiftRequested = true
    appointment.requestedTime = requestedTime
    appointment.requestedDate = requestedDate || appointment.date
    appointment.shiftReason = shiftReason
    appointment.shiftStatus = "pending"

    await appointment.save()

    // Notify Secretary/Staff
    const staffUsers = await User.find({ role: { $in: ["staff", "admin"] } })
    for (const staff of staffUsers) {
      await createNotification(
        staff._id,
        "Time Shift Request",
        `Student ${session.user.name} requested to move their appointment on ${appointment.date} to ${requestedTime} because: "${shiftReason}".`,
        appointment._id
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to request time shift:", error)
    return { error: "Failed to request time shift." }
  }
}

export async function processTimeShift(appointmentId, action) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId).populate({
      path: "patientId",
      populate: { path: "userId" }
    })
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    const studentUserId = appointment.patientId?.userId?._id

    if (action === "approve") {
      const oldTime = appointment.time
      const newTime = appointment.requestedTime
      const newDate = appointment.requestedDate

      appointment.time = newTime
      if (newDate) {
        appointment.date = newDate
      }
      appointment.shiftRequested = false
      appointment.shiftStatus = "approved"

      await appointment.save()

      if (studentUserId) {
        await createNotification(
          studentUserId,
          "Time Shift Approved",
          `Your request to reschedule your appointment from ${oldTime} to ${newTime} on ${appointment.date} has been approved.`,
          appointment._id
        )
      }
    } else {
      appointment.shiftRequested = false
      appointment.shiftStatus = "rejected"

      await appointment.save()

      if (studentUserId) {
        await createNotification(
          studentUserId,
          "Time Shift Declined",
          `Your request to reschedule your appointment was declined. Please attend at your originally scheduled time: ${appointment.time}.`,
          appointment._id
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to process time shift:", error)
    return { error: "Failed to process time shift." }
  }
}

export async function getPendingTimeShifts() {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return []
    }

    await connectDB()

    const appointments = await Appointment.find({ shiftRequested: true, shiftStatus: "pending" })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" }
      })
      .sort({ updatedAt: 1 })
      .lean()

    return appointments.map(a => ({
      id: a._id.toString(),
      reason: a.reason || "No reason specified",
      originalDate: a.date,
      originalTime: a.time,
      requestedDate: a.requestedDate,
      requestedTime: a.requestedTime,
      shiftReason: a.shiftReason || "No shift reason specified",
      patient: a.patientId ? {
        id: a.patientId._id.toString(),
        name: a.patientId.userId?.name || "Unknown Patient",
        email: a.patientId.userId?.email || "",
        phone: a.patientId.userId?.phone || "",
        studentId: a.patientId.studentId || "Not set",
        department: a.patientId.department || "Not set"
      } : null
    }))
  } catch (error) {
    console.error("Error fetching pending time shifts:", error)
    return []
  }
}

export async function triggerArrivalCheck(appointmentId) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId).populate({
      path: "patientId",
      populate: { path: "userId" }
    })
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    appointment.arrivalStatus = "checking"
    await appointment.save()

    const studentUserId = appointment.patientId?.userId?._id
    if (studentUserId) {
      await createNotification(
        studentUserId,
        "Are you at the clinic?",
        "Please confirm if you have arrived at the FUTMinna Health Centre for your scheduled appointment.",
        appointment._id
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to trigger arrival check:", error)
    return { error: "Failed to trigger arrival check." }
  }
}

export async function respondToArrivalCheck(appointmentId, responseType, etaMinutes = 0) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId).populate({
      path: "patientId",
      populate: { path: "userId" }
    })
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    // Verify patient owns this appointment
    const patient = await Patient.findOne({ userId: session.user.id })
    if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
      return { error: "Unauthorized access to appointment." }
    }

    const staffUsers = await User.find({ role: { $in: ["staff", "admin"] } })

    if (responseType === "yes") {
      appointment.arrivalStatus = "arrived"
      await appointment.save()

      // Notify staff
      for (const staff of staffUsers) {
        await createNotification(
          staff._id,
          "Student Arrived",
          `Student ${session.user.name} has checked in and is waiting in the lobby.`,
          appointment._id
        )
      }
    } else {
      // User says not yet, choosing an ETA
      const currentCount = (appointment.arrivalCheckCount || 0) + 1
      appointment.arrivalCheckCount = currentCount
      appointment.arrivalEta = `${etaMinutes}m`

      if (currentCount >= 3) {
        appointment.arrivalStatus = "no_show_reported"
        await appointment.save()

        // Notify staff of flag
        for (const staff of staffUsers) {
          await createNotification(
            staff._id,
            "No-Show Flagged",
            `Student ${session.user.name} was asked 3 times and is still not at the clinic.`,
            appointment._id
          )
        }
      } else {
        appointment.arrivalStatus = "delayed"
        await appointment.save()

        // Notify staff of delay
        for (const staff of staffUsers) {
          await createNotification(
            staff._id,
            "Student Delayed",
            `Student ${session.user.name} says they are delayed and will be there in ${etaMinutes} mins. (Attempt ${currentCount}/3)`,
            appointment._id
          )
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to respond to arrival check:", error)
    return { error: "Failed to respond to arrival check." }
  }
}

export async function retryArrivalCheck(appointmentId) {
  try {
    const session = await auth()
    if (!session || !["staff", "admin"].includes(session.user.role)) {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const appointment = await Appointment.findById(appointmentId).populate({
      path: "patientId",
      populate: { path: "userId" }
    })
    if (!appointment) {
      return { error: "Appointment not found" }
    }

    // Reset counter, set to checking
    appointment.arrivalCheckCount = 0
    appointment.arrivalStatus = "checking"
    appointment.arrivalEta = ""
    await appointment.save()

    const studentUserId = appointment.patientId?.userId?._id
    if (studentUserId) {
      await createNotification(
        studentUserId,
        "Are you at the clinic? (Retry)",
        "The secretary has reset your arrival check. Please confirm if you are now at the clinic.",
        appointment._id
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to retry arrival check:", error)
    return { error: "Failed to retry arrival check." }
  }
}
