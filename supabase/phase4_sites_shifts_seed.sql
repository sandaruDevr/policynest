-- Phase 4 Seed Data
-- Sites and Staff Shifts for all demo accounts
-- Uses REAL profile IDs from the database

-- ============================================
-- Sites (one per tenant)
-- ============================================
INSERT INTO sites (id, tenant_id, name, address, code) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Sunrise Aged Care - Brunswick', '123 Sydney Road, Brunswick VIC 3056', 'BRU'),
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'City General Hospital - Main Campus', '456 Elizabeth Street, Melbourne VIC 3000', 'CGH'),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'Community Care Services - North Office', '789 High Street, Preston VIC 3072', 'CCN'),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'Mindful Health Clinic - Richmond', '321 Bridge Road, Richmond VIC 3121', 'MHR')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Assign sites to profiles (REAL profile IDs)
-- ============================================
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440100' WHERE id = 'd3c79e1a-bc1c-4e5f-bdfc-5329c8581513';
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440100' WHERE id = 'ebc69ce9-9b67-4b34-b0b5-a2285f009512';
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440101' WHERE id = '6f61daea-006b-4fc0-bb46-515a6a4ed3b0';
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440102' WHERE id = '40fb3ece-8340-426a-b4f3-601049f92c57';
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440103' WHERE id = 'f0d5e838-84e8-4e63-94d5-4b0884f6e4e9';
UPDATE profiles SET site_id = '550e8400-e29b-41d4-a716-446655440103' WHERE id = '1d151d60-1260-4d35-8661-2dc0ecd2a7e1';

-- ============================================
-- Staff Shifts (REAL profile IDs)
-- ============================================
INSERT INTO staff_shifts (id, tenant_id, profile_id, starts_at, ends_at, label) VALUES
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440000', 'd3c79e1a-bc1c-4e5f-bdfc-5329c8581513', '2025-05-27 08:00:00+10', '2025-05-27 16:00:00+10', 'Morning Shift'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440000', 'ebc69ce9-9b67-4b34-b0b5-a2285f009512', '2025-05-27 14:00:00+10', '2025-05-27 22:00:00+10', 'Afternoon Shift'),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', '6f61daea-006b-4fc0-bb46-515a6a4ed3b0', '2025-05-27 07:00:00+10', '2025-05-27 19:00:00+10', 'Day Shift'),
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440002', '40fb3ece-8340-426a-b4f3-601049f92c57', '2025-05-27 09:00:00+10', '2025-05-27 17:00:00+10', 'Business Hours'),
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440003', 'f0d5e838-84e8-4e63-94d5-4b0884f6e4e9', '2025-05-27 08:00:00+10', '2025-05-27 17:00:00+10', 'Clinic Hours'),
  ('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440003', '1d151d60-1260-4d35-8661-2dc0ecd2a7e1', '2025-05-27 10:00:00+10', '2025-05-27 18:00:00+10', 'Late Start')
ON CONFLICT (id) DO NOTHING;
