import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Citation,
  ConfidenceLevel,
  ConversationTurn,
  GuidanceBlock,
} from "@/types";

function mapConfidence(numeric: number | null | undefined): ConfidenceLevel {
  if (numeric === null || numeric === undefined) return "low";
  if (numeric >= 0.85) return "high";
  if (numeric >= 0.7) return "medium";
  return "low";
}

function buildBlocks(answer: string | null, rawCitations: unknown): GuidanceBlock[] {
  const blocks: GuidanceBlock[] = [];
  if (answer && answer.trim()) {
    blocks.push({ kind: "summary", text: answer.trim() });
  }

  if (Array.isArray(rawCitations) && rawCitations.length > 0) {
    const citations: Citation[] = rawCitations
      .map((c): Citation | null => {
        if (!c || typeof c !== "object") return null;
        const cit = c as Record<string, unknown>;
        return {
          id: String(cit.id ?? cit.chunk_id ?? cit.document_id ?? crypto.randomUUID()),
          documentId: String(cit.document_id ?? cit.documentId ?? ""),
          documentTitle: String(cit.title ?? cit.document_title ?? "Document"),
          sectionAnchor:
            cit.section_anchor != null ? String(cit.section_anchor) : undefined,
          sectionTitle:
            cit.section_title != null ? String(cit.section_title) : undefined,
          snippet: String(cit.snippet ?? cit.content ?? cit.text ?? ""),
          version: String(cit.version ?? "1.0"),
          effectiveAt: String(cit.effective_at ?? new Date().toISOString()),
        };
      })
      .filter((c): c is Citation => c !== null);

    if (citations.length > 0) {
      blocks.push({ kind: "citations", citations });
    }
  }

  return blocks;
}

/**
 * Reconstruct the signed-in user's recent assistant conversation from the
 * persisted RAG audit trail (`rag_audit_logs`). Returns turns in chronological
 * order so the workspace renders oldest -> newest. Provides cross-device
 * continuity beyond the browser's localStorage cache.
 */
export async function listConversationHistory(
  limit = 20,
): Promise<ConversationTurn[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("rag_audit_logs")
    .select("id, query, answer, citations, confidence, escalated, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows) return [];

  // Re-sort ascending for natural conversation reading order.
  const ordered = [...rows].reverse();

  return ordered.map((r): ConversationTurn => {
    const policyNotFound = !r.answer || r.answer.trim().length === 0;
    return {
      query: {
        id: `${r.id}-q`,
        text: r.query,
        locale: "en-AU",
        mode: "standard",
        voice: false,
        createdAt: r.created_at,
      },
      response: {
        id: r.id,
        queryId: `${r.id}-q`,
        createdAt: r.created_at,
        confidence: mapConfidence(r.confidence),
        escalate: r.escalated,
        blocks: buildBlocks(r.answer, r.citations),
        nextActions: [],
        policyNotFound,
      },
      state: "complete",
    };
  });
}
