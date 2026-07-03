import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentForProcessing,
  saveValidation,
} from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { callInternalExpress } from "@/lib/server/internal-express";

interface ValidationResult {
  status: string;
  score: number | null;
  summary: string;
  frameworks: unknown;
  gaps: unknown;
  flags: unknown;
  blockers: string[];
}

/**
 * Run AI compliance validation against the document's content and persist the
 * result. Surfaced in the governance workspace; blockers gate publishing.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await getDocumentForProcessing(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!doc.content || doc.content.trim().length === 0) {
    return NextResponse.json(
      { error: "Document has no content to validate" },
      { status: 400 },
    );
  }

  const result = await callInternalExpress<ValidationResult>(
    "/api/documents/validate",
    {
      title: doc.title,
      content: doc.content,
      document_type: doc.documentType,
      frameworks: doc.framework,
      sector: doc.sector,
      risk_level: doc.riskLevel,
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: "Validation failed", detail: result.error },
      { status: result.status },
    );
  }

  const v = result.data;
  await saveValidation(params.id, doc.version, {
    status: v.status,
    score: v.score,
    summary: v.summary,
    frameworks: v.frameworks,
    gaps: v.gaps,
    flags: v.flags,
    blockers: v.blockers,
    model: "openai",
  });

  await recordAdminAction({
    action: "document.validate",
    targetType: "document",
    targetId: params.id,
    summary: `Validation: ${v.status}${v.score != null ? ` (${v.score})` : ""}`,
    meta: { status: v.status, blockers: v.blockers?.length ?? 0 },
  });

  return NextResponse.json({ data: v });
}
