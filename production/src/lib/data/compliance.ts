import { createClient } from "@/lib/supabase/server";
import type { ComplianceItem, ComplianceSummary } from "@/types";

export async function listComplianceItems(): Promise<ComplianceItem[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: rows } = await supabase
    .from("staff_compliance_items")
    .select("*")
    .eq("profile_id", userId)
    .order("due_at", { ascending: true });

  return (rows || []).map((r) => ({
    id: r.id,
    kind: r.kind as ComplianceItem["kind"],
    title: r.title,
    state: (r.state as ComplianceItem["state"]) || "pending",
    dueAt: r.due_at || undefined,
    completedAt: r.completed_at || undefined,
    linkedDocumentId: r.linked_document_id || undefined,
    linkedTrainingId: r.linked_training_id || undefined,
    progressPercent: r.progress_percent || undefined,
  }));
}

export async function getComplianceSummary(): Promise<ComplianceSummary> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return {
      overallPercent: 0,
      acknowledgementsDone: 0,
      acknowledgementsTotal: 0,
      trainingDone: 0,
      trainingTotal: 0,
      credentialsValid: 0,
      credentialsTotal: 0,
      expiringSoonCount: 0,
      overdueCount: 0,
    };
  }

  const { data: items } = await supabase
    .from("staff_compliance_items")
    .select("*")
    .eq("profile_id", userId);

  const all = items || [];
  const training = all.filter((i) => i.kind === "training");
  const credentials = all.filter((i) => i.kind === "credential");
  const acknowledgements = all.filter((i) => i.kind === "acknowledgement");

  const trainingDone = training.filter((t) => t.state === "completed" || t.state === "complete").length;
  const credsValid = credentials.filter((c) => c.state === "complete").length;
  const acksDone = acknowledgements.filter((a) => a.state === "complete").length;
  const expiringSoon = credentials.filter((c) => c.state === "due-soon").length;
  const overdue = all.filter((i) => i.state === "overdue").length;

  const total = all.length || 1;
  const done = all.filter((i) => i.state === "complete" || i.state === "completed").length;
  const overall = Math.round((done / total) * 100);

  return {
    overallPercent: overall,
    acknowledgementsDone: acksDone,
    acknowledgementsTotal: acknowledgements.length,
    trainingDone: trainingDone,
    trainingTotal: training.length,
    credentialsValid: credsValid,
    credentialsTotal: credentials.length,
    expiringSoonCount: expiringSoon,
    overdueCount: overdue,
  };
}
