import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listEvaluations, createEvaluation, getEvaluationCases } from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  promptId: z.string().uuid().optional(),
  promptVersionId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  cases: z.array(z.object({
    input: z.string().min(1),
    expectedOutput: z.string().optional(),
  })).min(1),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const evaluations = await listEvaluations();
  return NextResponse.json({ evaluations });
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

  const result = await createEvaluation(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
