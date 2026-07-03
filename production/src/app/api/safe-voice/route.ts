import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitSafeVoice } from "@/lib/data/feedback";

const schema = z.object({
  category: z.enum(["near-miss", "improvement", "psychosocial", "facility", "other"]),
  message: z.string().min(1),
  anonymous: z.boolean().optional().default(true),
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

    const { category, message, anonymous } = result.data;
    const { id } = await submitSafeVoice({ category, message, anonymous });

    // No activity log for safe-voice to maintain anonymity

    return NextResponse.json({ data: { id, success: true } });
  } catch (error) {
    console.error("Safe-voice submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit safe-voice" },
      { status: 500 }
    );
  }
}
