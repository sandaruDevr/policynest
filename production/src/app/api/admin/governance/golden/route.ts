import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  createGoldenAnswer,
  listGoldenAnswers,
} from "@/lib/data/admin/governance";

const citationSchema = z.object({
  title: z.string().min(1),
  version: z.string().nullable().optional(),
  section_title: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
});

const goldenSchema = z.object({
  questionPattern: z.string().min(3).max(500),
  approvedAnswer: z.string().min(3).max(8000),
  riskLevel: z.enum(["low", "medium", "high"]).nullable().optional(),
  framework: z.array(z.string()).max(20).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  citations: z.array(citationSchema).max(20).optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listGoldenAnswers() });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = goldenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createGoldenAnswer(parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to create golden answer" },
      { status: 500 },
    );
  }

  await recordAdminAction({
    action: "golden.create",
    targetType: "golden_answer",
    targetId: result.id,
    summary: `Created golden answer for "${parsed.data.questionPattern.slice(0, 60)}"`,
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
