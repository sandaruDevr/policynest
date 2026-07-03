-- Phase 3 Seed Data
-- Training, Emergency, Quick Reference, Activity, Notifications, Surveys

-- Create temporary table to store profile_id for all inserts
DROP TABLE IF EXISTS temp_seed_profile;
CREATE TEMPORARY TABLE temp_seed_profile AS
SELECT
  id AS profile_id,
  tenant_id
FROM (
  SELECT id, tenant_id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
  FROM profiles
) sub
WHERE rn = 1 AND tenant_id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================
-- Training Modules
-- ============================================
INSERT INTO training_modules (id, tenant_id, title, type, category, duration_minutes, required, roles_relevant, linked_policy_id) VALUES
  ('550e8400-e29b-41d4-a716-446655441000', '550e8400-e29b-41d4-a716-446655440000', 'Medication Safety Refresher', 'module', 'Clinical', 25, true, ARRAY['registered-nurse', 'enrolled-nurse'], NULL),
  ('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440000', 'Falls Prevention in Practice', 'module', 'Clinical', 30, true, ARRAY['registered-nurse', 'care-worker'], NULL),
  ('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440000', 'Responsive Behaviours: De-escalation', 'microlearning', 'Behavioural', 8, false, ARRAY['care-worker', 'support-worker'], NULL),
  ('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440000', 'Safe Use of Mechanical Hoists', 'video', 'Manual Handling', 6, false, ARRAY['care-worker', 'support-worker'], NULL),
  ('550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440000', 'SIRS Reportable Incidents', 'module', 'Compliance', 20, true, ARRAY['registered-nurse', 'team-leader'], NULL),
  ('550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440000', 'Informed Consent — Quick Reference', 'microlearning', 'Documentation', 4, false, ARRAY['registered-nurse', 'team-leader'], NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Training Assignments
-- ============================================
INSERT INTO training_assignments (id, tenant_id, profile_id, module_id, status, progress_percent, due_at)
SELECT
  '550e8400-e29b-41d4-a716-446655442000'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441000'::uuid, 'due-soon', 0, '2025-06-15 00:00:00+10'::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655442001'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441001'::uuid, 'in-progress', 60, '2025-06-20 00:00:00+10'::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655442002'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441002'::uuid, 'not-started', 0, NULL::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655442003'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441003'::uuid, 'completed', 100, NULL::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655442004'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441004'::uuid, 'overdue', 30, '2025-05-18 00:00:00+10'::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655442005'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-446655441005'::uuid, 'not-started', 0, NULL::timestamptz
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Induction Steps
-- ============================================
INSERT INTO induction_steps (id, tenant_id, ord, title, type, duration_minutes) VALUES
  ('550e8400-e29b-41d4-a716-446655443000', '550e8400-e29b-41d4-a716-446655440000', 1, 'Welcome & site orientation', 'module', 12),
  ('550e8400-e29b-41d4-a716-446655443001', '550e8400-e29b-41d4-a716-446655440000', 2, 'Code of conduct', 'module', 10),
  ('550e8400-e29b-41d4-a716-446655443002', '550e8400-e29b-41d4-a716-446655440000', 3, 'Clinical safety essentials', 'module', 22),
  ('550e8400-e29b-41d4-a716-446655443003', '550e8400-e29b-41d4-a716-446655440000', 4, 'Emergency response drill', 'competency', 14),
  ('550e8400-e29b-41d4-a716-446655443004', '550e8400-e29b-41d4-a716-446655440000', 5, 'Final sign-off', 'module', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Induction Progress
-- ============================================
INSERT INTO induction_progress (profile_id, step_id, status, completed_at)
SELECT sp.profile_id, '550e8400-e29b-41d4-a716-446655443000'::uuid, 'completed', '2025-04-01 09:00:00+10'::timestamptz FROM temp_seed_profile sp
UNION ALL
SELECT sp.profile_id, '550e8400-e29b-41d4-a716-446655443001'::uuid, 'completed', '2025-04-01 11:00:00+10'::timestamptz FROM temp_seed_profile sp
UNION ALL
SELECT sp.profile_id, '550e8400-e29b-41d4-a716-446655443002'::uuid, 'current', NULL::timestamptz FROM temp_seed_profile sp
UNION ALL
SELECT sp.profile_id, '550e8400-e29b-41d4-a716-446655443003'::uuid, 'upcoming', NULL::timestamptz FROM temp_seed_profile sp
UNION ALL
SELECT sp.profile_id, '550e8400-e29b-41d4-a716-446655443004'::uuid, 'upcoming', NULL::timestamptz FROM temp_seed_profile sp
ON CONFLICT DO NOTHING;

-- ============================================
-- Credentials
-- ============================================
INSERT INTO credentials (id, tenant_id, profile_id, name, issuer, number, issued_at, expires_at, status, required)
SELECT
  '550e8400-e29b-41d4-a716-446655444000'::uuid, sp.tenant_id, sp.profile_id, 'AHPRA Registration', 'Nursing & Midwifery Board of AU', 'NMW0001234567', '2024-05-31'::date, '2025-05-31'::date, 'expiring-soon', true
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655444001'::uuid, sp.tenant_id, sp.profile_id, 'First Aid (HLTAID011)', 'St John Ambulance', NULL, '2024-09-12'::date, '2027-09-12'::date, 'valid', true
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655444002'::uuid, sp.tenant_id, sp.profile_id, 'National Police Check', 'Australian Federal Police', NULL, '2024-04-02'::date, '2027-04-02'::date, 'valid', true
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655444003'::uuid, sp.tenant_id, sp.profile_id, 'NDIS Worker Screening', 'NDIS Quality and Safeguards', NULL, NULL::date, NULL::date, 'in-review', true
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Emergency Protocols
-- ============================================
INSERT INTO emergency_protocols (id, tenant_id, category, title, short_label, description, offline_available) VALUES
  ('550e8400-e29b-41d4-a716-446655445000', '550e8400-e29b-41d4-a716-446655440000', 'fire', 'Fire Emergency Response', 'Fire', 'Detect, alert, contain, evacuate. Follow R.A.C.E. protocol and the site evacuation map.', true),
  ('550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655440000', 'medical', 'Medical Emergency', 'Medical', 'Initial assessment, escalation, and clinical intervention for sudden deterioration or arrest.', true),
  ('550e8400-e29b-41d4-a716-446655445002', '550e8400-e29b-41d4-a716-446655440000', 'aggression', 'Aggression & De-escalation', 'Aggression', 'Personal safety first. Use validated de-escalation techniques and call for support early.', true),
  ('550e8400-e29b-41d4-a716-446655445003', '550e8400-e29b-41d4-a716-446655440000', 'incident-sirs', 'Reportable Incident (SIRS)', 'Incident / SIRS', 'Identify, secure, escalate, and notify within mandated timeframes (24 / 30 days).', true),
  ('550e8400-e29b-41d4-a716-446655445004', '550e8400-e29b-41d4-a716-446655440000', 'facility', 'Facility Failure', 'Flood / Power / Facility', 'Power loss, flood, gas, or building failure. Protect residents, secure clinical equipment.', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Emergency Protocol Steps
-- ============================================
INSERT INTO emergency_protocol_steps (protocol_id, ord, title, detail, caution) VALUES
  ('550e8400-e29b-41d4-a716-446655445000', 1, 'R — Remove', 'Remove anyone in immediate danger from the fire zone.', NULL),
  ('550e8400-e29b-41d4-a716-446655445000', 2, 'A — Alert', 'Activate the nearest fire alarm and call 000.', NULL),
  ('550e8400-e29b-41d4-a716-446655445000', 3, 'C — Contain', 'Close doors and windows behind you to contain the fire.', NULL),
  ('550e8400-e29b-41d4-a716-446655445000', 4, 'E — Evacuate', 'Use the nearest safe evacuation route. Meet at assembly point Alpha.', 'Do not use lifts during evacuation.'),
  ('550e8400-e29b-41d4-a716-446655445001', 1, 'Assess scene safety', 'Ensure your safety before approaching the resident.', NULL),
  ('550e8400-e29b-41d4-a716-446655445001', 2, 'DRSABCD', 'Danger, Response, Send for help, Airway, Breathing, CPR, Defibrillation.', NULL),
  ('550e8400-e29b-41d4-a716-446655445001', 3, 'Call 000 + RN', 'Call 000 for ambulance and notify the RN on duty simultaneously.', NULL),
  ('550e8400-e29b-41d4-a716-446655445001', 4, 'Document', 'Record times, observations, interventions, and notifications.', NULL),
  ('550e8400-e29b-41d4-a716-446655445002', 1, 'Maintain safe distance', 'Position yourself near an exit. Do not corner the person.', NULL),
  ('550e8400-e29b-41d4-a716-446655445002', 2, 'Calm verbal approach', 'Use low tone, short sentences, validate emotion, offer choice.', NULL),
  ('550e8400-e29b-41d4-a716-446655445002', 3, 'Call for support', 'Activate duress alarm or call team leader. Do not attempt restraint alone.', 'Restraint is a last resort and must be authorised.'),
  ('550e8400-e29b-41d4-a716-446655445003', 1, 'Ensure safety', 'Stabilise the situation and the resident.', NULL),
  ('550e8400-e29b-41d4-a716-446655445003', 2, 'Notify', 'Inform RN on duty and team leader immediately.', NULL),
  ('550e8400-e29b-41d4-a716-446655445003', 3, 'Document', 'Lodge incident report before end of shift.', NULL),
  ('550e8400-e29b-41d4-a716-446655445003', 4, 'Escalate to SIRS', 'If reportable, ensure SIRS notification is lodged within 24 hours.', NULL),
  ('550e8400-e29b-41d4-a716-446655445004', 1, 'Account for residents', 'Move residents to safe area if required. Do a head count.', NULL),
  ('550e8400-e29b-41d4-a716-446655445004', 2, 'Notify maintenance', 'Call facility manager immediately and emergency services if dangerous.', NULL),
  ('550e8400-e29b-41d4-a716-446655445004', 3, 'Protect clinical equipment', 'Switch to backup power for critical devices. Document downtime.', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- Emergency Contacts
-- ============================================
INSERT INTO emergency_contacts (id, tenant_id, label, role, phone, is_primary) VALUES
  ('550e8400-e29b-41d4-a716-446655446000', '550e8400-e29b-41d4-a716-446655440000', 'Emergency Services (000)', 'External', '000', true),
  ('550e8400-e29b-41d4-a716-446655446001', '550e8400-e29b-41d4-a716-446655440000', 'On-Call Clinical Lead', 'Internal', '+61 3 9000 1234', true),
  ('550e8400-e29b-41d4-a716-446655446002', '550e8400-e29b-41d4-a716-446655440000', 'Facility Manager', 'Internal', '+61 3 9000 1100', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Emergency Drills
-- ============================================
INSERT INTO emergency_drills (id, tenant_id, title, conducted_at, outcome) VALUES
  ('550e8400-e29b-41d4-a716-446655447000', '550e8400-e29b-41d4-a716-446655440000', 'Quarterly Fire Drill — Wing C', '2025-04-18 11:00:00+10', 'passed'),
  ('550e8400-e29b-41d4-a716-446655447001', '550e8400-e29b-41d4-a716-446655440000', 'Code Black Simulation', '2025-03-09 09:30:00+10', 'review')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Quick Reference Pins
-- ============================================
INSERT INTO quick_reference_pins (id, tenant_id, profile_id, kind, title, subtitle, target_type, target_id, target_url)
SELECT
  '550e8400-e29b-41d4-a716-446655448000'::uuid, sp.tenant_id, sp.profile_id, 'policy', 'Falls Prevention', 'v4.2 · Clinical Safety', 'document', NULL::uuid, '/app/library'
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655448001'::uuid, sp.tenant_id, sp.profile_id, 'emergency', 'Fire Response (R.A.C.E.)', 'Offline available', 'protocol', '550e8400-e29b-41d4-a716-446655445000'::uuid, '/app/emergency'
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655448002'::uuid, sp.tenant_id, sp.profile_id, 'ai-answer', 'Unwitnessed fall — first response', 'Saved from Assistant', NULL, NULL::uuid, NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655448003'::uuid, sp.tenant_id, sp.profile_id, 'form', 'Post-Fall Observation Chart', 'Clinical form', NULL, NULL::uuid, NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655448004'::uuid, sp.tenant_id, sp.profile_id, 'procedure', 'Clinical Handover', 'v2.2', 'document', NULL::uuid, '/app/library'
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655448005'::uuid, sp.tenant_id, sp.profile_id, 'site-link', 'Wing C Evacuation Map', 'Brunswick Care Community', NULL, NULL::uuid, NULL
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Activity Log
-- ============================================
INSERT INTO activity_log (id, tenant_id, profile_id, kind, at, title, target_id)
SELECT
  '550e8400-e29b-41d4-a716-446655449000'::uuid, sp.tenant_id, sp.profile_id, 'ai-question', '2025-05-23 08:55:00+10'::timestamptz, 'Asked: Unwitnessed fall — first response', NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655449001'::uuid, sp.tenant_id, sp.profile_id, 'incident-submitted', '2025-05-22 14:18:00+10'::timestamptz, 'Submitted INC-2025-0498 — Near miss medication', NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655449002'::uuid, sp.tenant_id, sp.profile_id, 'training-completed', '2025-05-20 16:02:00+10'::timestamptz, 'Completed: Safe Use of Mechanical Hoists', NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655449003'::uuid, sp.tenant_id, sp.profile_id, 'policy-acknowledged', '2025-04-12 11:25:00+10'::timestamptz, 'Acknowledged: Falls Prevention v4.2', NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655449004'::uuid, sp.tenant_id, sp.profile_id, 'quick-ref-pinned', '2025-05-23 08:55:30+10'::timestamptz, 'Pinned: Unwitnessed fall — first response', NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-446655449005'::uuid, sp.tenant_id, sp.profile_id, 'survey-submitted', '2025-04-02 13:14:00+10'::timestamptz, 'Submitted: Q1 wellbeing check-in', NULL
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Notifications
-- ============================================
INSERT INTO notifications (id, tenant_id, profile_id, category, level, title, body, at, read, href, action_label)
SELECT
  '550e8400-e29b-41d4-a716-44665544a000'::uuid, sp.tenant_id, sp.profile_id, 'compliance', 'warn', 'AHPRA registration expires in 8 days', 'Renew before 31 May to maintain working status.', '2025-05-23 07:00:00+10'::timestamptz, false, '/app/compliance', 'Update credential'
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-44665544a001'::uuid, sp.tenant_id, sp.profile_id, 'training', 'info', 'Medication Safety Refresher due in 7 days', NULL, '2025-05-23 07:01:00+10'::timestamptz, false, '/app/training', 'Open training'
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-44665544a002'::uuid, sp.tenant_id, sp.profile_id, 'broadcast', 'info', 'Wing C corridor refurbishment — 24 May 8:00–14:00', 'Plan resident routes via central lounge.', '2025-05-22 17:30:00+10'::timestamptz, true, NULL, NULL
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-44665544a003'::uuid, sp.tenant_id, sp.profile_id, 'incident', 'info', 'INC-2025-0492 update from Team Leader', NULL, '2025-05-22 11:14:00+10'::timestamptz, false, '/app/incidents', 'View incident'
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Surveys
-- ============================================
INSERT INTO surveys (id, tenant_id, title, description, status, question_count, estimated_minutes, closes_at, anonymous) VALUES
  ('550e8400-e29b-41d4-a716-44665544b000', '550e8400-e29b-41d4-a716-446655440000', 'Quarterly safety pulse', 'Five questions about safety culture and recent incidents.', 'active', 5, 3, '2025-06-04 00:00:00+10', true),
  ('550e8400-e29b-41d4-a716-44665544b001', '550e8400-e29b-41d4-a716-446655440000', 'Onboarding experience', 'Tell us how the first 30 days went.', 'active', 8, 5, '2025-06-12 00:00:00+10', false),
  ('550e8400-e29b-41d4-a716-44665544b002', '550e8400-e29b-41d4-a716-446655440000', 'Q1 wellbeing check-in', NULL, 'completed', 6, 4, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Survey Assignments
-- ============================================
INSERT INTO survey_assignments (id, tenant_id, profile_id, survey_id, status, completed_at)
SELECT
  '550e8400-e29b-41d4-a716-44665544c000'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-44665544b000'::uuid, 'pending', NULL::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-44665544c001'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-44665544b001'::uuid, 'pending', NULL::timestamptz
FROM temp_seed_profile sp
UNION ALL
SELECT
  '550e8400-e29b-41d4-a716-44665544c002'::uuid, sp.tenant_id, sp.profile_id, '550e8400-e29b-41d4-a716-44665544b002'::uuid, 'completed', '2025-04-02 13:14:00+10'::timestamptz
FROM temp_seed_profile sp
ON CONFLICT (id) DO NOTHING;
