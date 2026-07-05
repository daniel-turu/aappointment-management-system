import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { messaging } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    // We allow either authenticated users or explicitly provided tokens for testing purposes
    const { title, body, customToken } = await req.json();

    let targetFcmToken = customToken;

    if (!targetFcmToken && token) {
      await connectDB();
      const user = await User.findById(token.id);
      targetFcmToken = user?.fcmToken;
    }

    if (!targetFcmToken) {
      return NextResponse.json(
        { error: "No target FCM token found. Please register or provide a token." },
        { status: 400 }
      );
    }

    if (!messaging) {
      return NextResponse.json(
        { error: "Firebase messaging SDK is not initialized on the server. Check your FIREBASE_* env variables." },
        { status: 500 }
      );
    }

    console.log(`[TEST FCM] Attempting to send push to token: ${targetFcmToken.substring(0, 10)}...`);

    const messagePayload = {
      token: targetFcmToken,
      notification: {
        title: title || "Test Push Notification",
        body: body || "This is a test push notification from FUTMinna Health Centre!",
      },
      data: {
        url: "/test-notification",
        test: "true",
      },
    };

    const response = await messaging.send(messagePayload);
    
    console.log(`[TEST FCM SUCCESS] Response: ${response}`);

    return NextResponse.json({
      success: true,
      messageId: response,
      fcmTokenUsed: targetFcmToken
    });
  } catch (error) {
    console.error("[TEST FCM ERROR] Failed to send push:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch push notification" },
      { status: 500 }
    );
  }
}
