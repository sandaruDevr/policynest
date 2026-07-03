-- =====================================================================
-- Phase 9: Role Differentiation (Org Admin vs Compliance Manager)
-- ---------------------------------------------------------------------
-- Adds:
--   1. current_user_is_org_admin() function (excludes compliance_manager)
--   2. RLS policy updates for profiles and sites to use org-admin check
--   3. Compliance manager retains access to documents and audits only
--
-- Idempotent. Run AFTER phase5_admin_foundation.sql, phase7_users_sites.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add current_user_is_org_admin() function
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_is_org_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('organisation_admin', 'platform_admin')
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Update profiles RLS policies for write operations (user management)
-- ---------------------------------------------------------------------

-- Profiles UPDATE: only org-admin can update profiles
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON profiles;
CREATE POLICY "Admins can update tenant profiles"
ON profiles
FOR UPDATE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_org_admin()
)
WITH CHECK (
  tenant_id = current_user_tenant_id()
);

-- Profiles INSERT: only org-admin can insert profiles
DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON profiles;
CREATE POLICY "Admins can insert tenant profiles"
ON profiles
FOR INSERT
WITH CHECK (
  tenant_id = current_user_tenant_id()
  AND current_user_is_org_admin()
);

-- ---------------------------------------------------------------------
-- 3. Update sites RLS policies for write operations (site management)
-- ---------------------------------------------------------------------

-- Sites INSERT: only org-admin can insert sites
DROP POLICY IF EXISTS "Admins can insert tenant sites" ON sites;
CREATE POLICY "Admins can insert tenant sites"
ON sites
FOR INSERT
WITH CHECK (
  tenant_id = current_user_tenant_id()
  AND current_user_is_org_admin()
);

-- Sites UPDATE: only org-admin can update sites
DROP POLICY IF EXISTS "Admins can update tenant sites" ON sites;
CREATE POLICY "Admins can update tenant sites"
ON sites
FOR UPDATE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_org_admin()
)
WITH CHECK (
  tenant_id = current_user_tenant_id()
);

-- Sites DELETE: only org-admin can delete sites
DROP POLICY IF EXISTS "Admins can delete tenant sites" ON sites;
CREATE POLICY "Admins can delete tenant sites"
ON sites
FOR DELETE
USING (
  tenant_id = current_user_tenant_id()
  AND current_user_is_org_admin()
);

-- ---------------------------------------------------------------------
-- 4. Documents and audit policies remain unchanged
--    (current_user_is_admin() allows all admin roles)
-- ---------------------------------------------------------------------

-- NOTE: The following policies are NOT changed - they continue to use
-- current_user_is_admin() which allows compliance_manager access:
-- - Admins can view tenant profiles (SELECT)
-- - Admins can delete tenant documents
-- - Admins can delete tenant chunks
-- - Admins can view/insert document_versions
-- - Admins can view/insert document_validations
-- - Admins can view/insert tenant audit log
