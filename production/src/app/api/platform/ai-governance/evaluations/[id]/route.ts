import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { getEvaluationCases } from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cases = await getEvaluationCases(params.id);
  return NextResponse.json({ cases });
}
