-- =====================================================================
-- Phase 6: Document Governance
-- ---------------------------------------------------------------------
-- Extends the documents pipeline for Organization Admin governance:
--   1. Lineage / master-shadow / publish metadata on `documents`
--   2. `document_versions` immutable snapshots (diff + AI-vs-human lineage)
--   3. `document_validations` AI compliance validation results
--   4. Admin RLS (delete documents, manage versions & validations)
--
-- Idempotent. Run AFTER schema.sql, phase2_library_extensions.sql,
-- phase5_admin_foundation.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Governance + lineage columns on documents
-- ---------------------------------------------------------------------
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS origin_type text NOT NULL DEFAULT 'organisation'
    CHECK (origin_type IN ('organisation', 'platform_shadow', 'master')),
  ADD COLUMN IF NOT EXISTS source_template_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_due_at date,
  ADD COLUMN IF NOT EXISTS change_reason text,
  ADD COLUMN IF NOT EXISTS content text;  -- canonical source text (markdown)

CREATE INDEX IF NOT EXISTS documents_origin_idx ON documents(tenant_id, origin_type);
CREATE INDEX IF NOT EXISTS documents_source_template_idx ON documents(source_template_id);

-- ---------------------------------------------------------------------
-- 2. document_versions: immutable snapshots
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  metadata jsonb NOT NULL DEFAULT '{}',
  status_at_snapshot text,
  -- distinguishes machine-authored vs human-authored changes for lineage
  author_type text NOT NULL DEFAULT 'human' CHECK (author_type IN ('human', 'ai', 'platform')),
  change_reason text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_versions_document_idx ON document_versions(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS document_versions_tenant_idx ON document_versions(tenant_id);

-- ---------------------------------------------------------------------
-- 3. document_validations: AI compliance validation results
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pass', 'warn', 'fail')),
  score numeric,
  frameworks jsonb NOT NULL DEFAULT '[]',   -- [{framework, coverage, status}]
  gaps jsonb NOT NULL DEFAULT '[]',         -- [{title, severity, detail}]
  flags jsonb NOT NULL DEFAULT '[]',        -- [{type, detail}] drift/outdated
  blockers jsonb NOT NULL DEFAULT '[]',     -- critical issues preventing publish
  summary text,
  model text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_validations_document_idx ON document_validations(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS document_validations_tenant_idx ON document_validations(tenant_id);

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;

-- Admins can delete documents within their tenant (cascade clears chunks).
DROP POLICY IF EXISTS "Admins can delete tenant documents" ON documents;
CREATE POLICY "Admins can delete tenant documents"
ON documents
FOR DELETE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

-- Admins can delete chunks (e.g. re-ingest) within their tenant.
DROP POLICY IF EXISTS "Admins can delete tenant chunks" ON document_chunks;
CREATE POLICY "Admins can delete tenant chunks"
ON document_chunks
FOR DELETE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

-- document_versions: admins read + append within tenant.
DROP POLICY IF EXISTS "Admins can view tenant doc versions" ON document_versions;
CREATE POLICY "Admins can view tenant doc versions"
ON document_versions
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND current_user_is_admin());

DROP POLICY IF EXISTS "Admins can insert tenant doc versions" ON document_versions;
CREATE POLICY "Admins can insert tenant doc versions"
ON document_versions
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND current_user_is_admin());

-- document_validations: admins read + append within tenant.
DROP POLICY IF EXISTS "Admins can view tenant validations" ON document_validations;
CREATE POLICY "Admins can view tenant validations"
ON document_validations
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND current_user_is_admin());

DROP POLICY IF EXISTS "Admins can insert tenant validations" ON document_validations;
CREATE POLICY "Admins can insert tenant validations"
ON document_validations
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND current_user_is_admin());
