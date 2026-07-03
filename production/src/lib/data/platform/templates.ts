import "server-only";
import { createClient } from "@/lib/supabase/server";
import { recordPlatformAction } from "./audit";
import { PLATFORM_TENANT_ID } from "@/types/platform";
import type {
  CreateTemplateInput,
  CreateVersionInput,
  MasterTemplateSummary,
  MasterTemplateDetail,
  TemplateVersion,
  PropagationLogEntry,
  TemplateStatus,
} from "@/types/platform";

const TEMPLATE_STATUSES: TemplateStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "retired",
];

function normalizeTemplateStatus(value: string): TemplateStatus {
  return TEMPLATE_STATUSES.includes(value as TemplateStatus)
    ? (value as TemplateStatus)
    : "draft";
}

/**
 * List all master templates from the aggregated view.
 */
export async function listMasterTemplates(): Promise<MasterTemplateSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("master_template_summary")
    .select("*")
    .order("updated_at", { ascending: false });

  return (data || []).map((r) => ({
    id: r.id,
    documentId: r.document_id,
    title: r.title,
    description: r.description,
    documentType: r.document_type,
    category: r.category,
    pillar: r.pillar,
    sector: r.sector,
    framework: r.framework ?? [],
    tags: r.tags ?? [],
    riskLevel: r.risk_level,
    status: normalizeTemplateStatus(r.status),
    targetRoles: r.target_roles ?? [],
    currentVersion: r.current_version,
    shadowCount: r.shadow_count,
    versionCount: r.version_count,
    latestVersion: r.latest_version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Create a new master template. This inserts:
 *   1. A document row in the platform tenant (origin_type = 'master')
 *   2. A master_templates row linked to that document
 */
export async function createMasterTemplate(
  input: CreateTemplateInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  // 1. Create the master document in the platform tenant
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      tenant_id: PLATFORM_TENANT_ID,
      title: input.title,
      document_type: input.documentType ?? "policy",
      status: "draft",
      version: "v0.1",
      origin_type: "master",
      content: input.content ?? null,
      category: input.category ?? null,
      pillar: input.pillar ?? null,
      sector: input.sector ?? null,
      framework: input.framework ?? [],
      tags: input.tags ?? [],
      risk_level: input.riskLevel ?? null,
      roles_relevant: input.targetRoles ?? [],
    })
    .select("id")
    .single();

  if (docErr || !doc) {
    return { id: "", error: docErr?.message ?? "Failed to create document" };
  }

  // 2. Create the master_templates registry entry
  const { data: template, error: tplErr } = await supabase
    .from("master_templates")
    .insert({
      document_id: doc.id,
      title: input.title,
      description: input.description ?? null,
      document_type: input.documentType ?? "policy",
      category: input.category ?? null,
      pillar: input.pillar ?? null,
      sector: input.sector ?? null,
      framework: input.framework ?? [],
      tags: input.tags ?? [],
      risk_level: input.riskLevel ?? null,
      target_roles: input.targetRoles ?? [],
      status: "draft",
    })
    .select("id")
    .single();

  if (tplErr || !template) {
    return { id: "", error: tplErr?.message ?? "Failed to create template" };
  }

  await recordPlatformAction({
    action: "template.create",
    targetType: "master_template",
    targetId: template.id,
    summary: `Created master template "${input.title}"`,
    meta: { title: input.title, documentId: doc.id },
  });

  return { id: template.id };
}

/**
 * Get full template detail: summary + versions + propagation log.
 */
export async function getMasterTemplateDetail(
  templateId: string,
): Promise<MasterTemplateDetail | null> {
  const supabase = createClient();

  const [summaryRes, versionsRes, logRes] = await Promise.all([
    supabase
      .from("master_template_summary")
      .select("*")
      .eq("id", templateId)
      .single(),
    supabase
      .from("master_template_versions")
      .select("*")
      .eq("template_id", templateId)
      .order("created_at", { ascending: false }),
    supabase
      .from("shadow_propagation_log")
      .select("*")
      .eq("template_id", templateId)
      .order("pushed_at", { ascending: false })
      .limit(50),
  ]);

  if (summaryRes.error || !summaryRes.data) return null;

  const s = summaryRes.data;

  const versions: TemplateVersion[] = (versionsRes.data || []).map((v) => ({
    id: v.id,
    templateId: v.template_id,
    version: v.version,
    documentId: v.document_id,
    title: v.title,
    content: v.content,
    summary: v.summary,
    changeReason: v.change_reason,
    propagatedTo: v.propagated_to ?? [],
    status: v.status as TemplateVersion["status"],
    publishedAt: v.published_at,
    publishedBy: v.published_by,
    createdAt: v.created_at,
  }));

  const propagationLog: PropagationLogEntry[] = (logRes.data || []).map((l) => ({
    id: l.id,
    templateId: l.template_id,
    versionId: l.version_id,
    targetTenantId: l.target_tenant_id,
    shadowDocumentId: l.shadow_document_id,
    status: l.status as PropagationLogEntry["status"],
    detail: l.detail,
    pushedBy: l.pushed_by,
    pushedAt: l.pushed_at,
  }));

  return {
    id: s.id,
    documentId: s.document_id,
    title: s.title,
    description: s.description,
    documentType: s.document_type,
    category: s.category,
    pillar: s.pillar,
    sector: s.sector,
    framework: s.framework ?? [],
    tags: s.tags ?? [],
    riskLevel: s.risk_level,
    status: normalizeTemplateStatus(s.status),
    targetRoles: s.target_roles ?? [],
    currentVersion: s.current_version,
    shadowCount: s.shadow_count,
    versionCount: s.version_count,
    latestVersion: s.latest_version,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    versions,
    propagationLog,
  };
}

/**
 * Create a new version of a master template.
 * Snapshots the current document content as a version.
 */
export async function createTemplateVersion(
  input: CreateVersionInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  // Get the template to find its document_id
  const { data: template } = await supabase
    .from("master_templates")
    .select("document_id, title")
    .eq("id", input.templateId)
    .single();

  if (!template) {
    return { id: "", error: "Template not found" };
  }

  // Update the master document with new content
  const { error: docErr } = await supabase
    .from("documents")
    .update({
      title: input.title,
      content: input.content ?? null,
      version: input.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", template.document_id);

  if (docErr) {
    return { id: "", error: docErr.message };
  }

  // Create the version snapshot
  const { data: version, error: verErr } = await supabase
    .from("master_template_versions")
    .insert({
      template_id: input.templateId,
      version: input.version,
      document_id: template.document_id,
      title: input.title,
      content: input.content ?? null,
      summary: input.summary ?? null,
      change_reason: input.changeReason ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (verErr || !version) {
    return { id: "", error: verErr?.message ?? "Failed to create version" };
  }

  // Update template's current_version
  await supabase
    .from("master_templates")
    .update({ current_version: input.version, updated_at: new Date().toISOString() })
    .eq("id", input.templateId);

  await recordPlatformAction({
    action: "template.version.create",
    targetType: "master_template",
    targetId: input.templateId,
    summary: `Created version ${input.version} for "${input.title}"`,
    meta: { version: input.version, changeReason: input.changeReason },
  });

  return { id: version.id };
}

/**
 * Publish a template version: marks it as published and updates template status.
 */
export async function publishTemplateVersion(
  versionId: string,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { data: version } = await supabase
    .from("master_template_versions")
    .select("template_id, version")
    .eq("id", versionId)
    .single();

  if (!version) {
    return { error: "Version not found" };
  }

  // Supersede previous published versions
  await supabase
    .from("master_template_versions")
    .update({ status: "superseded" })
    .eq("template_id", version.template_id)
    .eq("status", "published");

  // Publish this version
  const { error } = await supabase
    .from("master_template_versions")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", versionId);

  if (error) return { error: error.message };

  // Update template status
  await supabase
    .from("master_templates")
    .update({
      status: "published",
      current_version: version.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", version.template_id);

  await recordPlatformAction({
    action: "template.version.publish",
    targetType: "master_template_version",
    targetId: versionId,
    summary: `Published version ${version.version}`,
    meta: { version: version.version },
  });

  return {};
}

/**
 * Propagate a template version as shadow copies to tenant libraries.
 * If no target tenant IDs are provided, pushes to all active customer tenants.
 */
export async function propagateTemplate(
  versionId: string,
  targetTenantIds?: string[],
): Promise<{ results: Array<{ tenantId: string; status: string; detail: string }>; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("propagate_shadow", {
    p_version_id: versionId,
    p_target_tenant_ids: targetTenantIds ?? null,
  });

  if (error) {
    return { results: [], error: error.message };
  }

  const results = (data || []).map((r: { tenant_id: string; status: string; detail: string }) => ({
    tenantId: r.tenant_id,
    status: r.status,
    detail: r.detail,
  }));

  // Get version info for audit
  const { data: version } = await supabase
    .from("master_template_versions")
    .select("template_id, version")
    .eq("id", versionId)
    .single();

  await recordPlatformAction({
    action: "template.propagate",
    targetType: "master_template",
    targetId: version?.template_id ?? undefined,
    summary: `Propagated version ${version?.version ?? "?"} to ${results.length} tenant(s)`,
    meta: { versionId, results } as Record<string, unknown>,
  });

  return { results };
}

/**
 * Update template metadata.
 */
export async function updateMasterTemplate(
  templateId: string,
  input: Partial<CreateTemplateInput> & { status?: TemplateStatus },
): Promise<{ error?: string }> {
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.category !== undefined) update.category = input.category;
  if (input.pillar !== undefined) update.pillar = input.pillar;
  if (input.sector !== undefined) update.sector = input.sector;
  if (input.framework !== undefined) update.framework = input.framework;
  if (input.tags !== undefined) update.tags = input.tags;
  if (input.riskLevel !== undefined) update.risk_level = input.riskLevel;
  if (input.targetRoles !== undefined) update.target_roles = input.targetRoles;
  if (input.status !== undefined) update.status = input.status;
  update.updated_at = new Date().toISOString();

  if (Object.keys(update).length <= 1) return {};

  const { error } = await supabase
    .from("master_templates")
    .update(update)
    .eq("id", templateId);

  if (error) return { error: error.message };

  await recordPlatformAction({
    action: "template.update",
    targetType: "master_template",
    targetId: templateId,
    summary: `Updated template metadata`,
    meta: update,
  });

  return {};
}
