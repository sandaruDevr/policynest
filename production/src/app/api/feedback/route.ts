import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitFeedback } from "@/lib/data/feedback";
import { appendActivity } from "@/lib/data/activity";

const schema = z.object({
  category: z.string().min(1),
  message: z.string().min(1),
  anonymous: z.boolean().optional().default(false),
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
    const { id } = await submitFeedback({ category, message, anonymous });

    // Append activity (non-blocking) - only for non-anonymous feedback
    if (!anonymous) {
      appendActivity("feedback-submitted", `Submitted ${category} feedback`, {
        targetId: id,
      }).catch(() => {});
    }

    return NextResponse.json({ data: { id, success: true } });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
