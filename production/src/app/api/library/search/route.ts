import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/data/library";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    const documents = await searchDocuments(query);
    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search documents" },
      { status: 500 },
    );
  }
}
