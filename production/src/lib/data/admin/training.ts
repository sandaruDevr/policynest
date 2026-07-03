import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";
import type {
  AdminTrainingModule,
  TrainingAssignmentSummary,
  AdminSurvey,
} from "@/types/admin";

// ---------------------------------------------------------------------
// Training modules
// ---------------------------------------------------------------------

export async function listTrainingModules(): Promise<AdminTrainingModule[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("training_modules")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .order("created_at", { ascending: false });

  return (data || []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    category: r.category,
    durationMinutes: r.duration_minutes,
    required: r.required ?? false,
    rolesRelevant: r.roles_relevant || [],
    linkedPolicyId: r.linked_policy_id,
    createdAt: r.created_at,
  }));
}

export interface TrainingModuleInput {
  title: string;
  type: string;
  category?: string | null;
  durationMinutes?: number | null;
  required?: boolean;
  rolesRelevant?: string[];
  linkedPolicyId?: string | null;
}

export async function createTrainingModule(
  input: TrainingModuleInput,
): Promise<{ id: string } | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("training_modules")
    .insert({
      tenant_id: admin.tenantId,
      title: input.title,
      type: input.type,
      category: input.category ?? null,
      duration_minutes: input.durationMinutes ?? null,
      required: input.required ?? false,
      roles_relevant: input.rolesRelevant ?? [],
      linked_policy_id: input.linkedPolicyId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

export async function updateTrainingModule(
  id: string,
  input: Partial<TrainingModuleInput>,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.type !== undefined) update.type = input.type;
  if (input.category !== undefined) update.category = input.category;
  if (input.durationMinutes !== undefined)
    update.duration_minutes = input.durationMinutes;
  if (input.required !== undefined) update.required = input.required;
  if (input.rolesRelevant !== undefined)
    update.roles_relevant = input.rolesRelevant;
  if (input.linkedPolicyId !== undefined)
    update.linked_policy_id = input.linkedPolicyId;

  if (Object.keys(update).length === 0) return true;

  const supabase = createClient();
  const { error } = await supabase
    .from("training_modules")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

export async function deleteTrainingModule(id: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from("training_modules")
    .delete()
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

// ---------------------------------------------------------------------
// Training assignments
// ---------------------------------------------------------------------

export async function listTrainingAssignments(
  statusFilter: "all" | "not_started" | "in_progress" | "completed" | "overdue" = "all",
): Promise<TrainingAssignmentSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  let query = supabase
    .from("training_assignments")
    .select(
      `id, status, progress_percent, due_at, completed_at,
       module:module_id(title),
       user:profile_id(full_name, preferred_name)`,
    )
    .eq("tenant_id", admin.tenantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;

  const today = new Date().toISOString().slice(0, 10);

  return (data || []).map((r: any) => {
    const status = r.status as TrainingAssignmentSummary["status"];
    const isOverdue =
      status !== "completed" && r.due_at && r.due_at.slice(0, 10) < today;
    return {
      id: r.id,
      moduleTitle: r.module?.title ?? "Untitled",
      userName:
        r.user?.preferred_name || r.user?.full_name || "Unnamed",
      status: isOverdue ? "overdue" : status,
      progressPercent: r.progress_percent,
      dueAt: r.due_at,
      completedAt: r.completed_at,
    };
  });
}

export async function createTrainingAssignment(
  moduleId: string,
  profileIds: string[],
  dueAt?: string | null,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;
  if (profileIds.length === 0) return true;

  const rows = profileIds.map((pid) => ({
    tenant_id: admin.tenantId,
    module_id: moduleId,
    profile_id: pid,
    status: "not_started",
    due_at: dueAt ?? null,
  }));

  const supabase = createClient();
  const { error } = await supabase
    .from("training_assignments")
    .insert(rows as never);

  return !error;
}

// ---------------------------------------------------------------------
// Surveys
// ---------------------------------------------------------------------

export async function listSurveys(): Promise<AdminSurvey[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("surveys")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .order("created_at", { ascending: false });

  const surveys = data || [];
  if (surveys.length === 0) return [];

  // Batch count assignments
  const ids = surveys.map((s) => s.id);
  const [{ data: assignedRows }, { data: completedRows }] = await Promise.all([
    supabase
      .from("survey_assignments")
      .select("survey_id")
      .in("survey_id", ids)
      .eq("tenant_id", admin.tenantId),
    supabase
      .from("survey_assignments")
      .select("survey_id")
      .in("survey_id", ids)
      .eq("tenant_id", admin.tenantId)
      .eq("status", "completed"),
  ]);

  const assignedCounts = new Map<string, number>();
  for (const r of assignedRows || []) {
    assignedCounts.set(r.survey_id, (assignedCounts.get(r.survey_id) || 0) + 1);
  }
  const completedCounts = new Map<string, number>();
  for (const r of completedRows || []) {
    completedCounts.set(r.survey_id, (completedCounts.get(r.survey_id) || 0) + 1);
  }

  return surveys.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    questionCount: s.question_count,
    estimatedMinutes: s.estimated_minutes,
    closesAt: s.closes_at,
    anonymous: s.anonymous,
    assignedCount: assignedCounts.get(s.id) || 0,
    completedCount: completedCounts.get(s.id) || 0,
    createdAt: s.created_at,
  }));
}

export interface SurveyPatch {
  status?: string;
  closesAt?: string | null;
}

export async function updateSurvey(
  id: string,
  patch: SurveyPatch,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.closesAt !== undefined) update.closes_at = patch.closesAt;

  if (Object.keys(update).length === 0) return true;

  const supabase = createClient();
  const { error } = await supabase
    .from("surveys")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}
