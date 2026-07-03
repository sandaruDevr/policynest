import { NextResponse } from "next/server";
import { clearConversationHistory } from "@/lib/data/assistant";

export async function DELETE() {
  try {
    await clearConversationHistory();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear conversation error:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation history" },
      { status: 500 },
    );
  }
}
