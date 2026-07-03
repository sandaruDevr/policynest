import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { updateSurvey } from "@/lib/data/admin/training";

const patchSchema = z.object({
  status: z.string().min(1).optional(),
  closesAt: z.string().datetime().nullable().optional(),
});

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

  const ok = await updateSurvey(params.id, parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "survey.update",
    targetType: "survey",
    targetId: params.id,
    summary: "Updated survey",
    meta: parsed.data,
  });

  return NextResponse.json({ data: { ok: true } });
}
