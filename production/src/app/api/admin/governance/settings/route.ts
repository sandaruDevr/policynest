import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import { getAiSettings, updateAiSettings } from "@/lib/data/admin/governance";

const settingsSchema = z.object({
  assistantEnabled: z.boolean().optional(),
  hitlConfidenceThreshold: z.number().min(0).max(1).optional(),
  escalateHighRisk: z.boolean().optional(),
  goldenAnswersEnabled: z.boolean().optional(),
  minRetrievalSimilarity: z.number().min(0).max(1).optional(),
  retrievalTopK: z.number().int().min(1).max(50).optional(),
  customGuidance: z.string().max(4000).nullable().optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await getAiSettings() });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ok = await updateAiSettings(parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await recordAdminAction({
    action: "ai_settings.update",
    targetType: "tenant_ai_settings",
    summary: "Updated tenant AI settings",
    meta: parsed.data,
  });

  return NextResponse.json({ data: await getAiSettings() });
}
