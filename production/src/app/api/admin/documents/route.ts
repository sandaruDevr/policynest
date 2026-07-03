import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createDocument,
  listAdminDocuments,
  type DocumentFilters,
} from "@/lib/data/admin/documents";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { ingestDocument } from "@/lib/data/admin/ingest";
import type { AdminDocumentStatus, DocumentOrigin } from "@/types/admin";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  documentType: z.string().max(80).optional(),
  category: z.string().max(120).optional(),
  pillar: z.string().max(120).optional(),
  sector: z.string().max(80).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  framework: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  acknowledgementRequired: z.boolean().optional(),
  rolesRelevant: z.array(z.string()).optional(),
  siteIds: z.array(z.string().uuid()).optional(),
  effectiveDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  reviewDueAt: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters: DocumentFilters = {};
  const status = searchParams.get("status");
  const origin = searchParams.get("origin");
  const search = searchParams.get("search");
  if (status) filters.status = status as AdminDocumentStatus;
  if (origin) filters.origin = origin as DocumentOrigin;
  if (search) filters.search = search;

  const documents = await listAdminDocuments(filters);
  return NextResponse.json({ data: documents });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createDocument(parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }

  // Auto-ingest if content was provided at creation time
  if (parsed.data.content && parsed.data.content.trim().length > 0) {
    try {
      const admin = await requireAdmin();
      if (admin) {
        await ingestDocument(result.id, admin.tenantId, parsed.data.content, {
          title: parsed.data.title,
          sector: parsed.data.sector,
          framework: parsed.data.framework,
          riskLevel: parsed.data.riskLevel,
          allowedRoles: parsed.data.rolesRelevant,
          siteIds: parsed.data.siteIds,
        });
      }
    } catch {
      // Non-blocking: document is created even if ingest fails
    }
  }

  await recordAdminAction({
    action: "document.create",
    targetType: "document",
    targetId: result.id,
    summary: `Created draft "${parsed.data.title}"`,
  });

  return NextResponse.json({ data: { id: result.id } }, { status: 201 });
}
