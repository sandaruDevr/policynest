-- =====================================================================
-- Phase 12: Platform Tenant Management
-- ---------------------------------------------------------------------
-- Adds:
--   1. tenant_plans — platform-defined subscription plans
--   2. tenant_feature_flags — per-tenant feature toggles
--   3. tenant_usage_meters — monthly usage tracking (AI, storage, users)
--   4. tenant_provisioning_log — audit trail for automated provisioning steps
--   5. Platform RLS policies on all new tables
--   6. provision_tenant() — SECURITY DEFINER function for automated onboarding
--      (creates tenant + default AI settings + default site + seeds plan)
--
-- Idempotent. Run AFTER phase11_platform_foundation.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. tenant_plans — platform-defined subscription plans
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_plans (
  id text PRIMARY KEY,                        -- e.g. 'starter', 'standard', 'enterprise'
  label text NOT NULL,
  description text,
  max_users integer NOT NULL DEFAULT 50,
  max_documents integer NOT NULL DEFAULT 500,
  max_sites integer NOT NULL DEFAULT 5,
  ai_queries_per_month integer,               -- NULL = unlimited
  storage_gb integer NOT NULL DEFAULT 10,
  hitl_enabled boolean NOT NULL DEFAULT true,
  golden_answers_enabled boolean NOT NULL DEFAULT true,
  custom_guidance_enabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage plans" ON tenant_plans;
CREATE POLICY "Platform admins can manage plans"
ON tenant_plans
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Seed default plans
INSERT INTO tenant_plans (id, label, description, max_users, max_documents, max_sites, ai_queries_per_month, storage_gb, sort_order) VALUES
  ('starter',  'Starter',     'For small organizations getting started',     25,   200,  3,  5000,   5, 10),
  ('standard', 'Standard',    'For growing organizations with active AI use', 100,  1000, 10, 50000,  20, 20),
  ('enterprise', 'Enterprise','For large organizations with advanced needs',  1000, 10000, 50, NULL,  100, 30)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. tenant_feature_flags — per-tenant feature toggles (overrides plan)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature text NOT NULL,                      -- e.g. 'ai_assistant', 'hitl', 'custom_branding'
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, feature)
);

ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users can view own feature flags" ON tenant_feature_flags;
CREATE POLICY "Tenant users can view own feature flags"
ON tenant_feature_flags
FOR SELECT
USING (tenant_id = current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can manage own feature flags" ON tenant_feature_flags;
CREATE POLICY "Admins can manage own feature flags"
ON tenant_feature_flags
FOR ALL
USING (tenant_id = current_user_tenant_id() AND current_user_is_admin())
WITH CHECK (tenant_id = current_user_tenant_id() AND current_user_is_admin());

DROP POLICY IF EXISTS "Platform admins can view all feature flags" ON tenant_feature_flags;
CREATE POLICY "Platform admins can view all feature flags"
ON tenant_feature_flags
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can manage all feature flags" ON tenant_feature_flags;
CREATE POLICY "Platform admins can manage all feature flags"
ON tenant_feature_flags
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- ---------------------------------------------------------------------
-- 3. tenant_usage_meters — monthly usage tracking per tenant
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_usage_meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start date NOT NULL,                 -- first day of the billing month
  period_end date NOT NULL,                   -- last day of the billing month
  ai_queries integer NOT NULL DEFAULT 0,
  ai_tokens_used bigint NOT NULL DEFAULT 0,
  documents_count integer NOT NULL DEFAULT 0,
  chunks_count integer NOT NULL DEFAULT 0,
  storage_bytes bigint NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  hitl_reviews integer NOT NULL DEFAULT 0,
  incidents_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_start)
);

ALTER TABLE tenant_usage_meters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant admins can view own usage" ON tenant_usage_meters;
CREATE POLICY "Tenant admins can view own usage"
ON tenant_usage_meters
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND current_user_is_admin());

DROP POLICY IF EXISTS "Platform admins can view all usage" ON tenant_usage_meters;
CREATE POLICY "Platform admins can view all usage"
ON tenant_usage_meters
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert usage" ON tenant_usage_meters;
CREATE POLICY "Platform admins can insert usage"
ON tenant_usage_meters
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update usage" ON tenant_usage_meters;
CREATE POLICY "Platform admins can update usage"
ON tenant_usage_meters
FOR UPDATE
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS usage_meters_tenant_period_idx
  ON tenant_usage_meters(tenant_id, period_start DESC);

-- ---------------------------------------------------------------------
-- 4. tenant_provisioning_log — audit trail for automated provisioning steps
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_provisioning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  step text NOT NULL,                         -- e.g. 'create_tenant', 'seed_ai_settings', 'create_default_site'
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant_provisioning_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view provisioning log" ON tenant_provisioning_log;
CREATE POLICY "Platform admins can view provisioning log"
ON tenant_provisioning_log
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert provisioning log" ON tenant_provisioning_log;
CREATE POLICY "Platform admins can insert provisioning log"
ON tenant_provisioning_log
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS provisioning_log_tenant_idx
  ON tenant_provisioning_log(tenant_id, created_at);

-- ---------------------------------------------------------------------
-- 5. provision_tenant() — automated onboarding (SECURITY DEFINER)
--    Creates: tenant row + default AI settings + default site.
--    Returns the new tenant id. Called by platform admin via service-role
--    or by the Next.js route handler (which has platform RLS access).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION provision_tenant(
  p_name text,
  p_industry text DEFAULT NULL,
  p_country text DEFAULT 'Australia',
  p_state_or_territory text DEFAULT NULL,
  p_plan text DEFAULT 'standard',
  p_default_site_name text DEFAULT 'Main Site',
  p_default_site_code text DEFAULT 'HQ'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_plan_exists boolean;
BEGIN
  -- Validate plan exists
  SELECT EXISTS(SELECT 1 FROM tenant_plans WHERE id = p_plan AND is_active) INTO v_plan_exists;
  IF NOT v_plan_exists THEN
    RAISE EXCEPTION 'Invalid or inactive plan: %', p_plan;
  END IF;

  -- Create tenant
  INSERT INTO tenants (name, industry, country, state_or_territory, plan, status, is_platform)
  VALUES (p_name, p_industry, p_country, p_state_or_territory, p_plan, 'provisioning', false)
  RETURNING id INTO v_tenant_id;

  -- Log step: tenant created
  INSERT INTO tenant_provisioning_log (tenant_id, step, detail)
  VALUES (v_tenant_id, 'create_tenant', p_name);

  -- Seed default AI settings
  INSERT INTO tenant_ai_settings (tenant_id) VALUES (v_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO tenant_provisioning_log (tenant_id, step, detail)
  VALUES (v_tenant_id, 'seed_ai_settings', 'Default AI settings created');

  -- Create default site
  INSERT INTO sites (tenant_id, name, code)
  VALUES (v_tenant_id, p_default_site_name, p_default_site_code);

  INSERT INTO tenant_provisioning_log (tenant_id, step, detail)
  VALUES (v_tenant_id, 'create_default_site', p_default_site_name);

  -- Activate tenant
  UPDATE tenants SET status = 'active' WHERE id = v_tenant_id;

  INSERT INTO tenant_provisioning_log (tenant_id, step, detail)
  VALUES (v_tenant_id, 'activate_tenant', 'Tenant activated');

  RETURN v_tenant_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. Add tenant_plans RLS for platform audit + platform_tenant_overview
--    extension to include plan label
-- ---------------------------------------------------------------------
-- Update the overview view to join plan label
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
  t.is_platform,
  t.created_at,
  t.updated_at,
  COALESCE(pc.cnt, 0)::int AS user_count,
  COALESCE(dc.cnt, 0)::int AS document_count,
  COALESCE(sc.cnt, 0)::int AS site_count
FROM tenants t
LEFT JOIN (
  SELECT tenant_id, count(*) AS cnt FROM profiles GROUP BY tenant_id
) pc ON pc.tenant_id = t.id
LEFT JOIN (
  SELECT tenant_id, count(*) AS cnt FROM documents GROUP BY tenant_id
) dc ON dc.tenant_id = t.id
LEFT JOIN (
  SELECT tenant_id, count(*) AS cnt FROM sites GROUP BY tenant_id
) sc ON sc.tenant_id = t.id
WHERE t.is_platform = false;
