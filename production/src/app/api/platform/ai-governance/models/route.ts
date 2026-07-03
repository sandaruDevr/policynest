import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listModels, createModel, updateModel } from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  provider: z.string().max(50).optional(),
  modelId: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  modelType: z.enum(["chat", "embedding", "vision", "reasoning"]).optional(),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  costPer1kInput: z.number().nonnegative().optional(),
  costPer1kOutput: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const models = await listModels();
  return NextResponse.json({ models });
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

  const result = await createModel(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
