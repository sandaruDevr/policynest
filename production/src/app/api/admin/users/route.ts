import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAdminUsers } from "@/lib/data/admin/users";
import { requireOrgAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { callInternalExpress } from "@/lib/server/internal-express";

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(160),
  role: z
    .enum(["staff", "organisation_admin", "compliance_manager"])
    .default("staff"),
  staffRole: z.string().max(80).nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
});

export async function GET() {
  const admin = await requireOrgAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listAdminUsers() });
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const result = await callInternalExpress<{
    success: boolean;
    userId: string;
    tempPassword: string;
  }>("/api/admin/users/create", {
    tenant_id: admin.tenantId,
    email: input.email,
    full_name: input.fullName,
    role: input.role,
    staff_role: input.staffRole ?? null,
    site_id: input.siteId ?? null,
    job_title: input.jobTitle ?? null,
    phone: input.phone ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to create user" },
      { status: result.status },
    );
  }

  await recordAdminAction({
    action: "user.create",
    targetType: "user",
    targetId: result.data.userId,
    summary: `Invited ${input.email} as ${input.role}`,
  });

  return NextResponse.json(
    {
      data: {
        id: result.data.userId,
        tempPassword: result.data.tempPassword,
      },
    },
    { status: 201 },
  );
}
