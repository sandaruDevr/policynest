import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  deleteTrainingModule,
  updateTrainingModule,
} from "@/lib/data/admin/training";

const patchSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  type: z.string().min(1).max(40).optional(),
  category: z.string().max(80).nullable().optional(),
  durationMinutes: z.number().int().min(1).nullable().optional(),
  required: z.boolean().optional(),
  rolesRelevant: z.array(z.string().max(60)).max(20).optional(),
  linkedPolicyId: z.string().uuid().nullable().optional(),
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

  const ok = await updateTrainingModule(params.id, parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "training_module.update",
    targetType: "training_module",
    targetId: params.id,
    summary: "Updated training module",
    meta: parsed.data,
  });

  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await deleteTrainingModule(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "training_module.delete",
    targetType: "training_module",
    targetId: params.id,
    summary: "Deleted training module",
  });

  return NextResponse.json({ data: { ok: true } });
}
