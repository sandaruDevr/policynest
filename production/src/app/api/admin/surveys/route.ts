import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/data/admin/session";
import { listSurveys } from "@/lib/data/admin/training";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ data: await listSurveys() });
}
