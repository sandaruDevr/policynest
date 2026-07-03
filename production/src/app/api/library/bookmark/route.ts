import { NextRequest, NextResponse } from "next/server";
import { toggleBookmark } from "@/lib/data/library";
import { appendActivity } from "@/lib/data/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    const bookmarked = await toggleBookmark(documentId);

    // Append activity (non-blocking)
    appendActivity("bookmark-toggle", `${bookmarked ? "Bookmarked" : "Removed bookmark"} document ${documentId}`, {
      targetId: documentId,
    }).catch(() => {});

    return NextResponse.json({ data: { bookmarked } });
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 },
    );
  }
}
