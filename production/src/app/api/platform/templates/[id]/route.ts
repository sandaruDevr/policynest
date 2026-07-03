import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import {
  getMasterTemplateDetail,
  updateMasterTemplate,
  createTemplateVersion,
  publishTemplateVersion,
} from "@/lib/data/platform/templates";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  pillar: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
  framework: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.string().max(50).optional(),
  targetRoles: z.array(z.string()).optional(),
  status: z.enum(["draft", "in_review", "approved", "published", "retired"]).optional(),
  content: z.string().optional(),
});

const versionSchema = z.object({
  version: z.string().min(1).max(20),
  title: z.string().min(2).max(300),
  content: z.string().optional(),
  summary: z.string().optional(),
  changeReason: z.string().optional(),
});

const publishSchema = z.object({
  versionId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const detail = await getMasterTemplateDetail(params.id);
  if (!detail) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: detail });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateMasterTemplate(params.id, parsed.data);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "publish") {
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await publishTemplateVersion(parsed.data.versionId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  // Default: create a new version
  const parsed = versionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createTemplateVersion({
    templateId: params.id,
    ...parsed.data,
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
