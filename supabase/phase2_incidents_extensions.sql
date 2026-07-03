-- Phase 2 Incidents Schema Extensions
-- Extends incidents table with additional fields for Phase 2 requirements

-- 1. Extend incidents table with additional columns
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS severity text check (severity in ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS immediate_actions text,
  ADD COLUMN IF NOT EXISTS witnesses text,
  ADD COLUMN IF NOT EXISTS notified_parties text,
  ADD COLUMN IF NOT EXISTS attachments jsonb default '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline jsonb default '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_suggested_next_steps text,
  ADD COLUMN IF NOT EXISTS follow_up_required boolean default false,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz;

-- 2. Enable RLS on incidents (must be on for policies to take effect)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 3. Add index for reference number
CREATE INDEX IF NOT EXISTS incidents_reference_idx ON incidents(reference);
CREATE INDEX IF NOT EXISTS incidents_severity_idx ON incidents(severity);
CREATE INDEX IF NOT EXISTS incidents_category_idx ON incidents(category);

-- 4. Update RLS policies for incidents (tenant-safe)
DROP POLICY IF EXISTS "Users can view own incidents" ON incidents;
DROP POLICY IF EXISTS "Users can insert own incidents" ON incidents;
DROP POLICY IF EXISTS "Users can update own incidents" ON incidents;
DROP POLICY IF EXISTS "Tenant users can view own incidents" ON incidents;
DROP POLICY IF EXISTS "Tenant users can insert own incidents" ON incidents;
DROP POLICY IF EXISTS "Tenant users can update own incidents" ON incidents;

CREATE POLICY "Tenant users can view own incidents"
ON incidents
FOR SELECT
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Tenant users can insert own incidents"
ON incidents
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND submitted_by = auth.uid());

CREATE POLICY "Tenant users can update own incidents"
ON incidents
FOR UPDATE
USING (tenant_id = current_user_tenant_id() AND submitted_by = auth.uid())
WITH CHECK (tenant_id = current_user_tenant_id() AND submitted_by = auth.uid());
