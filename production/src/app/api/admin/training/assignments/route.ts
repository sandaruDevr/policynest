import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  createTrainingAssignment,
  listTrainingAssignments,
} from "@/lib/data/admin/training";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const filter: Parameters<typeof listTrainingAssignments>[0] =
    ["all", "not_started", "in_progress", "completed", "overdue"].includes(status)
      ? (status as Parameters<typeof listTrainingAssignments>[0])
      : "all";

  return NextResponse.json({ data: await listTrainingAssignments(filter) });
}

const assignSchema = z.object({
  moduleId: z.string().uuid(),
  profileIds: z.array(z.string().uuid()).min(1).max(200),
  dueAt: z.string().datetime().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ok = await createTrainingAssignment(
    parsed.data.moduleId,
    parsed.data.profileIds,
    parsed.data.dueAt,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to create assignments" },
      { status: 500 },
    );
  }

  await recordAdminAction({
    action: "training_assignment.create",
    targetType: "training_assignment",
    targetId: parsed.data.moduleId,
    summary: `Assigned training to ${parsed.data.profileIds.length} user(s)`,
    meta: { moduleId: parsed.data.moduleId, count: parsed.data.profileIds.length },
  });

  return NextResponse.json({ data: { ok: true } }, { status: 201 });
}
