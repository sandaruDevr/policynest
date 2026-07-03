import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AdminDocumentDetail,
  AdminDocumentSection,
  AdminDocumentStatus,
  AdminDocumentSummary,
  DocumentOrigin,
  DocumentValidation,
  DocumentVersionEntry,
} from "@/types/admin";

type DbDocument = Database["public"]["Tables"]["documents"]["Row"];
type Json = Database["public"]["Tables"]["document_validations"]["Row"]["frameworks"];

function mapSummary(d: DbDocument): AdminDocumentSummary {
  return {
    id: d.id,
    title: d.title,
    shortTitle: d.short_title,
    documentType: d.document_type,
    status: (d.status as AdminDocumentStatus) ?? "draft",
    version: d.version,
    category: d.category,
    pillar: d.pillar,
    riskLevel: d.risk_level,
    sector: d.sector,
    framework: d.framework ?? [],
    tags: d.tags ?? [],
    origin: (d.origin_type as DocumentOrigin) ?? "organisation",
    acknowledgementRequired: d.acknowledgement_required ?? false,
    effectiveDate: d.effective_date,
    expiryDate: d.expiry_date,
    reviewDueAt: d.review_due_at,
    updatedAt: d.updated_at,
    publishedAt: d.published_at,
    rolesRelevant: d.roles_relevant ?? [],
    siteIds: d.site_ids ?? [],
  };
}

export interface DocumentFilters {
  status?: AdminDocumentStatus;
  origin?: DocumentOrigin;
  search?: string;
}

/** List tenant documents (all statuses) for the admin repository. */
export async function listAdminDocuments(
  filters: DocumentFilters = {},
): Promise<AdminDocumentSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  let query = supabase
    .from("documents")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .order("updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.origin) query = query.eq("origin_type", filters.origin);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);

  const { data } = await query;
  return (data || []).map(mapSummary);
}

/** Full document detail incl. sections, version history, latest validation. */
export async function getAdminDocument(
  id: string,
): Promise<AdminDocumentDetail | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", admin.tenantId)
    .single();

  if (!doc) return null;

  const [{ data: sections }, { data: versions }, { data: validation }] =
    await Promise.all([
      supabase
        .from("document_sections")
        .select("*")
        .eq("document_id", id)
        .order("ord", { ascending: true }),
      supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("document_validations")
        .select("*")
        .eq("document_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const mappedSections: AdminDocumentSection[] = (sections || []).map((s) => ({
    id: s.id,
    anchor: s.anchor,
    title: s.title,
    body: s.body || "",
    ord: s.ord,
  }));

  const mappedVersions: DocumentVersionEntry[] = (versions || []).map((v) => ({
    id: v.id,
    version: v.version,
    title: v.title,
    summary: v.summary,
    statusAtSnapshot: v.status_at_snapshot,
    authorType: (v.author_type as DocumentVersionEntry["authorType"]) || "human",
    changeReason: v.change_reason,
    createdBy: v.created_by,
    createdAt: v.created_at,
  }));

  let latestValidation: DocumentValidation | null = null;
  if (validation) {
    latestValidation = {
      id: validation.id,
      version: validation.version,
      status: validation.status as DocumentValidation["status"],
      score: validation.score,
      summary: validation.summary,
      frameworks: (validation.frameworks as unknown as DocumentValidation["frameworks"]) || [],
      gaps: (validation.gaps as unknown as DocumentValidation["gaps"]) || [],
      flags: (validation.flags as unknown as DocumentValidation["flags"]) || [],
      blockers: (validation.blockers as unknown as string[]) || [],
      model: validation.model,
      createdAt: validation.created_at,
    };
  }

  return {
    ...mapSummary(doc),
    summary: doc.summary,
    content: doc.content,
    ownerId: doc.owner_id,
    createdBy: doc.created_by,
    approvedBy: doc.approved_by,
    publishedBy: doc.published_by,
    changeReason: doc.change_reason,
    sourceTemplateId: doc.source_template_id,
    parentDocumentId: doc.parent_document_id,
    sections: mappedSections,
    versions: mappedVersions,
    latestValidation,
  };
}

export interface CreateDocumentInput {
  title: string;
  documentType?: string;
  category?: string;
  pillar?: string;
  sector?: string;
  riskLevel?: string;
  framework?: string[];
  tags?: string[];
  summary?: string;
  content?: string;
  acknowledgementRequired?: boolean;
  rolesRelevant?: string[];
  siteIds?: string[];
  effectiveDate?: string | null;
  expiryDate?: string | null;
  reviewDueAt?: string | null;
}

/** Create a new draft document owned by the current admin's tenant. */
export async function createDocument(
  input: CreateDocumentInput,
): Promise<{ id: string } | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: admin.tenantId,
      title: input.title,
      document_type: input.documentType ?? null,
      category: input.category ?? null,
      pillar: input.pillar ?? null,
      sector: input.sector ?? null,
      risk_level: input.riskLevel ?? null,
      framework: input.framework ?? [],
      tags: input.tags ?? [],
      summary: input.summary ?? null,
      content: input.content ?? null,
      acknowledgement_required: input.acknowledgementRequired ?? false,
      roles_relevant: input.rolesRelevant ?? [],
      site_ids: input.siteIds ?? [],
      effective_date: input.effectiveDate ?? null,
      expiry_date: input.expiryDate ?? null,
      review_due_at: input.reviewDueAt ?? null,
      status: "draft",
      origin_type: "organisation",
      created_by: admin.userId,
      owner_id: admin.userId,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

export interface DocumentMetaPatch {
  title?: string;
  documentType?: string | null;
  category?: string | null;
  pillar?: string | null;
  sector?: string | null;
  riskLevel?: string | null;
  framework?: string[];
  tags?: string[];
  summary?: string | null;
  content?: string;
  acknowledgementRequired?: boolean;
  rolesRelevant?: string[];
  siteIds?: string[];
  effectiveDate?: string | null;
  expiryDate?: string | null;
  reviewDueAt?: string | null;
  changeReason?: string;
}

/** Update document metadata / content (admin, tenant-scoped). */
export async function updateDocumentMeta(
  id: string,
  patch: DocumentMetaPatch,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const update: Database["public"]["Tables"]["documents"]["Update"] = {};

  if (patch.title !== undefined) update.title = patch.title;
  if (patch.documentType !== undefined) update.document_type = patch.documentType;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.pillar !== undefined) update.pillar = patch.pillar;
  if (patch.sector !== undefined) update.sector = patch.sector;
  if (patch.riskLevel !== undefined) update.risk_level = patch.riskLevel;
  if (patch.framework !== undefined) update.framework = patch.framework;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.summary !== undefined) update.summary = patch.summary;
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.acknowledgementRequired !== undefined)
    update.acknowledgement_required = patch.acknowledgementRequired;
  if (patch.rolesRelevant !== undefined)
    update.roles_relevant = patch.rolesRelevant;
  if (patch.siteIds !== undefined) update.site_ids = patch.siteIds;
  if (patch.effectiveDate !== undefined)
    update.effective_date = patch.effectiveDate;
  if (patch.expiryDate !== undefined) update.expiry_date = patch.expiryDate;
  if (patch.reviewDueAt !== undefined) update.review_due_at = patch.reviewDueAt;
  if (patch.changeReason !== undefined) update.change_reason = patch.changeReason;

  const { error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

/** Persist an AI validation result against a document version. */
export async function saveValidation(
  documentId: string,
  version: string | null,
  result: {
    status: string;
    score: number | null;
    summary: string;
    frameworks: unknown;
    gaps: unknown;
    flags: unknown;
    blockers: unknown;
    model?: string;
  },
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { error } = await supabase.from("document_validations").insert({
    tenant_id: admin.tenantId,
    document_id: documentId,
    version,
    status: result.status,
    score: result.score,
    summary: result.summary,
    frameworks: result.frameworks as Json,
    gaps: result.gaps as Json,
    flags: result.flags as Json,
    blockers: result.blockers as Json,
    model: result.model ?? null,
    created_by: admin.userId,
  });

  return !error;
}

/** Create an immutable version snapshot of the document's current state. */
export async function snapshotVersion(
  documentId: string,
  authorType: "human" | "ai" | "platform",
  changeReason?: string,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("version, title, summary, content, status")
    .eq("id", documentId)
    .eq("tenant_id", admin.tenantId)
    .single();

  if (!doc) return false;

  const { error } = await supabase.from("document_versions").insert({
    tenant_id: admin.tenantId,
    document_id: documentId,
    version: doc.version,
    title: doc.title,
    summary: doc.summary,
    content: doc.content,
    status_at_snapshot: doc.status,
    author_type: authorType,
    change_reason: changeReason ?? null,
    created_by: admin.userId,
  });

  return !error;
}

/**
 * Transition a document's lifecycle status. Publishing stamps publish
 * metadata and propagates audience (roles + sites) to its chunks so the
 * staff RAG/library pipeline reflects the latest access scope.
 */
export async function setDocumentStatus(
  documentId: string,
  status: AdminDocumentStatus,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const update: Database["public"]["Tables"]["documents"]["Update"] = { status };

  if (status === "approved") {
    update.approved_by = admin.userId;
  }

  if (status === "published") {
    update.published_at = new Date().toISOString();
    update.published_by = admin.userId;
    if (!update.effective_date) {
      // default effective date to today if not set
    }
  }

  const { error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", documentId)
    .eq("tenant_id", admin.tenantId);

  if (error) return false;

  if (status === "published") {
    // Propagate role/site audience to chunks for retrieval scoping.
    const { data: doc } = await supabase
      .from("documents")
      .select("roles_relevant, site_ids")
      .eq("id", documentId)
      .single();

    if (doc) {
      await supabase
        .from("document_chunks")
        .update({
          allowed_roles: doc.roles_relevant ?? [],
          site_ids: doc.site_ids ?? [],
        })
        .eq("document_id", documentId)
        .eq("tenant_id", admin.tenantId);
    }
  }

  return true;
}

/** Delete a document (cascades to chunks/sections/versions). */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

/** Fetch minimal doc fields needed to run ingestion/validation server-side. */
export async function getDocumentForProcessing(documentId: string): Promise<{
  tenantId: string;
  title: string;
  content: string | null;
  documentType: string | null;
  sector: string | null;
  riskLevel: string | null;
  framework: string[];
  rolesRelevant: string[];
  siteIds: string[];
  version: string;
} | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select(
      "tenant_id, title, content, document_type, sector, risk_level, framework, roles_relevant, site_ids, version",
    )
    .eq("id", documentId)
    .eq("tenant_id", admin.tenantId)
    .single();

  if (!doc) return null;

  return {
    tenantId: doc.tenant_id,
    title: doc.title,
    content: doc.content,
    documentType: doc.document_type,
    sector: doc.sector,
    riskLevel: doc.risk_level,
    framework: doc.framework ?? [],
    rolesRelevant: doc.roles_relevant ?? [],
    siteIds: doc.site_ids ?? [],
    version: doc.version,
  };
}
