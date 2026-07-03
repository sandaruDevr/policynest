import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { TrainingModule, InductionStep, CredentialItem } from "@/types";

type TrainingModuleRow = Database["public"]["Tables"]["training_modules"]["Row"];
type TrainingAssignmentRow = Database["public"]["Tables"]["training_assignments"]["Row"];
type InductionStepRow = Database["public"]["Tables"]["induction_steps"]["Row"];
type InductionProgressRow = Database["public"]["Tables"]["induction_progress"]["Row"];
type CredentialRow = Database["public"]["Tables"]["credentials"]["Row"];

export async function listTrainingModules(): Promise<TrainingModule[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return [];

  const { data: modules } = await supabase
    .from("training_modules")
    .select("*")
    .eq("tenant_id", profile.tenant_id);

  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*")
    .eq("profile_id", userId);

  const assignmentMap = new Map(
    (assignments || []).map((a) => [a.module_id, a])
  );

  return (modules || []).map((m) => mapTrainingModule(m, assignmentMap.get(m.id)));
}

export async function listInductionSteps(): Promise<InductionStep[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return [];

  const { data: steps } = await supabase
    .from("induction_steps")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("ord", { ascending: true });

  const { data: progress } = await supabase
    .from("induction_progress")
    .select("*")
    .eq("profile_id", userId);

  const progressMap = new Map(
    (progress || []).map((p) => [p.step_id, p.status])
  );

  return (steps || []).map((s) => ({
    id: s.id,
    index: s.ord,
    title: s.title,
    status: (progressMap.get(s.id) as InductionStep["status"]) || "upcoming",
    durationMinutes: s.duration_minutes || 0,
    type: s.type as TrainingModule["type"],
  }));
}

export async function getTrainingModule(id: string): Promise<TrainingModule | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  const { data: module } = await supabase
    .from("training_modules")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .eq("id", id)
    .single();

  if (!module) return null;

  const { data: assignment } = await supabase
    .from("training_assignments")
    .select("*")
    .eq("profile_id", userId)
    .eq("module_id", id)
    .single();

  return mapTrainingModule(module, assignment || undefined);
}

export async function listCredentials(): Promise<CredentialItem[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: rows } = await supabase
    .from("credentials")
    .select("*")
    .eq("profile_id", userId);

  return (rows || []).map(mapCredential);
}

function mapTrainingModule(
  module: TrainingModuleRow,
  assignment?: TrainingAssignmentRow
): TrainingModule {
  return {
    id: module.id,
    title: module.title,
    type: module.type as TrainingModule["type"],
    category: module.category || "",
    durationMinutes: module.duration_minutes || 0,
    status: (assignment?.status as TrainingModule["status"]) || "not-started",
    progressPercent: assignment?.progress_percent || 0,
    dueAt: assignment?.due_at || undefined,
    rolesRelevant: (module.roles_relevant as TrainingModule["rolesRelevant"]) || [],
    linkedPolicyId: module.linked_policy_id || undefined,
    required: module.required || false,
  };
}

function mapCredential(row: CredentialRow): CredentialItem {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer || "",
    number: row.number || undefined,
    issuedAt: row.issued_at || undefined,
    expiresAt: row.expires_at || undefined,
    status: (row.status as CredentialItem["status"]) || "valid",
    required: row.required || false,
  };
}
