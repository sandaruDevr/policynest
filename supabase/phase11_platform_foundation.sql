-- =====================================================================
-- Phase 11: Super Admin Platform Foundation
-- ---------------------------------------------------------------------
-- Establishes the platform-governance security boundary using PostgreSQL
-- RLS as the PRIMARY enforcement mechanism (no service-role bypass for
-- normal platform operations).
--
-- Design (Option A — Platform RLS + internal platform tenant):
--   * A fixed internal "CareSuite Platform" tenant owns all platform
--     resources (platform admins, master templates, platform golden
--     answers, framework/legislation registries, AI governance, ops).
--   * Platform admins are normal `profiles` rows that live INSIDE the
--     platform tenant, so every existing `tenant_id` FK stays intact.
--   * Cross-tenant visibility is granted via ADDITIVE platform RLS
--     policies (Postgres ORs permissive policies together), leaving all
--     existing tenant-scoped policies untouched.
--   * Org admins and staff remain strictly tenant-scoped.
--   * Auditor / read-only platform roles can be layered later without
--     redesign (add a role check inside the helper).
--
-- Idempotent. Run AFTER schema.sql, phase1_extensions.sql,
-- phase5_admin_foundation.sql, phase9_role_differentiation.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. The internal platform tenant (fixed, well-known UUID)
-- ---------------------------------------------------------------------
INSERT INTO tenants (id, name, industry, country)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CareSuite Platform',
  'platform',
  'Australia'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Tenant lifecycle columns (needed platform-wide for management)
--    Kept minimal here; Phase 2 expands billing / feature flags / usage.
-- ---------------------------------------------------------------------
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('provisioning', 'active', 'suspended', 'archived')),
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_platform boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Flag the internal tenant so it can be excluded from customer listings.
UPDATE tenants
SET is_platform = true
WHERE id = '00000000-0000-0000-0000-000000000001';

DROP TRIGGER IF EXISTS set_tenants_updated_at ON tenants;
CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Platform identity helper functions (SECURITY DEFINER -> no RLS
--    recursion when referenced inside policies on `profiles`).
-- ---------------------------------------------------------------------

-- The canonical platform tenant id. Centralized so the constant is never
-- duplicated across policies / application code.
CREATE OR REPLACE FUNCTION current_platform_tenant_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$;

-- True only for platform admins, who MUST reside in the platform tenant.
-- This is the single gate for all cross-tenant platform access.
CREATE OR REPLACE FUNCTION current_user_is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'platform_admin'
      AND tenant_id = current_platform_tenant_id()
  );
$$;

-- ---------------------------------------------------------------------
-- 4. platform_audit_log: tamper-evident, CROSS-TENANT platform actions.
--    Distinct from per-tenant admin_audit_log. Lives in the platform
--    tenant; `target_tenant_id` records which org an action affected.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,              -- e.g. 'tenant.suspend', 'template.publish'
  target_type text,                  -- e.g. 'tenant', 'master_template', 'ai_model'
  target_id text,
  target_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  summary text,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view platform audit" ON platform_audit_log;
CREATE POLICY "Platform admins can view platform audit"
ON platform_audit_log
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert platform audit" ON platform_audit_log;
CREATE POLICY "Platform admins can insert platform audit"
ON platform_audit_log
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS platform_audit_log_created_idx ON platform_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_log_actor_idx ON platform_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS platform_audit_log_target_idx ON platform_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS platform_audit_log_tenant_idx ON platform_audit_log(target_tenant_id);

-- ---------------------------------------------------------------------
-- 5. ADDITIVE platform RLS policies (cross-tenant visibility).
--    Each is a separate, named, permissive policy: Postgres ORs these
--    with the existing tenant-scoped policies, so org admins / staff are
--    unaffected and platform admins gain read access across all tenants.
-- ---------------------------------------------------------------------

-- Tenants: platform admins manage the full tenant directory.
DROP POLICY IF EXISTS "Platform admins can view all tenants" ON tenants;
CREATE POLICY "Platform admins can view all tenants"
ON tenants FOR SELECT USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert tenants" ON tenants;
CREATE POLICY "Platform admins can insert tenants"
ON tenants FOR INSERT WITH CHECK (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update tenants" ON tenants;
CREATE POLICY "Platform admins can update tenants"
ON tenants FOR UPDATE
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Profiles: cross-tenant read for platform user oversight.
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON profiles;
CREATE POLICY "Platform admins can view all profiles"
ON profiles FOR SELECT USING (current_user_is_platform_admin());

-- Sites: cross-tenant read.
DROP POLICY IF EXISTS "Platform admins can view all sites" ON sites;
CREATE POLICY "Platform admins can view all sites"
ON sites FOR SELECT USING (current_user_is_platform_admin());

-- Documents + chunks: cross-tenant read (governance / lineage oversight).
DROP POLICY IF EXISTS "Platform admins can view all documents" ON documents;
CREATE POLICY "Platform admins can view all documents"
ON documents FOR SELECT USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can view all chunks" ON document_chunks;
CREATE POLICY "Platform admins can view all chunks"
ON document_chunks FOR SELECT USING (current_user_is_platform_admin());

-- RAG audit logs: cross-tenant read (AI oversight / analytics).
DROP POLICY IF EXISTS "Platform admins can view all RAG logs" ON rag_audit_logs;
CREATE POLICY "Platform admins can view all RAG logs"
ON rag_audit_logs FOR SELECT USING (current_user_is_platform_admin());

-- HITL queue: cross-tenant read (platform HITL center).
DROP POLICY IF EXISTS "Platform admins can view all HITL" ON hitl_queue;
CREATE POLICY "Platform admins can view all HITL"
ON hitl_queue FOR SELECT USING (current_user_is_platform_admin());

-- Golden answers: cross-tenant read.
DROP POLICY IF EXISTS "Platform admins can view all golden answers" ON golden_answers;
CREATE POLICY "Platform admins can view all golden answers"
ON golden_answers FOR SELECT USING (current_user_is_platform_admin());

-- Incidents: cross-tenant read (platform safety analytics).
DROP POLICY IF EXISTS "Platform admins can view all incidents" ON incidents;
CREATE POLICY "Platform admins can view all incidents"
ON incidents FOR SELECT USING (current_user_is_platform_admin());

-- Per-tenant admin audit: cross-tenant read (platform security oversight).
DROP POLICY IF EXISTS "Platform admins can view all admin audit" ON admin_audit_log;
CREATE POLICY "Platform admins can view all admin audit"
ON admin_audit_log FOR SELECT USING (current_user_is_platform_admin());

-- ---------------------------------------------------------------------
-- 6. Aggregated tenant directory (scales to thousands of tenants via a
--    single query). `security_invoker = on` ensures the view honours the
--    querying user's RLS — so only platform admins see cross-tenant rows.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW platform_tenant_overview
WITH (security_invoker = on) AS
SELECT
  t.id,
  t.name,
  t.industry,
  t.country,
  t.state_or_territory,
  t.status,
  t.plan,
  t.created_at,
  t.updated_at,
  COALESCE(pc.cnt, 0)::int AS user_count,
  COALESCE(dc.cnt, 0)::int AS document_count
FROM tenants t
LEFT JOIN (
  SELECT tenant_id, count(*) AS cnt FROM profiles GROUP BY tenant_id
) pc ON pc.tenant_id = t.id
LEFT JOIN (
  SELECT tenant_id, count(*) AS cnt FROM documents GROUP BY tenant_id
) dc ON dc.tenant_id = t.id
WHERE t.is_platform = false;

-- ---------------------------------------------------------------------
-- 7. Bootstrapping the first platform admin (MANUAL — needs a real
--    auth.users id). Create the auth user via Supabase Auth first, then:
--
--    UPDATE profiles
--    SET role = 'platform_admin',
--        tenant_id = current_platform_tenant_id()
--    WHERE id = '<auth-user-uuid>';
--
--    (A profile row is created by your existing signup trigger / flow.)
-- ---------------------------------------------------------------------
