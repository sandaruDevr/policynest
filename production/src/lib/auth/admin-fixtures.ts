/**
 * Admin-only fixture users for dev login.
 *
 * These mirror the staff fixtures but carry the `organisation_admin` system
 * role so they resolve into the Organization Admin console. Dev-only; gated by
 * NEXT_PUBLIC_ENABLE_DEV_LOGIN.
 */

export interface AdminFixtureUser {
  id: string;
  tenant_id: string;
  tenant_name: string;
  email: string;
  password: string;
  name: string;
  role: "organisation_admin";
}

export const ADMIN_FIXTURE_USERS: AdminFixtureUser[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440111",
    tenant_id: "550e8400-e29b-41d4-a716-446655440000",
    tenant_name: "Sunrise Aged Care",
    email: "admin@sunrise.test",
    password: "test123",
    name: "Admin - Sunrise Aged Care",
    role: "organisation_admin",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440121",
    tenant_id: "550e8400-e29b-41d4-a716-446655440001",
    tenant_name: "City General Hospital",
    email: "admin@hospital.test",
    password: "test123",
    name: "Admin - City General Hospital",
    role: "organisation_admin",
  },
];
