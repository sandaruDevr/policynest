import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSite, listAdminSites } from "@/lib/data/admin/sites";
import { requireOrgAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";

const siteSchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().max(40).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
});

export async function GET() {
  const admin = await requireOrgAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listAdminSites() });
}

export async function POST(request: NextRequest) {
  const admin = await requireOrgAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = siteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createSite(parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }

  await recordAdminAction({
    action: "site.create",
    targetType: "site",
    targetId: result.id,
    summary: `Created site "${parsed.data.name}"`,
  });

  return NextResponse.json({ data: { id: result.id } }, { status: 201 });
}
