import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { ingestDocument } from "@/lib/data/admin/ingest";
import { forwardFileToExpress } from "@/lib/server/internal-express";

/**
 * Upload a file (pdf/docx/txt/md), extract text via the Express pipeline,
 * create a draft document, and auto-ingest.
 *
 * The file is never persisted to disk on Next.js or Supabase storage;
 * only the extracted text is kept.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titleField = (formData.get("title") as string) || "";
    const documentType = (formData.get("documentType") as string) || "policy";
    const category = (formData.get("category") as string) || null;
    const sector = (formData.get("sector") as string) || null;
    const riskLevel = (formData.get("riskLevel") as string) || "medium";
    const frameworkRaw = (formData.get("framework") as string) || "";
    const tagsRaw = (formData.get("tags") as string) || "";
    const acknowledgementRequired =
      formData.get("acknowledgementRequired") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // 1. Extract text from file via Express
    const extractResult = await forwardFileToExpress(
      "/api/documents/extract",
      file,
    );
    if (!extractResult.ok) {
      return NextResponse.json(
        { error: "Extraction failed", detail: extractResult.error },
        { status: extractResult.status },
      );
    }

    const extracted = extractResult.data;
    const text = extracted.text;
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "File contains no extractable text" },
        { status: 422 },
      );
    }

    // Derive title from filename if not provided
    const title =
      titleField.trim() ||
      extracted.filename
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]/g, " ")
        .trim() ||
      "Untitled document";

    const framework = frameworkRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 2. Create document with raw extracted text
    const createResult = await createDocument({
      title,
      documentType,
      category: category || undefined,
      sector: sector || undefined,
      riskLevel: riskLevel as "low" | "medium" | "high",
      framework,
      tags,
      content: text,
      acknowledgementRequired,
    });

    if (!createResult) {
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 },
      );
    }

    // 3. Auto-ingest (AI structure + embed)
    try {
      await ingestDocument(
        createResult.id,
        admin.tenantId,
        text,
        {
          title,
          sector: sector || undefined,
          framework,
          riskLevel: riskLevel || undefined,
        },
      );
    } catch (err: any) {
      console.error("Auto-ingest failed after upload:", err.message);
      // Document exists; user can manually re-ingest if needed
    }

    await recordAdminAction({
      action: "document.create",
      targetType: "document",
      targetId: createResult.id,
      summary: `Uploaded "${title}" (${extracted.filename})`,
      meta: { filename: extracted.filename, size: extracted.size },
    });

    return NextResponse.json({ data: { id: createResult.id } }, { status: 201 });
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
