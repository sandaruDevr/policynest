import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import {
  getTenantDetail,
  updateTenant,
  suspendTenant,
  activateTenant,
  setFeatureFlag,
} from "@/lib/data/platform/tenant-management";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  industry: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  stateOrTerritory: z.string().max(100).optional(),
  plan: z.string().max(50).optional(),
  status: z.enum(["provisioning", "active", "suspended", "archived"]).optional(),
  featureFlag: z
    .object({
      feature: z.string().min(1).max(100),
      enabled: z.boolean(),
    })
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const detail = await getTenantDetail(params.id);
  if (!detail) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ tenant: detail });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const { featureFlag, ...tenantFields } = parsed.data;

  if (Object.keys(tenantFields).length > 0) {
    const result = await updateTenant(params.id, tenantFields);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  if (featureFlag) {
    const result = await setFeatureFlag(
      params.id,
      featureFlag.feature,
      featureFlag.enabled,
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
