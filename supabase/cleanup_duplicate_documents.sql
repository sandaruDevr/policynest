-- Cleanup duplicate documents
-- Run this in Supabase SQL Editor

-- 1. First, identify duplicates (same title + tenant_id)
SELECT 
  title, 
  tenant_id, 
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as document_ids,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM documents
GROUP BY title, tenant_id
HAVING COUNT(*) > 1;

-- 2. For each duplicate group, keep the earliest one and delete the rest
-- This uses a CTE to identify which to keep (earliest created_at)
WITH ranked_documents AS (
  SELECT 
    id,
    title,
    tenant_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY title, tenant_id ORDER BY created_at ASC) as rn
  FROM documents
)
DELETE FROM documents
WHERE id IN (
  SELECT id FROM ranked_documents WHERE rn > 1
);

-- 3. Verify cleanup
SELECT 
  title, 
  tenant_id, 
  COUNT(*) as count
FROM documents
GROUP BY title, tenant_id
HAVING COUNT(*) > 1;
