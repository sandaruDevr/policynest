-- Phase 2 Incidents Seed Data
-- Adds sample incidents for each tenant

-- Generate reference numbers for existing incidents and add sample data
UPDATE incidents SET
  reference = 'INC-' || LPAD(id::text, 6, '0'),
  severity = CASE 
    WHEN urgency = 'critical' THEN 'critical'
    WHEN urgency = 'high' THEN 'high'
    WHEN urgency = 'medium' THEN 'medium'
    ELSE 'low'
  END,
  category = CASE 
    WHEN incident_type = 'fall' THEN 'fall'
    WHEN incident_type = 'medication' THEN 'medication'
    WHEN incident_type = 'behavioral' THEN 'behavioral'
    ELSE 'general'
  END,
  location = 'Main Facility',
  occurred_at = created_at,
  immediate_actions = 'Immediate assessment completed, staff notified',
  witnesses = 'Staff on duty',
  notified_parties = 'Supervisor, RN',
  attachments = '[]'::jsonb,
  timeline = jsonb_build_array(
    jsonb_build_object('time', created_at::text, 'action', 'Incident reported')
  ),
  follow_up_required = true
WHERE reference IS NULL;

-- Add sample incidents for each tenant using an existing profile
-- This CTE picks one profile per tenant to satisfy the FK constraint
WITH sample_profiles AS (
  SELECT
    id AS profile_id,
    tenant_id
  FROM (
    SELECT id, tenant_id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
    FROM profiles
  ) sub
  WHERE rn = 1
)
INSERT INTO incidents (
  id,
  tenant_id,
  submitted_by,
  incident_type,
  description,
  urgency,
  status,
  reference,
  severity,
  category,
  location,
  occurred_at,
  immediate_actions,
  witnesses,
  notified_parties,
  follow_up_required
)
SELECT
  gen_random_uuid(),
  sp.tenant_id,
  sp.profile_id,
  'fall',
  'Resident fell in hallway while ambulating to dining room. No visible injuries reported.',
  'medium',
  'submitted',
  'INC-' || LPAD((floor(random() * 1000000))::text, 6, '0'),
  'medium',
  'fall',
  'Hallway B, Wing 2',
  now() - interval '2 hours',
  'Resident assisted to chair, vitals checked, RN notified',
  'Care worker on duty, another resident',
  'RN, Supervisor, Family',
  true
FROM sample_profiles sp
WHERE sp.tenant_id = '550e8400-e29b-41d4-a716-446655440000'

UNION ALL

SELECT
  gen_random_uuid(),
  sp.tenant_id,
  sp.profile_id,
  'medication',
  'Near miss - wrong medication almost administered. Caught during barcode scan verification.',
  'high',
  'submitted',
  'INC-' || LPAD((floor(random() * 1000000))::text, 6, '0'),
  'high',
  'medication',
  'Ward 3, Room 12',
  now() - interval '5 hours',
  'Medication returned to pharmacy, incident report filed',
  'Nurse administering, pharmacist',
  'Charge Nurse, Risk Management',
  true
FROM sample_profiles sp
WHERE sp.tenant_id = '550e8400-e29b-41d4-a716-446655440001'

UNION ALL

SELECT
  gen_random_uuid(),
  sp.tenant_id,
  sp.profile_id,
  'behavioral',
  'Client exhibited aggressive behavior during home visit. Worker de-escalated situation safely.',
  'medium',
  'submitted',
  'INC-' || LPAD((floor(random() * 1000000))::text, 6, '0'),
  'medium',
  'behavioral',
  'Client home - Living Room',
  now() - interval '1 day',
  'De-escalation techniques used, client calmed, support worker remained on site',
  'Family member present',
  'Supervisor, Client GP',
  true
FROM sample_profiles sp
WHERE sp.tenant_id = '550e8400-e29b-41d4-a716-446655440002'

UNION ALL

SELECT
  gen_random_uuid(),
  sp.tenant_id,
  sp.profile_id,
  'general',
  'Client reported feeling unsafe during session. Safety plan activated.',
  'high',
  'submitted',
  'INC-' || LPAD((floor(random() * 1000000))::text, 6, '0'),
  'high',
  'general',
  'Consultation Room 2',
  now() - interval '3 hours',
  'Safety plan reviewed, crisis team notified, client supported until safe transport arranged',
  'None',
  'Crisis team, Emergency contacts',
  true
FROM sample_profiles sp
WHERE sp.tenant_id = '550e8400-e29b-41d4-a716-446655440003';
