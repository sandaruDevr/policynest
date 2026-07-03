-- =====================================================================
-- Phase 5: Organization Admin Foundation
-- ---------------------------------------------------------------------
-- Adds:
--   1. System-role helper functions (role + admin check)
--   2. Admin-scoped RLS so org admins can manage tenant profiles & sites
--   3. admin_audit_log table for tamper-evident admin action logging
--
-- Idempotent: safe to re-run. Run AFTER schema.sql + phase1_extensions.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Role helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------

-- Returns the current authenticated user's system role.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Returns true when the current user holds an organization-admin grade role.
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('organisation_admin', 'compliance_manager', 'platform_admin')
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Admin-scoped RLS policies
-- ---------------------------------------------------------------------

-- Profiles: admins can view + update every profile within their tenant.
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON profiles;
CREATE POLICY "Admins can view tenant profiles"
ON profiles
FOR SELECT
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

DROP POLICY IF EXISTS "Admins can update tenant profiles" ON profiles;
CREATE POLICY "Admins can update tenant profiles"
ON profiles
FOR UPDATE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
)
WITH CHECK (
  tenant_id = current_user_tenant_id()
);

-- Sites: admins can create / update / delete sites within their tenant.
-- (Tenant-wide SELECT already granted in phase1_extensions.sql.)
DROP POLICY IF EXISTS "Admins can insert tenant sites" ON sites;
CREATE POLICY "Admins can insert tenant sites"
ON sites
FOR INSERT
WITH CHECK (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

DROP POLICY IF EXISTS "Admins can update tenant sites" ON sites;
CREATE POLICY "Admins can update tenant sites"
ON sites
FOR UPDATE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
)
WITH CHECK (
  tenant_id = current_user_tenant_id()
);

DROP POLICY IF EXISTS "Admins can delete tenant sites" ON sites;
CREATE POLICY "Admins can delete tenant sites"
ON sites
FOR DELETE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

-- ---------------------------------------------------------------------
-- 3. admin_audit_log: tamper-evident record of privileged admin actions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,            -- e.g. 'document.publish', 'user.role.update'
  target_type text,                -- e.g. 'document', 'profile', 'site'
  target_id text,
  summary text,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read their tenant's audit trail.
DROP POLICY IF EXISTS "Admins can view tenant audit log" ON admin_audit_log;
CREATE POLICY "Admins can view tenant audit log"
ON admin_audit_log
FOR SELECT
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

-- Admins can append audit entries for their tenant (server derives actor).
DROP POLICY IF EXISTS "Admins can insert tenant audit log" ON admin_audit_log;
CREATE POLICY "Admins can insert tenant audit log"
ON admin_audit_log
FOR INSERT
WITH CHECK (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_tenant_idx ON admin_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON admin_audit_log(target_type, target_id);
