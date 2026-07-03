-- =====================================================================
-- Phase 10: Scalable Vector Search (HNSW via halfvec)
-- ---------------------------------------------------------------------
-- Problem:
--   document_chunks.embedding is vector(3072) (text-embedding-3-large).
--   pgvector's ivfflat/hnsw indexes for the `vector` type only support up
--   to 2000 dimensions, so the 3072-dim column could not be indexed and
--   every similarity search fell back to a full sequential scan.
--
-- Solution:
--   Index a half-precision cast of the embedding using HNSW, which supports
--   up to 4000 dimensions via the `halfvec` type. This requires NO
--   re-embedding — the stored vector(3072) values are reused as-is, only
--   cast at index/query time. Recall impact from fp16 is negligible for
--   cosine similarity on normalized OpenAI embeddings.
--
-- Requirements: pgvector >= 0.7.0 (Supabase ships this).
-- Idempotent. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Drop the unusable / legacy indexes
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP INDEX IF EXISTS document_chunks_embedding_hnsw_idx;

-- ---------------------------------------------------------------------
-- 2. Create the HNSW index on the half-precision cast
--    m=16, ef_construction=64 are sound defaults for this scale.
-- ---------------------------------------------------------------------
CREATE INDEX document_chunks_embedding_hnsw_idx
  ON document_chunks
  USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ---------------------------------------------------------------------
-- 3. Recreate match_tenant_documents so ORDER BY matches the index
--    expression exactly (otherwise the planner ignores the HNSW index).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_tenant_documents (
  query_embedding extensions.vector(3072),
  input_tenant_id uuid,
  match_count int DEFAULT 8,
  input_user_role text DEFAULT NULL,
  input_site_id uuid DEFAULT NULL,
  filter jsonb DEFAULT '{}',
  min_similarity float DEFAULT 0.0
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  tenant_id uuid,
  content text,
  title text,
  document_type text,
  version text,
  section_title text,
  section_number text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  q halfvec(3072) := query_embedding::halfvec(3072);
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    dc.tenant_id,
    dc.content,
    d.title,
    d.document_type,
    d.version,
    dc.section_title,
    dc.section_number,
    dc.metadata,
    1 - ((dc.embedding::halfvec(3072)) <=> q) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE dc.tenant_id = input_tenant_id
    AND d.tenant_id = input_tenant_id
    AND d.status IN ('approved', 'published')
    AND (d.expiry_date IS NULL OR d.expiry_date >= current_date)
    AND (d.effective_date IS NULL OR d.effective_date <= current_date)
    AND (input_user_role IS NULL OR dc.allowed_roles = '{}' OR input_user_role = ANY(dc.allowed_roles))
    AND (input_site_id IS NULL OR dc.site_ids = '{}' OR input_site_id = ANY(dc.site_ids))
    AND dc.metadata @> filter
    AND (1 - ((dc.embedding::halfvec(3072)) <=> q)) >= min_similarity
  ORDER BY (dc.embedding::halfvec(3072)) <=> q
  LIMIT match_count;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. (Optional) Tune recall at query time per session if needed:
--    SET hnsw.ef_search = 100;  -- higher = better recall, slower
-- ---------------------------------------------------------------------
