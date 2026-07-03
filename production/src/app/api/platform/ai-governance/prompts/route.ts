import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import { listPrompts, createPrompt } from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  promptType: z.enum(["system", "user_template", "structured"]).optional(),
  modelType: z.string().max(50).optional(),
  content: z.string().min(1),
  changeReason: z.string().max(500).optional(),
});

export async function GET() {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prompts = await listPrompts();
  return NextResponse.json({ prompts });
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

  const result = await createPrompt(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
