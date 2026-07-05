import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fcmToken } = await req.json();

    if (!fcmToken) return NextResponse.json({ error: "Token is required" }, { status: 400 });

    await connectDB();
    await User.findByIdAndUpdate(token.id, { fcmToken });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update token" }, { status: 500 });
  }
}
