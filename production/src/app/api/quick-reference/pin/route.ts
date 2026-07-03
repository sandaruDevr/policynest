import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appendActivity } from "@/lib/data/activity";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { kind, title, subtitle, targetType, targetId, targetUrl, content } = body;

    if (!kind || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: row, error } = await supabase
      .from("quick_reference_pins")
      .upsert(
        {
          tenant_id: profile.tenant_id,
          profile_id: userId,
          kind,
          title,
          subtitle: subtitle || null,
          target_type: targetType || null,
          target_id: targetId || null,
          target_url: targetUrl || null,
          content: content ?? null,
          pinned_at: new Date().toISOString(),
        },
        {
          onConflict: "profile_id,target_type,target_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Pin error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Append activity (non-blocking)
    appendActivity("quick-ref-pinned", `Pinned: ${title.slice(0, 120)}`, {
      targetId: row.id,
    }).catch(() => {});

    return NextResponse.json({ data: row });
  } catch (err) {
    console.error("Unexpected pin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
