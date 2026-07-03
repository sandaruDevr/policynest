import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { IncidentReport, IncidentType, IncidentStatus } from "@/types";

type IncidentRow = Database["public"]["Tables"]["incidents"]["Row"];

export async function listIncidents(): Promise<IncidentReport[]> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();

  if (!profile) {
    return [];
  }

  const { data: incidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  return (incidents || []).map(mapToIncidentReport);
}

export async function getIncident(id: string): Promise<IncidentReport | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .single();

  if (!profile) return null;

  const { data: row } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id)
    .single();

  if (!row) return null;
  return mapToIncidentReport(row);
}

function mapToIncidentReport(row: IncidentRow): IncidentReport {
  const statusMap: Record<string, IncidentStatus> = {
    submitted: "submitted",
    review: "in-review",
    resolved: "actioned",
    closed: "closed",
  };

  const typeMap: Record<string, IncidentType> = {
    fall: "fall",
    medication: "medication",
    behavioral: "behaviour",
    behaviour: "behaviour",
    "skin-integrity": "skin-integrity",
    "near-miss": "near-miss",
    equipment: "equipment",
    hazard: "hazard",
    "missing-person": "missing-person",
    other: "other",
  };

  return {
    id: row.id,
    reference: row.reference || "",
    type: typeMap[row.incident_type] || "other",
    status: statusMap[row.status] || "submitted",
    severity: (row.severity as "low" | "medium" | "high" | "critical") || "medium",
    occurredAt: row.occurred_at || row.created_at,
    reportedAt: row.created_at,
    location: row.location || "",
    description: row.description,
    observedIssues: [],
    immediateActions: row.immediate_actions || "",
    notifiedParties: row.notified_parties ? row.notified_parties.split(", ") : [],
    attachments: [],
    aiSuggestedNextSteps: row.ai_suggested_next_steps ? [row.ai_suggested_next_steps] : undefined,
    followUpRequired: row.follow_up_required,
    timeline: [],
  };
}
