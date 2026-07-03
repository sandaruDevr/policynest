-- Phase 2 Library Seed Data
-- Adds document sections for existing documents, sample bookmarks, acknowledgements

-- Ensure base documents exist (idempotent)
INSERT INTO documents (id, tenant_id, title, document_type, sector, framework, risk_level, version, status, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Falls Management Policy', 'policy', 'aged_care', ARRAY['Aged Care Quality Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Infection Control Protocol', 'policy', 'healthcare', ARRAY['NSQHS Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'NDIS Code of Conduct', 'policy', 'disability', ARRAY['NDIS Practice Standards'], 'medium', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'Crisis Intervention Guidelines', 'policy', 'mental_health', ARRAY['National Safety and Quality Health Service Standards'], 'high', '1.0', 'published', NOW())
ON CONFLICT (id) DO NOTHING;

-- Document sections for the 4 seeded documents
INSERT INTO document_sections (id, tenant_id, document_id, anchor, title, body, ord) VALUES
  -- Sunrise Aged Care - Falls Management Policy
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'purpose', 'Purpose', 'This policy outlines the procedures for managing falls in aged care facilities to ensure resident safety and proper response protocols.', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'response', 'Immediate Response', 'When a fall occurs, staff must immediately assess the resident for injuries, check consciousness, and call for assistance. Do not move the resident until assessment is complete.', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'documentation', 'Documentation', 'All falls must be documented in the incident report within 24 hours, including time, location, witnesses, and actions taken.', 3),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'follow-up', 'Follow-up Care', 'After a fall, the resident must be monitored for 48 hours for any delayed symptoms. Notify family if required.', 4),

  -- City General Hospital - Infection Control Protocol
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'hand-hygiene', 'Hand Hygiene', 'All staff must perform hand hygiene before and after patient contact using WHO 5 moments technique.', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'ppe', 'Personal Protective Equipment', 'PPE must be worn according to the transmission-based precautions: gloves, gowns, masks, and eye protection as required.', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'exposure', 'Exposure Incidents', 'Report all needle stick injuries and blood exposures immediately to supervisor and complete incident report.', 3),

  -- Community Care Services - NDIS Code of Conduct
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'respect', 'Respect and Dignity', 'Treat all participants with respect and dignity, honoring their individual choices and cultural background.', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'privacy', 'Privacy and Confidentiality', 'Maintain confidentiality of participant information at all times. Only share information with authorized personnel.', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'safety', 'Safety and Wellbeing', 'Prioritize participant safety and wellbeing. Report any concerns immediately to the appropriate authority.', 3),

  -- Mindful Health Clinic - Crisis Intervention Guidelines
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440103', 'assessment', 'Risk Assessment', 'Conduct immediate risk assessment for self-harm, harm to others, or inability to care for self.', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440103', 'de-escalation', 'De-escalation Techniques', 'Use verbal de-escalation techniques: speak calmly, maintain safe distance, validate feelings, and offer choices.', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440103', 'emergency', 'Emergency Response', 'If immediate danger exists, call emergency services and secure the environment. Do not attempt physical intervention unless trained.', 3)
ON CONFLICT (document_id, anchor) DO NOTHING;

-- Update documents with library-specific fields
UPDATE documents SET
  category = 'clinical',
  pillar = 'safety',
  tags = ARRAY['falls', 'safety', 'incident'],
  summary = 'Procedures for managing falls in aged care facilities including immediate response, documentation, and follow-up care.',
  acknowledgement_required = true,
  estimated_read_minutes = 5
WHERE id = '550e8400-e29b-41d4-a716-446655440100';

UPDATE documents SET
  category = 'clinical',
  pillar = 'infection-control',
  tags = ARRAY['infection', 'ppe', 'hygiene'],
  summary = 'Infection control protocols including hand hygiene, PPE requirements, and exposure incident reporting.',
  acknowledgement_required = true,
  estimated_read_minutes = 7
WHERE id = '550e8400-e29b-41d4-a716-446655440101';

UPDATE documents SET
  category = 'governance',
  pillar = 'compliance',
  tags = ARRAY['ndis', 'code-of-conduct', 'rights'],
  summary = 'NDIS Code of Conduct outlining respect, privacy, and safety requirements for disability support workers.',
  acknowledgement_required = true,
  estimated_read_minutes = 10
WHERE id = '550e8400-e29b-41d4-a716-446655440102';

UPDATE documents SET
  category = 'clinical',
  pillar = 'mental-health',
  tags = ARRAY['crisis', 'de-escalation', 'emergency'],
  summary = 'Guidelines for crisis intervention including risk assessment, de-escalation techniques, and emergency response.',
  acknowledgement_required = true,
  estimated_read_minutes = 8
WHERE id = '550e8400-e29b-41d4-a716-446655440103';

-- Insert related documents so links resolve correctly
INSERT INTO documents (id, tenant_id, title, document_type, sector, framework, risk_level, version, status, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440000', 'Fall Incident Report Form', 'form', 'aged_care', ARRAY['Aged Care Quality Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440000', 'FAQ: What to do after a fall', 'fact-sheet', 'aged_care', ARRAY['Aged Care Quality Standards'], 'medium', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440001', 'Infection Control Checklist', 'form', 'healthcare', ARRAY['NSQHS Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440002', 'Medication Error Reporting Form', 'form', 'ndis', ARRAY['NDIS Practice Standards'], 'high', '1.0', 'published', NOW()),
  ('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440003', 'Emergency Evacuation Checklist', 'form', 'home_care', ARRAY['Home Care Standards'], 'high', '1.0', 'published', NOW())
ON CONFLICT DO NOTHING;

-- Add sample related documents (same tenant only)
-- Falls Management (tenant 550e8400-e29b-41d4-a716-446655440000)
INSERT INTO document_related (document_id, related_id, related_type, title) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440104', 'form', 'Fall Incident Report Form'),
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440105', 'faq', 'FAQ: What to do after a fall');

-- Infection Control (tenant 550e8400-e29b-41d4-a716-446655440001)
INSERT INTO document_related (document_id, related_id, related_type, title) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440106', 'form', 'Infection Control Checklist');

-- Medication (tenant 550e8400-e29b-41d4-a716-446655440002)
INSERT INTO document_related (document_id, related_id, related_type, title) VALUES
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440107', 'form', 'Medication Error Reporting Form');

-- Emergency (tenant 550e8400-e29b-41d4-a716-446655440003)
INSERT INTO document_related (document_id, related_id, related_type, title) VALUES
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440108', 'form', 'Emergency Evacuation Checklist');

-- NOTE: Profiles/bookmarks/acknowledgements require auth users first.
-- Create test users via the backend endpoint (POST /api/auth/create-test-user),
-- then run these INSERTs separately or via the application UI.
