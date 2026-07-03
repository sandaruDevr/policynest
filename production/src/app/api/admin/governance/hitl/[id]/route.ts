import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  promoteHitlToGolden,
  reviewHitlItem,
} from "@/lib/data/admin/governance";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected", "corrected"]),
  reviewedAnswer: z.string().max(8000).nullable().optional(),
  reviewNotes: z.string().max(2000).nullable().optional(),
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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await reviewHitlItem(params.id, parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: `hitl.${parsed.data.status}`,
    targetType: "hitl_queue",
    targetId: params.id,
    summary: `Reviewed AI escalation as ${parsed.data.status}`,
  });

  return NextResponse.json({ data: result });
}

// Promote a reviewed item into a golden answer.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await promoteHitlToGolden(params.id);
  if (!result) {
    return NextResponse.json(
      { error: "Unable to promote — item has no answer" },
      { status: 400 },
    );
  }

  await recordAdminAction({
    action: "golden.promote",
    targetType: "golden_answer",
    targetId: result.id,
    summary: "Promoted HITL review to golden answer",
    meta: { sourceHitlId: params.id },
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
