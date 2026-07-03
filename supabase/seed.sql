-- Seed data for CareSuite AI Prototype - 4 Testing Organizations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organization 1: Aged Care Facility
INSERT INTO tenants (id, name, industry, country, state_or_territory, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sunrise Aged Care',
  'aged_care',
  'Australia',
  'NSW',
  NOW()
);

-- Organization 2: Hospital
INSERT INTO tenants (id, name, industry, country, state_or_territory, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'City General Hospital',
  'healthcare',
  'Australia',
  'VIC',
  NOW()
);

-- Organization 3: NDIS Provider
INSERT INTO tenants (id, name, industry, country, state_or_territory, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Community Care Services',
  'disability',
  'Australia',
  'QLD',
  NOW()
);

-- Organization 4: Mental Health Clinic
INSERT INTO tenants (id, name, industry, country, state_or_territory, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Mindful Health Clinic',
  'mental_health',
  'Australia',
  'SA',
  NOW()
);

-- Insert sample documents for each tenant
INSERT INTO documents (id, tenant_id, title, document_type, sector, framework, risk_level, version, status, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Falls Management Policy', 'policy', 'aged_care', ARRAY['Aged Care Quality Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Infection Control Protocol', 'policy', 'healthcare', ARRAY['NSQHS Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'NDIS Code of Conduct', 'policy', 'disability', ARRAY['NDIS Practice Standards'], 'medium', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'Crisis Intervention Guidelines', 'policy', 'mental_health', ARRAY['National Safety and Quality Health Service Standards'], 'high', '1.0', 'published', NOW());

-- Insert golden answers
INSERT INTO golden_answers (id, tenant_id, question_pattern, approved_answer, citations, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440000', 'What should I do if a resident falls?', '1. Stay calm and do not move the resident immediately. 2. Assess for injuries and consciousness. 3. Call for assistance. 4. Check vital signs. 5. Document the incident.', '[{"title": "Falls Management Policy", "version": "1.0"}]'::jsonb, NOW()),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'How do I handle a needle stick injury?', '1. Immediately wash the area with soap and water. 2. Report to supervisor. 3. Complete incident report. 4. Seek medical attention for blood testing.', '[{"title": "Infection Control Protocol", "version": "1.0"}]'::jsonb, NOW());

-- NOTE: Profiles must be created via Supabase Auth users first.
-- Use these UUIDs when creating auth users in Supabase dashboard:
-- 
-- Organization 1 (Aged Care):
--   Admin: 550e8400-e29b-41d4-a716-446655440010
--   Staff:  550e8400-e29b-41d4-a716-446655440011
-- 
-- Organization 2 (Hospital):
--   Admin: 550e8400-e29b-41d4-a716-446655440020
--   Staff:  550e8400-e29b-41d4-a716-446655440021
-- 
-- Organization 3 (NDIS):
--   Admin: 550e8400-e29b-41d4-a716-446655440030
--   Staff:  550e8400-e29b-41d4-a716-446655440031
-- 
-- Organization 4 (Mental Health):
--   Admin: 550e8400-e29b-41d4-a716-446655440040
--   Staff:  550e8400-e29b-41d4-a716-446655440041
--
-- After creating auth users, run these INSERT statements:
-- INSERT INTO profiles (id, full_name, role, tenant_id, created_at) VALUES
--   ('550e8400-e29b-41d4-a716-446655440010', 'Admin - Sunrise Aged Care', 'organisation_admin', '550e8400-e29b-41d4-a716-446655440000', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440011', 'Staff - Sunrise Aged Care', 'staff', '550e8400-e29b-41d4-a716-446655440000', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440020', 'Admin - City General Hospital', 'organisation_admin', '550e8400-e29b-41d4-a716-446655440001', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440021', 'Staff - City General Hospital', 'staff', '550e8400-e29b-41d4-a716-446655440001', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440030', 'Admin - Community Care Services', 'organisation_admin', '550e8400-e29b-41d4-a716-446655440002', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440031', 'Staff - Community Care Services', 'staff', '550e8400-e29b-41d4-a716-446655440002', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440040', 'Admin - Mindful Health Clinic', 'organisation_admin', '550e8400-e29b-41d4-a716-446655440003', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440041', 'Staff - Mindful Health Clinic', 'staff', '550e8400-e29b-41d4-a716-446655440003', NOW());
