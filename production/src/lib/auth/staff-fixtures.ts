/**
 * Staff-only fixture users for dev login.
 *
 * These match the prototype's staff fixture IDs and credentials.
 * Admin fixtures are excluded for this staff-only phase.
 */

export interface StaffFixtureUser {
  id: string;
  tenant_id: string;
  tenant_name: string;
  email: string;
  password: string;
  full_name: string;
  staff_role: "registered-nurse"; // Simplified for all fixtures
}

export const STAFF_FIXTURE_USERS: StaffFixtureUser[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    tenant_id: "550e8400-e29b-41d4-a716-446655440000",
    tenant_name: "Sunrise Aged Care",
    email: "staff@sunrise.test",
    password: "test123",
    full_name: "Staff - Sunrise Aged Care",
    staff_role: "registered-nurse",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440021",
    tenant_id: "550e8400-e29b-41d4-a716-446655440001",
    tenant_name: "City General Hospital",
    email: "staff@hospital.test",
    password: "test123",
    full_name: "Staff - City General Hospital",
    staff_role: "registered-nurse",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440031",
    tenant_id: "550e8400-e29b-41d4-a716-446655440002",
    tenant_name: "Community Care Services",
    email: "staff@community.test",
    password: "test123",
    full_name: "Staff - Community Care Services",
    staff_role: "registered-nurse",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440041",
    tenant_id: "550e8400-e29b-41d4-a716-446655440003",
    tenant_name: "Mindful Health Clinic",
    email: "staff@mindful.test",
    password: "test123",
    full_name: "Staff - Mindful Health Clinic",
    staff_role: "registered-nurse",
  },
];
