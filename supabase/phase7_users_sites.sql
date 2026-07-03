-- =====================================================================
-- Phase 7: Users & Sites administration
-- ---------------------------------------------------------------------
-- Adds workforce-management fields to `profiles`, email denormalization
-- (synced from auth.users), and admin INSERT capability for profiles.
--
-- Idempotent. Run AFTER phase5_admin_foundation.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Workforce columns on profiles
-- ---------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive'));

CREATE INDEX IF NOT EXISTS profiles_tenant_status_idx ON profiles(tenant_id, status);

-- ---------------------------------------------------------------------
-- 2. Email sync from auth.users (denormalized for admin directory)
-- ---------------------------------------------------------------------

-- Backfill existing rows whose email is not yet populated.
CREATE OR REPLACE FUNCTION admin_backfill_profile_emails()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE u.id = p.id
    AND (p.email IS NULL OR p.email = '');
$$;

SELECT admin_backfill_profile_emails();

-- Keep profiles.email in sync when an auth user is created/updated.
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_email ON auth.users;
CREATE TRIGGER trg_sync_profile_email
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();

-- ---------------------------------------------------------------------
-- 3. Admin INSERT on profiles (service-role create bypasses RLS, but this
--    permits admin-context inserts where used).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON profiles;
CREATE POLICY "Admins can insert tenant profiles"
ON profiles
FOR INSERT
WITH CHECK (
  tenant_id = current_user_tenant_id()
  AND current_user_is_admin()
);
