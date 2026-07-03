import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/data/platform/session";
import {
  getPromptVersions,
  createPromptVersion,
  publishPromptVersion,
} from "@/lib/data/platform/ai-governance";

export const dynamic = "force-dynamic";

const versionSchema = z.object({
  version: z.string().min(1).max(20),
  content: z.string().min(1),
  changeReason: z.string().max(500).optional(),
});

const publishSchema = z.object({
  action: z.literal("publish"),
  versionId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const versions = await getPromptVersions(params.id);
  return NextResponse.json({ versions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requirePlatformAdmin().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);

  // Check if this is a publish action
  const pubParsed = publishSchema.safeParse(body);
  if (pubParsed.success) {
    const result = await publishPromptVersion(pubParsed.data.versionId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Otherwise create a new version
  const parsed = versionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createPromptVersion({
    promptId: params.id,
    ...parsed.data,
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
