import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { markAsRead, markAllAsRead } from "@/lib/data/notifications";

const schema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id, all } = result.data;

    let success: boolean;
    if (all) {
      success = await markAllAsRead();
    } else if (id) {
      success = await markAsRead(id);
    } else {
      return NextResponse.json(
        { error: "Must provide id or set all to true" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { success } });
  } catch (error) {
    console.error("Notification mark-as-read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
