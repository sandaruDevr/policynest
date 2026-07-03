-- Migration: Upgrade embedding dimensions from 1536 to 3072 (text-embedding-3-large)
-- Run this in Supabase SQL Editor

-- 1. Drop existing function and index (they depend on the vector column dimension)
DROP FUNCTION IF EXISTS match_tenant_documents(extensions.vector, uuid, int, text, uuid, jsonb, float);
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- 2. Clear existing chunks (old 1536-dim embeddings are incompatible)
TRUNCATE TABLE document_chunks;

-- 3. Alter the embedding column to 3072 dimensions
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE extensions.vector(3072);

-- 4. Recreate the match function with new dimensions
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
    1 - (dc.embedding <=> query_embedding) AS similarity
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
    AND (1 - (dc.embedding <=> query_embedding)) >= min_similarity
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Recreate the vector index
-- Note: ivfflat supports up to 2000 dims by default. For 3072 dims, use halfvec or no index.
-- For prototype scale, sequential scan is fine. Index creation may fail; that's OK.
DO $$
BEGIN
  BEGIN
    CREATE INDEX document_chunks_embedding_idx
      ON document_chunks
      USING ivfflat (embedding extensions.vector_cosine_ops)
      WITH (lists = 100);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create ivfflat index for 3072 dims. Using sequential scan (fine for prototype).';
  END;
END $$;
