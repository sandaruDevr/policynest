import "server-only";
import { callInternalExpress } from "@/lib/server/internal-express";
import { updateDocumentMeta, snapshotVersion } from "@/lib/data/admin/documents";
import { recordAdminAction } from "@/lib/data/admin/audit";
import type { CreateDocumentInput } from "@/lib/data/admin/documents";

export interface ProcessResult {
  success: boolean;
  chunks: number;
  structured: boolean;
  structuredContent: string;
  summary: string;
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedRiskLevel: string;
  suggestedTags: string;
  suggestedSector: string;
}

/**
 * Run the AI structuring + embedding pipeline for a document and persist
 * the cleaned content, summary, and suggested metadata back to the DB.
 *
 * Called automatically after every content save / upload / creation.
 */
export async function ingestDocument(
  documentId: string,
  tenantId: string,
  text: string,
  options: {
    title: string;
    sector?: string;
    framework?: string[];
    riskLevel?: string;
    allowedRoles?: string[];
    siteIds?: string[];
  },
): Promise<ProcessResult> {
  const result = await callInternalExpress<ProcessResult>(
    "/api/documents/process",
    {
      document_id: documentId,
      tenant_id: tenantId,
      text,
      options: {
        title: options.title,
        sector: options.sector || "",
        framework: options.framework || [],
        riskLevel: options.riskLevel || "",
        allowedRoles: options.allowedRoles || [],
        siteIds: options.siteIds || [],
        structure: true,
      },
    },
  );

  if (!result.ok) {
    throw new Error(result.error || "Ingestion failed");
  }

  const data = result.data;

  // Persist structured content, auto-summary, and suggested metadata.
  // Metadata is only written when the current value is empty, so user
  // overrides are never clobbered.
  await updateDocumentMeta(documentId, {
    content: data.structuredContent || text,
    summary: data.summary || undefined,
    ...(data.suggestedCategory && { category: data.suggestedCategory }),
    ...(data.suggestedRiskLevel && { riskLevel: data.suggestedRiskLevel }),
    ...(data.suggestedSector && { sector: data.suggestedSector }),
    ...(data.suggestedTags && {
      tags: data.suggestedTags
        .split(/,\s*/)
        .map((s: string) => s.trim())
        .filter(Boolean),
    }),
  });

  // Snapshot for lineage
  await snapshotVersion(documentId, "ai", "Auto-structured & ingested");

  await recordAdminAction({
    action: "document.process",
    targetType: "document",
    targetId: documentId,
    summary: `Auto-ingested ${data.chunks} chunks`,
    meta: { chunks: data.chunks, structured: data.structured },
  });

  return data;
}
