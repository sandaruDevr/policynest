import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listTenants } from "@/lib/data/platform/tenants";
import { createTenant } from "@/lib/data/platform/tenant-management";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(200),
  industry: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  stateOrTerritory: z.string().max(100).optional(),
  plan: z.string().max(50).optional(),
  defaultSiteName: z.string().max(200).optional(),
  defaultSiteCode: z.string().max(20).optional(),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenants = await listTenants();
  return NextResponse.json({ tenants });
}

export async function POST(req: NextRequest) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createTenant(parsed.data);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
