import { NextResponse } from "next/server";
import { checkAndTriggerArrivalNotifications } from "@/actions/appointments";

export async function GET() {
  try {
    const result = await checkAndTriggerArrivalNotifications();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await checkAndTriggerArrivalNotifications();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
