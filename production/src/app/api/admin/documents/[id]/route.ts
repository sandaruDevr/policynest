import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteDocument,
  getAdminDocument,
  updateDocumentMeta,
} from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { ingestDocument } from "@/lib/data/admin/ingest";

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  documentType: z.string().max(80).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  pillar: z.string().max(120).nullable().optional(),
  sector: z.string().max(80).nullable().optional(),
  riskLevel: z.string().max(40).nullable().optional(),
  framework: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().max(4000).nullable().optional(),
  content: z.string().optional(),
  acknowledgementRequired: z.boolean().optional(),
  rolesRelevant: z.array(z.string()).optional(),
  siteIds: z.array(z.string().uuid()).optional(),
  effectiveDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  reviewDueAt: z.string().nullable().optional(),
  changeReason: z.string().max(500).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await getAdminDocument(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: doc });
}

export async function PATCH(
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ok = await updateDocumentMeta(params.id, parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Auto-re-ingest when content is saved (Content tab always sends content).
  if (parsed.data.content && parsed.data.content.trim().length > 0) {
    try {
      const doc = await getAdminDocument(params.id);
      if (doc) {
        await ingestDocument(params.id, admin.tenantId, parsed.data.content, {
          title: doc.title,
          sector: doc.sector || undefined,
          framework: doc.framework,
          riskLevel: doc.riskLevel || undefined,
          allowedRoles: doc.rolesRelevant,
          siteIds: doc.siteIds,
        });
      }
    } catch {
      // Non-blocking: metadata saved even if ingest fails
    }
  }

  await recordAdminAction({
    action: "document.update",
    targetType: "document",
    targetId: params.id,
    summary: parsed.data.changeReason || "Updated document metadata",
  });

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await deleteDocument(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "document.delete",
    targetType: "document",
    targetId: params.id,
    summary: "Deleted document",
  });

  return NextResponse.json({ data: { success: true } });
}
