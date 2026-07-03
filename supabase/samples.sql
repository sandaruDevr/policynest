-- Sample Data for CareSuite AI - 4 Testing Organizations
-- Run this AFTER running schema.sql
-- This file only inserts data, no schema changes

-- Insert 4 Organizations
INSERT INTO tenants (id, name, industry, country, state_or_territory, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Sunrise Aged Care', 'aged_care', 'Australia', 'NSW', NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'City General Hospital', 'healthcare', 'Australia', 'VIC', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Community Care Services', 'disability', 'Australia', 'QLD', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mindful Health Clinic', 'mental_health', 'Australia', 'SA', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample documents for each tenant
INSERT INTO documents (id, tenant_id, title, document_type, sector, framework, risk_level, version, status, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Falls Management Policy', 'policy', 'aged_care', ARRAY['Aged Care Quality Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Infection Control Protocol', 'policy', 'healthcare', ARRAY['NSQHS Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'NDIS Code of Conduct', 'policy', 'disability', ARRAY['NDIS Practice Standards'], 'medium', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'Crisis Intervention Guidelines', 'policy', 'mental_health', ARRAY['National Safety and Quality Health Service Standards'], 'high', '1.0', 'published', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert golden answers
INSERT INTO golden_answers (id, tenant_id, question_pattern, approved_answer, citations, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440000', 'What should I do if a resident falls?', '1. Stay calm and do not move the resident immediately. 2. Assess for injuries and consciousness. 3. Call for assistance. 4. Check vital signs. 5. Document the incident.', '[{"title": "Falls Management Policy", "version": "1.0"}]'::jsonb, NOW()),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'How do I handle a needle stick injury?', '1. Immediately wash the area with soap and water. 2. Report to supervisor. 3. Complete incident report. 4. Seek medical attention for blood testing.', '[{"title": "Infection Control Protocol", "version": "1.0"}]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- NOTE: Users/Profiles are created automatically via the backend endpoint
-- when clicking login buttons on the login page
-- Backend endpoint: POST /api/auth/create-test-user

-- Test user credentials (for reference):
-- Organization 1 (Sunrise Aged Care):
--   Admin: admin@sunrise.test / test123
--   Staff:  staff@sunrise.test / test123
--
-- Organization 2 (City General Hospital):
--   Admin: admin@hospital.test / test123
--   Staff:  staff@hospital.test / test123
--
-- Organization 3 (Community Care Services):
--   Admin: admin@community.test / test123
--   Staff:  staff@community.test / test123
--
-- Organization 4 (Mindful Health Clinic):
--   Admin: admin@mindful.test / test123
--   Staff:  staff@mindful.test / test123
