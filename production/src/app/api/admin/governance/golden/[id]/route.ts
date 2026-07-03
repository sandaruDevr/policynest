import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  deleteGoldenAnswer,
  updateGoldenAnswer,
} from "@/lib/data/admin/governance";

const citationSchema = z.object({
  title: z.string().min(1),
  version: z.string().nullable().optional(),
  section_title: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
});

const patchSchema = z.object({
  questionPattern: z.string().min(3).max(500).optional(),
  approvedAnswer: z.string().min(3).max(8000).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).nullable().optional(),
  framework: z.array(z.string()).max(20).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  citations: z.array(citationSchema).max(20).optional(),
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

  const ok = await updateGoldenAnswer(params.id, parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "golden.update",
    targetType: "golden_answer",
    targetId: params.id,
    summary: "Updated golden answer",
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

  const ok = await deleteGoldenAnswer(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "golden.delete",
    targetType: "golden_answer",
    targetId: params.id,
    summary: "Deleted golden answer",
  });

  return NextResponse.json({ data: { ok: true } });
}
