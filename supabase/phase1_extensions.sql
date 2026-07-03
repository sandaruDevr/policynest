-- Phase 1 Schema Extensions for Staff Role
-- Adds profiles extensions, sites, staff_shifts, and notifications tables

-- 1. Extend profiles table with staff-specific columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS staff_role text,
  ADD COLUMN IF NOT EXISTS sectors text[] default '{}',
  ADD COLUMN IF NOT EXISTS primary_sector text,
  ADD COLUMN IF NOT EXISTS locale text default 'en-AU',
  ADD COLUMN IF NOT EXISTS presence text check (presence in ('available','in-care','break','offline')) default 'available',
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  code text,
  created_at timestamptz not null default now()
);

-- 3. Create staff_shifts table
CREATE TABLE IF NOT EXISTS staff_shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text,
  created_at timestamptz not null default now()
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  category text not null check (category in ('compliance','training','incident','broadcast','survey','system')),
  level text not null check (level in ('info','warn','critical')),
  title text not null,
  body text,
  at timestamptz not null default now(),
  read boolean not null default false,
  href text,
  action_label text,
  created_at timestamptz not null default now()
);

-- 5. Enable RLS on new tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for sites
CREATE POLICY "Tenant users can view own sites"
ON sites
FOR SELECT
USING (tenant_id = current_user_tenant_id());

-- 7. RLS Policies for staff_shifts
CREATE POLICY "Users can view own shifts"
ON staff_shifts
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

CREATE POLICY "Users can insert own shifts"
ON staff_shifts
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

-- 8. RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

CREATE POLICY "Users can insert own notifications"
ON notifications
FOR INSERT
WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
USING (tenant_id = current_user_tenant_id() AND profile_id = auth.uid())
WITH CHECK (tenant_id = current_user_tenant_id() AND profile_id = auth.uid());

-- 9. Add foreign key constraint for profiles.site_id to sites table
-- This may fail if there are existing profiles with invalid site_ids, so we add it as NOT VALID first
DO $$
BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_site_id_fkey
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
    NOT VALID;
  
  -- Validate the constraint after ensuring data integrity
  ALTER TABLE profiles
    VALIDATE CONSTRAINT profiles_site_id_fkey;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add site_id foreign key constraint. This may be due to existing invalid site_id values.';
END $$;

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS sites_tenant_idx ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS staff_shifts_profile_idx ON staff_shifts(profile_id);
CREATE INDEX IF NOT EXISTS staff_shifts_tenant_idx ON staff_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS notifications_profile_idx ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_tenant_idx ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read) WHERE read = false;
