import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import {
  listPlatformHitlItems,
  getHitlMetrics,
  reviewHitlItem,
  bulkReviewHitl,
} from "@/lib/data/platform/hitl-governance";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "corrected"]),
  reviewedAnswer: z.string().optional(),
  reviewNotes: z.string().optional(),
});

const bulkSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const riskLevel = url.searchParams.get("riskLevel") ?? undefined;
  const slaBreachedOnly = url.searchParams.get("breached") === "true";
  const tenantId = url.searchParams.get("tenantId") ?? undefined;
  const metricsOnly = url.searchParams.get("metrics") === "true";

  if (metricsOnly) {
    const metrics = await getHitlMetrics();
    return NextResponse.json({ metrics });
  }

  const items = await listPlatformHitlItems({
    status,
    riskLevel,
    slaBreachedOnly,
    tenantId,
  });

  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const url = new URL(req.url);
  const bulk = url.searchParams.get("bulk") === "true";

  if (bulk) {
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await bulkReviewHitl(
      parsed.data.itemIds,
      parsed.data.status,
      parsed.data.reviewNotes,
    );
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ updated: result.updated });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await reviewHitlItem(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
