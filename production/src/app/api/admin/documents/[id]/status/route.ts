import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminDocument,
  setDocumentStatus,
  snapshotVersion,
} from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";

const schema = z.object({
  status: z.enum([
    "draft",
    "in_review",
    "approved",
    "published",
    "superseded",
    "archived",
  ]),
});

/**
 * Transition a document through its governance lifecycle. Publishing enforces
 * that the document has been ingested and carries no critical validation
 * blockers, then snapshots a version and propagates audience to chunks.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status } = parsed.data;
  const doc = await getAdminDocument(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Publish gating: must be ingested + no critical validation blockers.
  if (status === "published") {
    if (doc.sections.length === 0) {
      return NextResponse.json(
        { error: "Document must be ingested before publishing" },
        { status: 422 },
      );
    }
    const blockers = doc.latestValidation?.blockers ?? [];
    if (blockers.length > 0 || doc.latestValidation?.status === "fail") {
      return NextResponse.json(
        {
          error: "Publishing blocked by critical validation issues",
          blockers,
        },
        { status: 422 },
      );
    }
    // Snapshot the published state for lineage.
    await snapshotVersion(params.id, "human", "Published to staff");
  }

  const ok = await setDocumentStatus(params.id, status);
  if (!ok) {
    return NextResponse.json(
      { error: "Status transition failed" },
      { status: 500 },
    );
  }

  await recordAdminAction({
    action: `document.${status}`,
    targetType: "document",
    targetId: params.id,
    summary: `Status -> ${status}`,
  });

  return NextResponse.json({ data: { success: true, status } });
}
