import { NextRequest, NextResponse } from "next/server";
import { isDocumentAcknowledged } from "@/lib/data/library";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    const acknowledged = await isDocumentAcknowledged(documentId);

    return NextResponse.json({ data: { acknowledged } });
  } catch (error) {
    console.error("Check acknowledgement error:", error);
    return NextResponse.json(
      { error: "Failed to check acknowledgement" },
      { status: 500 },
    );
  }
}
