import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentForProcessing,
  updateDocumentMeta,
} from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { ingestDocument } from "@/lib/data/admin/ingest";

/**
 * Manual re-ingest trigger (via workspace UI or admin action).
 * Uses the shared ingest helper which auto-structures, embeds, and persists.
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
      { error: "Document has no content to process" },
      { status: 400 },
    );
  }

  try {
    const result = await ingestDocument(params.id, doc.tenantId, doc.content, {
      title: doc.title,
      sector: doc.sector || undefined,
      framework: doc.framework,
      riskLevel: doc.riskLevel || undefined,
      allowedRoles: doc.rolesRelevant,
      siteIds: doc.siteIds,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Ingestion failed", detail: err.message },
      { status: 500 },
    );
  }
}
