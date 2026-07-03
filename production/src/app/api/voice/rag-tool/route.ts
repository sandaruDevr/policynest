import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/route";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!INTERNAL_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, staff_role, site_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { query } = await request.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const res = await fetch(`${EXPRESS_URL}/api/voice/rag-tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        user_id: user.id,
        tenant_id: profile.tenant_id,
        role: profile.role,
        staff_role: profile.staff_role,
        site_id: profile.site_id,
        query,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("RAG tool proxy error:", errText);
      return NextResponse.json({ error: "Policy search failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("RAG tool error:", error);
    return NextResponse.json({ error: "Policy search failed" }, { status: 500 });
  }
}
