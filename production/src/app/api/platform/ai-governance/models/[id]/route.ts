import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { updateModel } from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  provider: z.string().max(50).optional(),
  modelId: z.string().max(100).optional(),
  modelType: z.enum(["chat", "embedding", "vision", "reasoning"]).optional(),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  costPer1kInput: z.number().nonnegative().optional(),
  costPer1kOutput: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateModel(params.id, parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
