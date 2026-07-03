-- Phase 3 Schema Extensions
-- Training, Compliance, Emergency, Quick Reference, Activity, Notifications, Surveys

-- ============================================
-- Training & Compliance
-- ============================================

CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('induction','module','microlearning','video','competency')),
  category text,
  duration_minutes int DEFAULT 0,
  required boolean DEFAULT false,
  roles_relevant text[] DEFAULT '{}',
  linked_policy_id uuid REFERENCES documents(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started','in-progress','completed','overdue','due-soon')),
  progress_percent int DEFAULT 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS induction_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ord int NOT NULL DEFAULT 0,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('induction','module','microlearning','video','competency')),
  duration_minutes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS induction_progress (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES induction_steps(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed','current','upcoming')),
  completed_at timestamptz,
  PRIMARY KEY (profile_id, step_id)
);

CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  number text,
  issued_at date,
  expires_at date,
  status text DEFAULT 'valid' CHECK (status IN ('valid','expiring-soon','expired','in-review','missing')),
  required boolean DEFAULT false,
  file_path text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Quick Reference
-- ============================================

CREATE TABLE IF NOT EXISTS quick_reference_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('policy','emergency','ai-answer','form','procedure','site-link')),
  title text NOT NULL,
  subtitle text,
  target_type text,
  target_id text,
  target_url text,
  content jsonb,
  pinned_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_ref_pins_unique
  ON quick_reference_pins (profile_id, target_type, target_id);

-- ============================================
-- Activity / History
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ai-question','incident-submitted','training-completed','policy-acknowledged','quick-ref-pinned','credential-updated','survey-submitted','feedback-submitted','bookmark-toggle')),
  at timestamptz DEFAULT now(),
  title text NOT NULL,
  meta jsonb DEFAULT '{}',
  target_id text
);

CREATE INDEX IF NOT EXISTS idx_activity_profile ON activity_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_tenant ON activity_log(tenant_id);

-- ============================================
-- Notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('compliance','training','broadcast','incident','system')),
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','critical')),
  title text NOT NULL,
  body text,
  at timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  href text,
  action_label text
);

CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(profile_id, read) WHERE read = false;

-- ============================================
-- Surveys & Feedback
-- ============================================

CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','draft')),
  question_count int DEFAULT 0,
  estimated_minutes int DEFAULT 0,
  closes_at timestamptz,
  anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  completed_at timestamptz,
  UNIQUE (profile_id, survey_id)
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text NOT NULL,
  message text NOT NULL,
  anonymous boolean DEFAULT false,
  status text DEFAULT 'received',
  submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS safe_voice_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('near-miss', 'improvement', 'psychosocial', 'facility', 'other')),
  message text NOT NULL,
  anonymous boolean DEFAULT true,
  status text DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'actioned')),
  submitted_at timestamptz DEFAULT now()
);

-- ============================================
-- Emergency
-- ============================================

CREATE TABLE IF NOT EXISTS emergency_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('fire','medical','aggression','incident-sirs','facility')),
  title text NOT NULL,
  short_label text NOT NULL,
  description text,
  offline_available boolean DEFAULT true,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_protocol_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES emergency_protocols(id) ON DELETE CASCADE,
  ord int NOT NULL DEFAULT 0,
  title text NOT NULL,
  detail text,
  caution text
);

CREATE TABLE IF NOT EXISTS emergency_protocol_documents (
  protocol_id uuid NOT NULL REFERENCES emergency_protocols(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (protocol_id, document_id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label text NOT NULL,
  role text,
  phone text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  conducted_at timestamptz,
  outcome text NOT NULL CHECK (outcome IN ('passed','review','failed'))
);

-- ============================================
-- Compliance Views
-- ============================================

CREATE OR REPLACE VIEW staff_compliance_items AS
SELECT
  ta.id,
  p.tenant_id,
  ta.profile_id,
  'training'::text AS kind,
  tm.title,
  ta.status AS state,
  ta.due_at AS due_at,
  ta.completed_at,
  tm.linked_policy_id AS linked_document_id,
  ta.module_id AS linked_training_id,
  ta.progress_percent AS progress_percent
FROM training_assignments ta
JOIN training_modules tm ON tm.id = ta.module_id
JOIN profiles p ON p.id = ta.profile_id

UNION ALL

SELECT
  c.id,
  p.tenant_id,
  c.profile_id,
  'credential'::text AS kind,
  c.name AS title,
  CASE
    WHEN c.status = 'expired' THEN 'overdue'
    WHEN c.status = 'expiring-soon' THEN 'due-soon'
    WHEN c.status = 'in-review' THEN 'in-progress'
    ELSE 'complete'
  END AS state,
  c.expires_at::timestamptz AS due_at,
  NULL::timestamptz AS completed_at,
  NULL::uuid AS linked_document_id,
  NULL::uuid AS linked_training_id,
  NULL::int AS progress_percent
FROM credentials c
JOIN profiles p ON p.id = c.profile_id

UNION ALL

-- Completed acknowledgements
SELECT
  da.id,
  da.tenant_id,
  da.profile_id,
  'acknowledgement'::text AS kind,
  d.title,
  'complete'::text AS state,
  NULL::timestamptz AS due_at,
  da.signed_at AS completed_at,
  da.document_id AS linked_document_id,
  NULL::uuid AS linked_training_id,
  NULL::int AS progress_percent
FROM document_acknowledgements da
JOIN documents d ON d.id = da.document_id

UNION ALL

-- Pending acknowledgements (documents requiring acknowledgement but not yet acknowledged)
SELECT
  d.id,
  d.tenant_id,
  p.id AS profile_id,
  'acknowledgement'::text AS kind,
  d.title,
  'pending'::text AS state,
  d.effective_date::timestamptz AS due_at,
  NULL::timestamptz AS completed_at,
  d.id AS linked_document_id,
  NULL::uuid AS linked_training_id,
  NULL::int AS progress_percent
FROM documents d
JOIN profiles p ON p.tenant_id = d.tenant_id
WHERE d.acknowledgement_required = true
AND NOT EXISTS (
  SELECT 1 FROM document_acknowledgements da
  WHERE da.document_id = d.id AND da.profile_id = p.id
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE induction_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE induction_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_reference_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_voice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocol_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocol_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Tenant-safe SELECT policies
CREATE POLICY "Tenant users can view training_modules" ON training_modules FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Tenant users can view training_assignments" ON training_assignments FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Tenant users can view induction_steps" ON induction_steps FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Users can view own induction_progress" ON induction_progress FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Tenant users can view credentials" ON credentials FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Users can manage own quick_reference_pins" ON quick_reference_pins FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Users can view own activity_log" ON activity_log FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Tenant users can view surveys" ON surveys FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Users can view own survey_assignments" ON survey_assignments FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can view own document_acknowledgements" ON document_acknowledgements FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can delete own document_acknowledgements" ON document_acknowledgements FOR DELETE USING (profile_id = auth.uid());
CREATE POLICY "Tenant users can view documents" ON documents FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Users can create feedback_submissions" ON feedback_submissions FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id());
CREATE POLICY "Users can create safe_voice_submissions" ON safe_voice_submissions FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id());
CREATE POLICY "Tenant users can view emergency_protocols" ON emergency_protocols FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Tenant users can view emergency_protocol_steps" ON emergency_protocol_steps FOR SELECT USING (EXISTS (SELECT 1 FROM emergency_protocols ep WHERE ep.id = protocol_id AND ep.tenant_id = current_user_tenant_id()));
CREATE POLICY "Tenant users can view emergency_protocol_documents" ON emergency_protocol_documents FOR SELECT USING (EXISTS (SELECT 1 FROM emergency_protocols ep WHERE ep.id = protocol_id AND ep.tenant_id = current_user_tenant_id()));
CREATE POLICY "Tenant users can view emergency_contacts" ON emergency_contacts FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "Tenant users can view emergency_drills" ON emergency_drills FOR SELECT USING (tenant_id = current_user_tenant_id());

-- INSERT policies for staff
CREATE POLICY "Staff can insert training_assignments" ON training_assignments FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());
CREATE POLICY "Staff can insert induction_progress" ON induction_progress FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Staff can insert credentials" ON credentials FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());
CREATE POLICY "Staff can insert quick_reference_pins" ON quick_reference_pins FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());
CREATE POLICY "Staff can insert activity_log" ON activity_log FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());
CREATE POLICY "Staff can insert survey_assignments" ON survey_assignments FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());
CREATE POLICY "Staff can insert feedback_submissions" ON feedback_submissions FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id());
CREATE POLICY "Staff can insert safe_voice_submissions" ON safe_voice_submissions FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id());
CREATE POLICY "Staff can insert emergency_drills" ON emergency_drills FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id());

-- UPDATE policies
CREATE POLICY "Users can update own training_assignments" ON training_assignments FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can update own induction_progress" ON induction_progress FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can update own credentials" ON credentials FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can update own quick_reference_pins" ON quick_reference_pins FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can update own survey_assignments" ON survey_assignments FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Users can update own feedback_submissions" ON feedback_submissions FOR UPDATE USING (profile_id = auth.uid() OR profile_id IS NULL);
