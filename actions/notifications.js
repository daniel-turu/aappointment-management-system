"use server"

import connectDB from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import Notification from "@/models/Notification"
import User from "@/models/User"
import { messaging } from "@/lib/firebase-admin"
import { auth } from "@/lib/auth"

export async function createNotification(userId, title, message, appointmentId = null) {
  await connectDB()

  const notification = await Notification.create({
    userId,
    title,
    message,
    appointmentId
  })

  // Attempt to send push notification
  const user = await User.findById(userId)
  if (user && user.fcmToken && messaging) {
    try {
      let deepLink = '/dashboard'
      if (user.role === 'patient') {
        deepLink = appointmentId ? `/dashboard/patient/appointments` : `/dashboard/patient`
      } else if (['staff', 'admin'].includes(user.role)) {
        deepLink = appointmentId ? `/dashboard/staff?appointmentId=${appointmentId}` : `/dashboard/staff`
      }

      await messaging.send({
        token: user.fcmToken,
        notification: {
          title,
          body: message
        },
        data: {
          url: deepLink
        }
      })
      console.log(`[FCM SUCCESS] Push sent to ${user.name} (${user.role}) - URL: ${deepLink}`)
    } catch (error) {
      console.error("[FCM ERROR] Failed to send:", error)
    }
  } else {
    console.log(`[FCM SKIPPED] No push sent to ${user?.name || userId}. Reason: ${!user ? 'User not found' : !user.fcmToken ? 'No fcmToken registered for user' : 'Firebase messaging Admin SDK not initialized'}`)
  }

  return notification
}

export async function getNotifications() {
  try {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    await connectDB()

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)

    return JSON.parse(JSON.stringify(notifications))
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    await connectDB()

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session.user.id },
      { $set: { isRead: true } }
    )

    return { success: true }
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return { error: "Failed to mark as read" }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    await connectDB()

    await Notification.updateMany(
      { userId: session.user.id, isRead: false },
      { $set: { isRead: true } }
    )

    return { success: true }
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return { error: "Failed to mark all as read" }
  }
}
