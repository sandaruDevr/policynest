import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateUser } from "@/lib/data/admin/users";
import { requireOrgAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";

const patchSchema = z.object({
  fullName: z.string().max(160).nullable().optional(),
  role: z
    .enum(["staff", "organisation_admin", "compliance_manager", "platform_admin"])
    .optional(),
  staffRole: z.string().max(80).nullable().optional(),
  jobTitle: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  status: z.enum(["active", "invited", "inactive"]).optional(),
  siteId: z.string().uuid().nullable().optional(),
  primarySector: z.string().max(80).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireOrgAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Guard: an admin cannot remove their own admin access (avoid lockout).
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

  if (
    params.id === admin.userId &&
    ((parsed.data.role && parsed.data.role === "staff") ||
      parsed.data.status === "inactive")
  ) {
    return NextResponse.json(
      { error: "You cannot revoke your own admin access" },
      { status: 422 },
    );
  }

  const ok = await updateUser(params.id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  await recordAdminAction({
    action: "user.update",
    targetType: "user",
    targetId: params.id,
    summary: "Updated user profile",
    meta: { ...parsed.data },
  });

  return NextResponse.json({ data: { success: true } });
}
