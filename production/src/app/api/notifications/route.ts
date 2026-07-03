import { NextResponse } from "next/server";
import { list } from "@/lib/data/notifications";

export async function GET() {
  try {
    const notifications = await list();
    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
