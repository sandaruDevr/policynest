import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listSlaConfigs, updateSlaConfig } from "@/lib/data/platform/hitl-governance";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  configs: z.array(
    z.object({
      id: z.string().uuid(),
      slaHours: z.number().int().positive().optional(),
      escalationHours: z.number().int().positive().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configs = await listSlaConfigs();
  return NextResponse.json({ configs });
}

export async function PUT(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    parsed.data.configs.map((c) => updateSlaConfig(c.id, c)),
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: `${errors.length} config(s) failed to update`, details: errors },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
