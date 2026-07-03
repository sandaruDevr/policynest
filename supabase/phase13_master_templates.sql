-- =====================================================================
-- Phase 13: Master Document Governance
-- ---------------------------------------------------------------------
-- Adds:
--   1. master_templates — registry of platform-owned document templates
--   2. master_template_versions — versioned releases of each template
--   3. shadow_propagation_log — audit trail for shadow copy pushes
--   4. propagate_shadow() — SECURITY DEFINER function to push a master
--      template version into one or more tenant libraries as a shadow copy
--   5. Platform RLS: INSERT/UPDATE on documents for platform admins
--      (needed to create master templates and push shadow copies)
--   6. Platform RLS on new tables
--   7. master_template_summary view for the platform directory
--
-- Idempotent. Run AFTER phase12_tenant_management.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. master_templates — platform-owned template registry
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The actual document row in the platform tenant (origin_type = 'master')
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  document_type text NOT NULL DEFAULT 'policy',
  category text,
  pillar text,
  sector text,
  framework text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  risk_level text,

  -- Lifecycle of the template itself (separate from document status)
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'retired')),

  -- Which roles should receive this as a shadow copy
  target_roles text[] NOT NULL DEFAULT '{}',

  -- Current published version label (e.g. 'v2.0')
  current_version text,

  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE master_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage master templates" ON master_templates;
CREATE POLICY "Platform admins can manage master templates"
ON master_templates
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS master_templates_status_idx
  ON master_templates(status, updated_at DESC);

-- ---------------------------------------------------------------------
-- 2. master_template_versions — versioned releases
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES master_templates(id) ON DELETE CASCADE,
  version text NOT NULL,                    -- e.g. 'v1.0', 'v2.0'
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Snapshot of content at this version
  title text NOT NULL,
  content text,
  summary text,
  change_reason text,

  -- Which tenants received this version (array of tenant_ids)
  propagated_to uuid[] NOT NULL DEFAULT '{}',

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'superseded')),

  published_at timestamptz,
  published_by uuid REFERENCES profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

ALTER TABLE master_template_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage template versions" ON master_template_versions;
CREATE POLICY "Platform admins can manage template versions"
ON master_template_versions
FOR ALL
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS master_template_versions_template_idx
  ON master_template_versions(template_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 3. shadow_propagation_log — audit trail for shadow pushes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shadow_propagation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES master_templates(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES master_template_versions(id) ON DELETE CASCADE,

  target_tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- The shadow document created in the tenant library
  shadow_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'pushed'
    CHECK (status IN ('pushed', 'updated', 'skipped', 'failed')),

  detail text,
  pushed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  pushed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shadow_propagation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view propagation log" ON shadow_propagation_log;
CREATE POLICY "Platform admins can view propagation log"
ON shadow_propagation_log
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert propagation log" ON shadow_propagation_log;
CREATE POLICY "Platform admins can insert propagation log"
ON shadow_propagation_log
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

CREATE INDEX IF NOT EXISTS shadow_propagation_template_idx
  ON shadow_propagation_log(template_id, pushed_at DESC);
CREATE INDEX IF NOT EXISTS shadow_propagation_tenant_idx
  ON shadow_propagation_log(target_tenant_id, pushed_at DESC);

-- ---------------------------------------------------------------------
-- 4. Platform RLS: INSERT/UPDATE on documents for platform admins
--    (needed to create master templates in the platform tenant and
--     push shadow copies into customer tenant libraries)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Platform admins can insert documents" ON documents;
CREATE POLICY "Platform admins can insert documents"
ON documents
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can update documents" ON documents;
CREATE POLICY "Platform admins can update documents"
ON documents
FOR UPDATE
USING (current_user_is_platform_admin())
WITH CHECK (current_user_is_platform_admin());

-- Platform admins can insert document chunks (for shadow ingestion)
DROP POLICY IF EXISTS "Platform admins can insert chunks" ON document_chunks;
CREATE POLICY "Platform admins can insert chunks"
ON document_chunks
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

-- Platform admins can view/insert document_versions
DROP POLICY IF EXISTS "Platform admins can view doc versions" ON document_versions;
CREATE POLICY "Platform admins can view doc versions"
ON document_versions
FOR SELECT
USING (current_user_is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert doc versions" ON document_versions;
CREATE POLICY "Platform admins can insert doc versions"
ON document_versions
FOR INSERT
WITH CHECK (current_user_is_platform_admin());

-- ---------------------------------------------------------------------
-- 5. propagate_shadow() — push a master template version into tenant(s)
--
--    Creates or updates a shadow document in each target tenant's library:
--    - If no shadow exists for this template in the tenant: INSERT new doc
--      with origin_type='platform_shadow', source_template_id=template doc
--    - If a shadow already exists: UPDATE the existing shadow doc's content
--      and bump its version
--    - Logs each push to shadow_propagation_log
--    - Returns the number of tenants successfully updated
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION propagate_shadow(
  p_version_id uuid,
  p_target_tenant_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (tenant_id uuid, shadow_document_id uuid, status text, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version record;
  v_template record;
  v_doc record;
  v_target uuid;
  v_shadow_id uuid;
  v_existing_shadow uuid;
  v_status text;
  v_detail text;
BEGIN
  -- Load version + template
  SELECT * INTO v_version FROM master_template_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template version not found: %', p_version_id;
  END IF;

  SELECT * INTO v_template FROM master_templates WHERE id = v_version.template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Master template not found for version';
  END IF;

  -- Resolve targets: explicit list or all active customer tenants
  IF p_target_tenant_ids IS NOT NULL AND array_length(p_target_tenant_ids, 1) > 0 THEN
    FOREACH v_target IN ARRAY p_target_tenant_ids LOOP
      -- Process single tenant inline
      SELECT id INTO v_existing_shadow
      FROM documents
      WHERE tenant_id = v_target
        AND source_template_id = v_template.document_id
        AND origin_type = 'platform_shadow'
      LIMIT 1;

      IF v_existing_shadow IS NOT NULL THEN
        -- Update existing shadow
        UPDATE documents SET
          title = v_version.title,
          content = v_version.content,
          version = v_version.version,
          updated_at = now()
        WHERE id = v_existing_shadow;

        v_shadow_id := v_existing_shadow;
        v_status := 'updated';
        v_detail := 'Shadow updated to ' || v_version.version;
      ELSE
        -- Insert new shadow
        INSERT INTO documents (
          tenant_id, title, document_type, status, version,
          origin_type, source_template_id, content,
          category, pillar, sector, framework, tags, risk_level,
          roles_relevant, created_at, updated_at
        ) VALUES (
          v_target, v_version.title, v_template.document_type, 'published',
          v_version.version, 'platform_shadow', v_template.document_id,
          v_version.content, v_template.category, v_template.pillar,
          v_template.sector, v_template.framework, v_template.tags,
          v_template.risk_level, v_template.target_roles, now(), now()
        )
        RETURNING id INTO v_shadow_id;

        v_status := 'pushed';
        v_detail := 'Shadow created at ' || v_version.version;
      END IF;

      -- Log the propagation
      INSERT INTO shadow_propagation_log (
        template_id, version_id, target_tenant_id,
        shadow_document_id, status, detail
      ) VALUES (
        v_template.id, p_version_id, v_target,
        v_shadow_id, v_status, v_detail
      );

      -- Update version's propagated_to array
      UPDATE master_template_versions
      SET propagated_to = array_append(
        propagated_to,
        v_target
      )
      WHERE id = p_version_id
        AND NOT (v_target = ANY(propagated_to));

      RETURN QUERY SELECT v_target, v_shadow_id, v_status, v_detail;
    END LOOP;
  ELSE
    -- All active customer tenants
    FOR v_target IN
      SELECT id FROM tenants
      WHERE is_platform = false AND status = 'active'
    LOOP
      SELECT id INTO v_existing_shadow
      FROM documents
      WHERE tenant_id = v_target
        AND source_template_id = v_template.document_id
        AND origin_type = 'platform_shadow'
      LIMIT 1;

      IF v_existing_shadow IS NOT NULL THEN
        UPDATE documents SET
          title = v_version.title,
          content = v_version.content,
          version = v_version.version,
          updated_at = now()
        WHERE id = v_existing_shadow;

        v_shadow_id := v_existing_shadow;
        v_status := 'updated';
        v_detail := 'Shadow updated to ' || v_version.version;
      ELSE
        INSERT INTO documents (
          tenant_id, title, document_type, status, version,
          origin_type, source_template_id, content,
          category, pillar, sector, framework, tags, risk_level,
          roles_relevant, created_at, updated_at
        ) VALUES (
          v_target, v_version.title, v_template.document_type, 'published',
          v_version.version, 'platform_shadow', v_template.document_id,
          v_version.content, v_template.category, v_template.pillar,
          v_template.sector, v_template.framework, v_template.tags,
          v_template.risk_level, v_template.target_roles, now(), now()
        )
        RETURNING id INTO v_shadow_id;

        v_status := 'pushed';
        v_detail := 'Shadow created at ' || v_version.version;
      END IF;

      INSERT INTO shadow_propagation_log (
        template_id, version_id, target_tenant_id,
        shadow_document_id, status, detail
      ) VALUES (
        v_template.id, p_version_id, v_target,
        v_shadow_id, v_status, v_detail
      );

      UPDATE master_template_versions
      SET propagated_to = array_append(propagated_to, v_target)
      WHERE id = p_version_id
        AND NOT (v_target = ANY(propagated_to));

      RETURN QUERY SELECT v_target, v_shadow_id, v_status, v_detail;
    END LOOP;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 6. master_template_summary view for the platform directory
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW master_template_summary
WITH (security_invoker = on) AS
SELECT
  mt.id,
  mt.document_id,
  mt.title,
  mt.description,
  mt.document_type,
  mt.category,
  mt.pillar,
  mt.sector,
  mt.framework,
  mt.tags,
  mt.risk_level,
  mt.status,
  mt.target_roles,
  mt.current_version,
  mt.created_at,
  mt.updated_at,
  -- Count of shadow copies across all tenants
  (SELECT count(*) FROM documents d
   WHERE d.source_template_id = mt.document_id
     AND d.origin_type = 'platform_shadow') AS shadow_count,
  -- Count of versions
  (SELECT count(*) FROM master_template_versions mtv
   WHERE mtv.template_id = mt.id) AS version_count,
  -- Latest version label
  (SELECT mtv2.version FROM master_template_versions mtv2
   WHERE mtv2.template_id = mt.id
   ORDER BY mtv2.created_at DESC LIMIT 1) AS latest_version
FROM master_templates mt;
