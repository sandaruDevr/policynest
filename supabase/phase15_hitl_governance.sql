-- =====================================================================
-- Phase 15: Platform HITL Governance Center
-- ---------------------------------------------------------------------
-- Adds:
--   1. hitl_sla_config — platform-level SLA thresholds per risk level
--   2. platform_hitl_overview view — cross-tenant HITL queue with tenant
--      name, SLA breach flags, and aging
--   3. Platform RLS UPDATE on hitl_queue for cross-tenant review actions
--   4. Indexes for efficient cross-tenant querying
--
-- Idempotent. Run AFTER phase14_ai_governance.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. hitl_sla_config — SLA thresholds per risk level
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hitl_sla_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_level text NOT NULL UNIQUE,                -- 'low', 'medium', 'high', 'critical'
  sla_hours integer NOT NULL,                     -- target review time in hours
  escalation_hours integer,                       -- when to escalate beyond SLA
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hitl_sla_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage SLA config" ON hitl_sla_config;
CREATE POLICY "Platform admins can manage SLA config"
ON hitl_sla_config
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Seed default SLAs
INSERT INTO hitl_sla_config (risk_level, sla_hours, escalation_hours)
VALUES
  ('low', 72, 120),
  ('medium', 48, 72),
  ('high', 24, 36),
  ('critical', 4, 8)
ON CONFLICT (risk_level) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. platform_hitl_overview view — cross-tenant HITL with enrichment
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW platform_hitl_overview
WITH (security_invoker = on) AS
SELECT
  h.id,
  h.tenant_id,
  t.name AS tenant_name,
  h.user_id,
  u.email AS user_email,
  u.full_name AS user_name,
  h.query,
  h.draft_answer,
  h.confidence,
  h.risk_level,
  h.status,
  h.reviewer_id,
  h.reviewed_answer,
  h.review_notes,
  h.created_at,
  h.reviewed_at,
  EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 AS age_hours,
  CASE
    WHEN h.status != 'pending' THEN false
    WHEN h.risk_level = 'critical' AND EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 > 4 THEN true
    WHEN h.risk_level = 'high' AND EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 > 24 THEN true
    WHEN h.risk_level = 'medium' AND EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 > 48 THEN true
    WHEN h.risk_level = 'low' AND EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 > 72 THEN true
    WHEN h.risk_level IS NULL AND EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600 > 48 THEN true
    ELSE false
  END AS sla_breached
FROM hitl_queue h
JOIN tenants t ON t.id = h.tenant_id
LEFT JOIN profiles u ON u.id = h.user_id
WHERE t.id != '00000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------
-- 3. Platform RLS UPDATE on hitl_queue for cross-tenant review
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Platform admins can update HITL items" ON hitl_queue;
CREATE POLICY "Platform admins can update HITL items"
ON hitl_queue
FOR UPDATE
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- ---------------------------------------------------------------------
-- 4. Indexes for cross-tenant HITL queries
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS hitl_queue_status_created_idx
  ON hitl_queue(status, created_at DESC);

CREATE INDEX IF NOT EXISTS hitl_queue_risk_status_idx
  ON hitl_queue(risk_level, status)
  WHERE status = 'pending';
