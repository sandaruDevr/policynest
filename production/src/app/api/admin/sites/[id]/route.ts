import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteSite, updateSite } from "@/lib/data/admin/sites";
import { requireOrgAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";

const siteSchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().max(40).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const ok = await updateSite(params.id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  await recordAdminAction({
    action: "site.update",
    targetType: "site",
    targetId: params.id,
    summary: `Updated site "${parsed.data.name}"`,
  });

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireOrgAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await deleteSite(params.id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });

  await recordAdminAction({
    action: "site.delete",
    targetType: "site",
    targetId: params.id,
    summary: "Deleted site",
  });

  return NextResponse.json({ data: { success: true } });
}
