import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { propagateTemplate } from "@/lib/data/platform/templates";

export const dynamic = "force-dynamic";

const schema = z.object({
  versionId: z.string().uuid(),
  targetTenantIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await propagateTemplate(
    parsed.data.versionId,
    parsed.data.targetTenantIds,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ results: result.results });
}
