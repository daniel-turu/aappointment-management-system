"use server"

import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Patient from "@/models/Patient"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"

export async function registerPatient(formData) {
  try {
    await connectDB()

    const name = formData.get("name")
    const email = formData.get("email")
    const phone = formData.get("phone")
    const studentId = formData.get("studentId")
    const password = formData.get("password")

    if (!name || !email || !password) {
      return { error: "Name, email, and password are required" }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Check if student ID exists (if provided)
    if (studentId) {
        const existingPatient = await Patient.findOne({ studentId })
        if (existingPatient) {
            return { error: "Student/Staff ID already registered" }
        }
    }

    // Create User (password is hashed automatically by the pre-save hook in the User model)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "patient"
    })

    // Create corresponding Patient profile
    await Patient.create({
      userId: user._id,
      studentId: studentId || null
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register user. Please try again." }
  }
}

export async function updatePatientProfile(data) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "patient") {
      return { error: "Unauthorized" }
    }

    await connectDB()

    const { name, phone, studentId, gender, age, address, faculty, department, emergencyContact } = data

    // Update User Name and Phone
    const user = await User.findById(session.user.id)
    if (!user) {
      return { error: "User not found" }
    }
    if (!user.isActive) {
      return { error: "Your account is frozen or blocked." }
    }
    if (name) user.name = name
    if (phone) user.phone = phone
    await user.save()

    // Update or create Patient profile
    const patientData = {
      studentId,
      gender,
      age: age ? Number(age) : undefined,
      address,
      faculty,
      department,
      emergencyContact
    }

    // Clean up empty fields
    Object.keys(patientData).forEach(key => {
      if (patientData[key] === undefined) {
        delete patientData[key]
      }
    })

    await Patient.findOneAndUpdate(
      { userId: session.user.id },
      { $set: patientData },
      { new: true, upsert: true }
    )

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Failed to update profile. Please try again." }
  }
}

export async function changePassword(data) {
  try {
    const session = await auth()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const { currentPassword, newPassword } = data
    if (!currentPassword || !newPassword) {
      return { error: "Current password and new password are required." }
    }

    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters long." }
    }

    await connectDB()

    const user = await User.findById(session.user.id)
    if (!user) {
      return { error: "User not found" }
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return { error: "Incorrect current password." }
    }

    // Update password (hash is generated automatically by pre-save hook)
    user.password = newPassword
    await user.save()

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    return { error: "Failed to change password." }
  }
}
