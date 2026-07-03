-- =====================================================================
-- Phase 8: AI Governance
-- ---------------------------------------------------------------------
-- Adds per-tenant AI configuration, links golden answers back to the
-- originating HITL review (lineage), and HITL review metadata. Surfaces
-- the existing hitl_queue / golden_answers / rag_audit_logs tables to
-- the Organization Admin console.
--
-- Idempotent. Run AFTER phase5_admin_foundation.sql (needs
-- current_user_tenant_id() and current_user_is_admin()).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenant AI settings (one row per tenant)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_ai_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Assistant behaviour
  assistant_enabled boolean NOT NULL DEFAULT true,
  -- Confidence below which an answer is routed to the HITL queue.
  hitl_confidence_threshold numeric NOT NULL DEFAULT 0.85
    CHECK (hitl_confidence_threshold >= 0 AND hitl_confidence_threshold <= 1),
  -- Always send these scenario classes to human review regardless of confidence.
  escalate_high_risk boolean NOT NULL DEFAULT true,
  -- Whether golden answers may be served directly (bypassing RAG).
  golden_answers_enabled boolean NOT NULL DEFAULT true,
  -- Min retrieval similarity for a chunk to be considered relevant.
  min_retrieval_similarity numeric NOT NULL DEFAULT 0.20
    CHECK (min_retrieval_similarity >= 0 AND min_retrieval_similarity <= 1),
  -- Number of chunks pulled per query.
  retrieval_top_k integer NOT NULL DEFAULT 8
    CHECK (retrieval_top_k > 0 AND retrieval_top_k <= 50),
  -- Optional tenant-specific guidance appended to the system prompt.
  custom_guidance text,

  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users can view AI settings" ON tenant_ai_settings;
CREATE POLICY "Tenant users can view AI settings"
ON tenant_ai_settings
FOR SELECT
USING (tenant_id = current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage AI settings" ON tenant_ai_settings;
CREATE POLICY "Admins can manage AI settings"
ON tenant_ai_settings
FOR ALL
USING (tenant_id = current_user_tenant_id() AND current_user_is_admin())
WITH CHECK (tenant_id = current_user_tenant_id() AND current_user_is_admin());

DROP TRIGGER IF EXISTS set_tenant_ai_settings_updated_at ON tenant_ai_settings;
CREATE TRIGGER set_tenant_ai_settings_updated_at
BEFORE UPDATE ON tenant_ai_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Seed a default settings row for every existing tenant.
INSERT INTO tenant_ai_settings (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Golden answer lineage — link to originating HITL review (if promoted)
-- ---------------------------------------------------------------------
ALTER TABLE golden_answers
  ADD COLUMN IF NOT EXISTS source_hitl_id uuid REFERENCES hitl_queue(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 3. HITL review metadata (notes left by reviewer)
-- ---------------------------------------------------------------------
ALTER TABLE hitl_queue
  ADD COLUMN IF NOT EXISTS review_notes text;

CREATE INDEX IF NOT EXISTS hitl_queue_tenant_status_idx
  ON hitl_queue(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS rag_audit_logs_tenant_created_idx
  ON rag_audit_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS golden_answers_tenant_status_idx
  ON golden_answers(tenant_id, status);
