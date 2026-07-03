import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listMasterTemplates, createMasterTemplate } from "@/lib/data/platform/templates";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  documentType: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  pillar: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
  framework: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.string().max(50).optional(),
  targetRoles: z.array(z.string()).optional(),
  content: z.string().optional(),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const templates = await listMasterTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createMasterTemplate(parsed.data);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
