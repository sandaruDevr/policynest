import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DocumentSummary,
  DocumentDetail,
  DocumentSection,
  RelatedItem,
} from "@/types";

type DbDocument = Database["public"]["Tables"]["documents"]["Row"];
type DbDocumentSection = Database["public"]["Tables"]["document_sections"]["Row"];
type DbDocumentRelated = Database["public"]["Tables"]["document_related"]["Row"];
type DbDocumentBookmark = Database["public"]["Tables"]["document_bookmarks"]["Row"];
type DbDocumentAcknowledgement =
  Database["public"]["Tables"]["document_acknowledgements"]["Row"];

const mapDocumentSummary = (
  doc: DbDocument,
  bookmarked = false,
): DocumentSummary => ({
  id: doc.id,
  title: doc.title,
  shortTitle: doc.short_title ?? undefined,
  type: (doc.document_type as DocumentSummary["type"]) || "policy",
  version: doc.version,
  status: doc.status === "published" || doc.status === "updated"
    ? (doc.status as DocumentSummary["status"])
    : "published",
  sectors: (doc.sector ? [doc.sector as any] : []) as any,
  rolesRelevant: (doc.roles_relevant as any) || [],
  tags: doc.tags || [],
  category: doc.category || "General",
  pillar: doc.pillar ?? undefined,
  effectiveAt: doc.effective_date || doc.created_at,
  updatedAt: doc.updated_at,
  bookmarked,
  offlineAvailable: doc.offline_available || false,
  recentlyUsedByAI: false,
  estimatedReadMinutes: doc.estimated_read_minutes ?? undefined,
  emergencyRelated: doc.emergency_related || false,
});

const mapDocumentSection = (
  section: DbDocumentSection,
): DocumentSection => ({
  id: section.id,
  anchor: section.anchor,
  title: section.title,
  body: section.body || "",
});

const mapRelatedItem = (related: DbDocumentRelated): RelatedItem => ({
  id: related.related_id,
  title: related.title,
  type: related.related_type as RelatedItem["type"],
});

export async function listDocuments(): Promise<DocumentSummary[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const [{ data: documents }, { data: bookmarks }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .in("status", ["published", "updated"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("document_bookmarks")
      .select("document_id")
      .eq("profile_id", user.id),
  ]);

  const bookmarkedIds = new Set(bookmarks?.map((b) => b.document_id) || []);

  return (
    documents?.map((doc) =>
      mapDocumentSummary(doc, bookmarkedIds.has(doc.id)),
    ) || []
  );
}

export async function getDocument(
  id: string,
): Promise<DocumentDetail | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const [
    { data: doc },
    { data: sections },
    { data: related },
    { data: bookmark },
    { data: acknowledgement },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single(),
    supabase
      .from("document_sections")
      .select("*")
      .eq("document_id", id)
      .order("ord", { ascending: true }),
    supabase
      .from("document_related")
      .select("*")
      .eq("document_id", id),
    supabase
      .from("document_bookmarks")
      .select("*")
      .eq("profile_id", user.id)
      .eq("document_id", id)
      .single(),
    supabase
      .from("document_acknowledgements")
      .select("*")
      .eq("profile_id", user.id)
      .eq("document_id", id)
      .order("signed_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!doc) return null;

  const bookmarked = !!bookmark;
  const acknowledged = !!acknowledgement;

  return {
    ...mapDocumentSummary(doc, bookmarked),
    summary: doc.summary || "",
    sections: sections?.map(mapDocumentSection) || [],
    guidedSteps: [],
    relatedForms: related
      ?.filter((r) => r.related_type === "form")
      .map(mapRelatedItem) || [],
    relatedFaqs:
      related?.filter((r) => r.related_type === "faq").map(mapRelatedItem) ||
      [],
    acknowledgementRequired: doc.acknowledgement_required || false,
  };
}

export async function searchDocuments(query: string): Promise<DocumentSummary[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .in("status", ["published", "updated"])
    .textSearch("search_tsv", query, {
      type: "websearch",
      config: "english",
    })
    .order("updated_at", { ascending: false })
    .limit(20);

  return documents?.map((doc) => mapDocumentSummary(doc)) || [];
}

export async function toggleBookmark(documentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: existing } = await supabase
    .from("document_bookmarks")
    .select("*")
    .eq("profile_id", user.id)
    .eq("document_id", documentId)
    .single();

  if (existing) {
    await supabase
      .from("document_bookmarks")
      .delete()
      .eq("profile_id", user.id)
      .eq("document_id", documentId);
    return false;
  } else {
    await supabase.from("document_bookmarks").insert({
      profile_id: user.id,
      tenant_id: profile.tenant_id,
      document_id: documentId,
    });
    return true;
  }
}

export async function acknowledgeDocument(
  documentId: string,
  version: string,
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  await supabase.from("document_acknowledgements").insert({
    tenant_id: profile.tenant_id,
    profile_id: user.id,
    document_id: documentId,
    version,
  });
}

export async function unacknowledgeDocument(documentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("document_acknowledgements")
    .delete()
    .eq("profile_id", user.id)
    .eq("document_id", documentId);
}

export async function isDocumentAcknowledged(documentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("document_acknowledgements")
    .select("id")
    .eq("profile_id", user.id)
    .eq("document_id", documentId)
    .single();

  return !!data;
}
