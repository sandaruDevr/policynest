import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/data/admin/session";
import { recordAdminAction } from "@/lib/data/admin/audit";
import {
  createTrainingModule,
  listTrainingModules,
} from "@/lib/data/admin/training";

const moduleSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.string().min(1).max(40),
  category: z.string().max(80).nullable().optional(),
  durationMinutes: z.number().int().min(1).nullable().optional(),
  required: z.boolean().optional(),
  rolesRelevant: z.array(z.string().max(60)).max(20).optional(),
  linkedPolicyId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listTrainingModules() });
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

  const parsed = moduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createTrainingModule(parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 },
    );
  }

  await recordAdminAction({
    action: "training_module.create",
    targetType: "training_module",
    targetId: result.id,
    summary: `Created training module "${parsed.data.title}"`,
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
