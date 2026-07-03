import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/route";
import { appendActivity } from "@/lib/data/activity";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;

if (!INTERNAL_SECRET) {
  throw new Error("Missing INTERNAL_SHARED_SECRET environment variable");
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve profile server-side
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, staff_role, site_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, category, severity, location, description, immediateActions, witnesses, notifiedParties } = body;

  if (!title || !category || !severity || !location || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Generate reference number server-side
    const reference = `INC-${Date.now().toString().slice(-6)}`;

    // Insert incident into Supabase
    const { data: incident, error: insertError } = await supabase
      .from("incidents")
      .insert({
        tenant_id: profile.tenant_id,
        submitted_by: user.id,
        incident_type: category,
        description,
        urgency: severity,
        status: "submitted",
        reference,
        severity,
        category,
        location,
        immediate_actions: immediateActions,
        witnesses,
        notified_parties: notifiedParties,
        occurred_at: new Date().toISOString(),
        follow_up_required: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Request AI suggested next steps from Express
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_SECRET!,
      };

      const expressResponse = await fetch(`${EXPRESS_URL}/api/rag/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: user.id,
          tenant_id: profile.tenant_id,
          role: profile.role,
          staff_role: profile.staff_role,
          site_id: profile.site_id,
          query: `What are the next steps for ${category} incident? ${description}`,
        }),
      });

      if (expressResponse.ok) {
        const expressData = await expressResponse.json();
        if (expressData.data?.answer) {
          await supabase
            .from("incidents")
            .update({ ai_suggested_next_steps: expressData.data.answer })
            .eq("id", incident.id);
        }
      }
    } catch (aiError) {
      console.error("Failed to get AI suggestions:", aiError);
      // Continue without AI suggestions
    }

    // Append activity (non-blocking)
    appendActivity("incident-submitted", `Submitted ${reference} — ${title}`, {
      targetId: incident.id,
    }).catch(() => {});

    return NextResponse.json({ data: incident });
  } catch (error) {
    console.error("Incident creation error:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 },
    );
  }
}
