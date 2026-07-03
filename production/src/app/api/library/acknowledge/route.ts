import { NextRequest, NextResponse } from "next/server";
import { acknowledgeDocument, unacknowledgeDocument } from "@/lib/data/library";
import { appendActivity } from "@/lib/data/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, version, acknowledged } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    // Toggle: if acknowledged is true, unacknowledge; otherwise acknowledge
    if (acknowledged) {
      await unacknowledgeDocument(documentId);
    } else {
      if (!version) {
        return NextResponse.json(
          { error: "Missing version for acknowledgement" },
          { status: 400 },
        );
      }
      await acknowledgeDocument(documentId, version);
      // Append activity (non-blocking)
      appendActivity("policy-acknowledged", `Acknowledged document ${documentId}`, {
        targetId: documentId,
      }).catch(() => {});
    }

    return NextResponse.json({ data: { acknowledged: !acknowledged } });
  } catch (error) {
    console.error("Acknowledgement error:", error);
    return NextResponse.json(
      { error: "Failed to toggle acknowledgement" },
      { status: 500 },
    );
  }
}
